import { unstable_rethrow } from 'next/navigation';
import { createClient } from './supabase';

// Throw this from a route to send an error message to the browser.
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Wraps a route handler: sends its result as JSON, and any error as { error: "message" }.
// A handler can also return its own Response (e.g. to add headers).
export function route<Ctx>(handler: (req: Request, ctx: Ctx) => Promise<unknown>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      const result = await handler(req, ctx);
      return result instanceof Response ? result : Response.json(result);
    } catch (err) {
      unstable_rethrow(err); // let Next.js handle its own internal signals
      if (err instanceof ApiError) return Response.json({ error: err.message }, { status: err.status });
      if (err instanceof SyntaxError) return Response.json({ error: 'Invalid JSON.' }, { status: 400 });
      console.error(err);
      return Response.json({ error: 'Something went wrong.' }, { status: 500 });
    }
  };
}

// Returns the Supabase client and the logged-in user, or fails with 401.
export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new ApiError(401, 'Please log in.');
  return { supabase, user: data.user };
}

// Reads a JSON body that must be an object; fails with 400 otherwise.
export async function readBody(req: Request): Promise<Record<string, unknown>> {
  const body: unknown = await req.json();
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'Expected a JSON object.');
  return body as Record<string, unknown>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Product ids are uuids. Anything else can't match a product.
export function checkProductId(id: unknown): string {
  if (typeof id !== 'string' || !UUID.test(id)) throw new ApiError(404, 'Product not found.');
  return id;
}
