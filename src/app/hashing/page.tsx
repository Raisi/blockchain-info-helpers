import { PageShell } from "@/components/layout";
import { VisualizationShell } from "@/components/visualizations/VisualizationShell";
import HashingVisualizer from "@/components/visualizations/hashing/HashingVisualizer";

export default function HashingPage() {
  return (
    <PageShell>
      <VisualizationShell
        title="Was ist Hashing?"
        description="Wie SHA-256 aus beliebigen Daten einen einzigartigen Fingerabdruck erzeugt"
        topic="hashing"
      >
        <HashingVisualizer />
      </VisualizationShell>
    </PageShell>
  );
}
