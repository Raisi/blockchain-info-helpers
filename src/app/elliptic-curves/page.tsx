import { PageShell } from "@/components/layout";
import { VisualizationShell } from "@/components/visualizations/VisualizationShell";
import EllipticCurvesVisualizer from "@/components/visualizations/elliptic-curves/EllipticCurvesVisualizer";

export default function EllipticCurvesPage() {
  return (
    <PageShell>
      <VisualizationShell
        title="Elliptische Kurven"
        description="Punkt-Addition auf secp256k1 — die Mathematik hinter Bitcoin"
        topic="elliptic-curves"
      >
        <EllipticCurvesVisualizer />
      </VisualizationShell>
    </PageShell>
  );
}
