import { Suspense } from "react";
import Shop from "@/components/shop/Shop";
import { ProductGridSkeleton } from "@/components/ui/States";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-10">
          <ProductGridSkeleton />
        </div>
      }
    >
      <Shop />
    </Suspense>
  );
}
