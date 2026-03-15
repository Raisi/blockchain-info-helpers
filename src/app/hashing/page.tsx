import { PageShell } from "@/components/layout";
import { VisualizationShell } from "@/components/visualizations/VisualizationShell";
import HashingVisualizer from "@/components/visualizations/hashing/HashingVisualizer";

export default function HashingPage() {
  return (
    <PageShell>
      <VisualizationShell
        title="Hashing & SHA-256"
        description="Von Daten zum digitalen Fingerabdruck — interaktiv erkunden, wie SHA-256 funktioniert"
        topic="hashing"
      >
        <HashingVisualizer />
      </VisualizationShell>
    </PageShell>
  );
}
