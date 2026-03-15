import { PageShell } from "@/components/layout";
import { VisualizationShell } from "@/components/visualizations/VisualizationShell";
import ZpubVisualizer from "@/components/visualizations/zpub/ZpubVisualizer";

export default function ZpubPage() {
  return (
    <PageShell>
      <VisualizationShell
        title="zpub Key Generation"
        description="Vom Mnemonic zum Extended Public Key — 5 Schritte der Ableitung interaktiv erklärt"
        topic="zpub"
      >
        <ZpubVisualizer />
      </VisualizationShell>
    </PageShell>
  );
}
