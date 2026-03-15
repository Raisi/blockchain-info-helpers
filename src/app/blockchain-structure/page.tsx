import { PageShell } from "@/components/layout";
import { VisualizationShell } from "@/components/visualizations/VisualizationShell";
import BlockchainVisualizer from "@/components/visualizations/blockchain-structure/BlockchainVisualizer";

export default function BlockchainStructurePage() {
  return (
    <PageShell>
      <VisualizationShell
        title="Wie funktioniert eine Blockchain?"
        description="Blockaufbau interaktiv — baue, mine und manipuliere eine Blockchain"
        topic="blockchain-structure"
      >
        <BlockchainVisualizer />
      </VisualizationShell>
    </PageShell>
  );
}
