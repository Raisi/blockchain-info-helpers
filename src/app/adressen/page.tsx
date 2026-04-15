import { Suspense } from "react";
import { AdressenVisualizer } from "@/components/visualizations/adressen/AdressenVisualizer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bitcoin Adressen" };

export default async function AdressenPage({
  searchParams,
}: {
  searchParams: Promise<{ pubkey?: string }>;
}) {
  const { pubkey } = await searchParams;
  return (
    <main>
      <Suspense>
        <AdressenVisualizer initialPubkey={pubkey} />
      </Suspense>
    </main>
  );
}
