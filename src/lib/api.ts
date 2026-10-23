import { unstable_rethrow } from 'next/navigation';
import { createClient } from './supabase';

// Throw this from a route to send an error message to the browser.
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Wraps a route handler: sends its result as JSON, and any error as { error: "message" }.
export function route<Ctx>(handler: (req: Request, ctx: Ctx) => Promise<unknown>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      return Response.json(await handler(req, ctx));
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
