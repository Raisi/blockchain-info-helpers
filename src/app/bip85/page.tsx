import { PageShell } from "@/components/layout";
import { VisualizationShell } from "@/components/visualizations/VisualizationShell";
import Bip85Visualizer from "@/components/visualizations/bip85/Bip85Visualizer";

export default function Bip85Page() {
  return (
    <PageShell>
      <VisualizationShell
        title="BIP-85 Child Seeds"
        description="Wie aus einem Master-Seed weitere unabhängige Seeds abgeleitet werden"
        topic="bip85"
      >
        <Bip85Visualizer />
      </VisualizationShell>
    </PageShell>
  );
}
