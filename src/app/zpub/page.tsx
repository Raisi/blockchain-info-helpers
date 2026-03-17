import { PageShell } from "@/components/layout";
import { VisualizationShell } from "@/components/visualizations/VisualizationShell";
import ZpubVisualizer from "@/components/visualizations/zpub/ZpubVisualizer";

export default function ZpubPage() {
  return (
    <PageShell>
      <VisualizationShell
        title="Was ist ein zpub (Extended Public Key)?"
        description="Vom Public Key zur Watch-Only Wallet — wie ein zpub Adressen erzeugt, ohne Private Keys zu kennen"
        topic="zpub"
      >
        <ZpubVisualizer />
      </VisualizationShell>
    </PageShell>
  );
}
