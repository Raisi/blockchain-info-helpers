import { PageShell } from "@/components/layout";
import { VisualizationShell } from "@/components/visualizations/VisualizationShell";
import ZpubVisualizer from "@/components/visualizations/zpub/ZpubVisualizer";

export default function ZpubPage() {
  return (
    <PageShell>
      <VisualizationShell
        title="Was ist ein zpub (Extended Public Key)?"
        description="Die 5 Schritte vom Seed zum zpub — dem Schlüssel, der deine Adressen erzeugt"
        topic="zpub"
      >
        <ZpubVisualizer />
      </VisualizationShell>
    </PageShell>
  );
}
