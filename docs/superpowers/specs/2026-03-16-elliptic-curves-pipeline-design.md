# Elliptic Curves Pipeline: "Der Weg zum Schlüssel"

## Problem

Die 4 Tabs der elliptischen Kurven-Visualisierung (Die Kurve, Punkt-Addition, Skalarmultiplikation, Schlüssel-Erzeugung) sind vollständig isoliert. Es gibt keinen gemeinsamen State, keine visuelle Verbindung, und keinen narrativen Bogen, der zeigt, wie die Konzepte zusammenhängen und zur Schlüsselerzeugung führen.

## Lösung

Eine Pipeline mit linearem Freischalten, hybridem Datenfluss zwischen Tabs, und einer Weltenwechsel-Animation beim Übergang von reellen Zahlen zu echtem secp256k1.

---

## 1. Pipeline-Bar (ersetzt aktuelle Tab-Leiste)

**Design:** Verbundene Karten, die nahtlos aneinander liegen. Jede Karte zeigt den Tab-Namen und die mathematische Operation.

**Zustände:**
- **Abgeschlossen:** Cyan-Hintergrund (`rgba(34,211,238,0.1)`), Cyan-Border, Häkchen
- **Aktiv:** Violett-Hintergrund (`rgba(139,92,246,0.15)`), Violett-Border, Glow-Effekt (`box-shadow: 0 0 12px rgba(139,92,246,0.2)`)
- **Gesperrt:** Dunkelgrau (`#111827`), Border `#1e293b`, Schloss-Icon, gedimmter Text

**Karten-Inhalt:**
| Tab | Label | Operation |
|-----|-------|-----------|
| 1 | Die Kurve | y² = x³ + 7 |
| 2 | Addition | P + Q = R |
| 3 | Skalar-Mul | n × G |
| 4 | Schlüssel | k → K |

**Verhalten:**
- Abgeschlossene Tabs sind klickbar (Revisit erlaubt)
- Aktiver Tab ist hervorgehoben
- Gesperrte Tabs sind nicht klickbar, visuell gedimmt
- Beim Freischalten: GSAP-Animation — nächste Karte leuchtet kurz auf (Glow-Pulse)

**Responsive:** Auf Mobile horizontal scrollbare Leiste mit `overflow-x: auto` und `scroll-snap-type: x mandatory`. Die Karten behalten ihre Mindestbreite (~120px), der aktive Tab wird per `scrollIntoView` zentriert.

---

## 2. Lineares Freischalten

Tabs 2–4 sind initial gesperrt. Jeder Tab hat Completion-Kriterien, die den nächsten freischalten:

| Übergang | Kriterien |
|----------|-----------|
| Tab 1 → 2 | ≥ 2 Punkte auf die Kurve gesetzt |
| Tab 2 → 3 | Konstruktion (P+Q) einmal vollständig abgespielt (= `animStep === "done"`) + P oder Q einmal gedraggt |
| Tab 3 → 4 | Slider bewegt (Skalar verändert) + Schritt-für-Schritt-Modus einmal gestartet |

**State-Tracking:**
```typescript
interface CompletionState {
  tab1: { pointsPlaced: number };
  tab2: { constructionCompleted: boolean; pointDragged: boolean };
  tab3: { sliderMoved: boolean; stepModeStarted: boolean };
}
```

**Completion-Checks (in `constants.ts`):**
```typescript
export const COMPLETION_CHECKS: Record<string, (state: CompletionState) => boolean> = {
  curve: (s) => s.tab1.pointsPlaced >= 2,
  addition: (s) => s.tab2.constructionCompleted && s.tab2.pointDragged,
  scalar: (s) => s.tab3.sliderMoved && s.tab3.stepModeStarted,
};
```

**UX:** Kein expliziter "Weiter"-Button. Wenn Kriterien erfüllt, animiert die Pipeline-Bar den nächsten Tab als freigeschaltet (Glow-Pulse + Farbwechsel von Grau zu Violett). Der User klickt dann die Pipeline-Karte.

---

## 3. Hybrider Datenfluss

### Tab 1 → Tab 2
- Punkte, die der User in Tab 1 auf die Kurve gesetzt hat, erscheinen als mögliche Startpositionen für P und Q in Tab 2
- Die ersten zwei gesetzten Punkte werden als Default-P und Default-Q voreingestellt
- User kann P/Q weiterhin frei draggen

### Tab 2 → Tab 3
- Das Ergebnis `result` (Typ `CurvePoint2D`) aus dem `AdditionResult`-Objekt von Tab 2 wird als Basispunkt in Tab 3 voreingestellt
- Falls `addPoints()` `null` zurückgibt (Punkt im Unendlichen): Fallback auf Standard-Basispunkt
- Tab 3 zeigt einen Hinweis: "Basispunkt G = R aus der Addition (x, y)"

### Tab 3 → Tab 4 (Weltenwechsel)
- Der gewählte Skalar n aus Tab 3 wird als konzeptioneller Private Key in Tab 4 übernommen
- Tab 4 zeigt zwei Ansichten:
  1. **Konzeptionelle Brücke:** "Dein Skalar n = [Wert] — bei Bitcoin wäre das dein Private Key, nur mit einer 256-bit Zufallszahl statt einer kleinen Zahl."
  2. **Echte Key-Generation:** Generiert weiterhin einen kryptografisch sicheren Random-Key (wie bisher), aber zeigt parallel: "n = [kleiner Skalar] × G = [Punkt]" vs. "k = [256-bit] × G = [Public Key]" — der konzeptionelle Vergleich macht den Zusammenhang klar, ohne eine unsichere kleine Zahl als echten Key zu verwenden
- Canvas-Übergangsanimation (siehe Abschnitt 4)

### Revisit-Verhalten (Upstream-Änderungen)
Wenn ein User zu einem abgeschlossenen Tab zurückkehrt und Daten ändert (z.B. Punkte in Tab 1 zurücksetzt):
- **Downstream-Tabs behalten ihren letzten State.** Es gibt kein Re-Locking.
- Downstream-Tabs zeigen einen dezenten Hinweis: *"Die Basisdaten haben sich geändert. [Aktualisieren]"* — Klick auf "Aktualisieren" übernimmt die neuen Upstream-Werte.
- Begründung: Re-Locking wäre frustrierend; stille Invalidierung wäre verwirrend. Der Hinweis gibt dem User Kontrolle.

---

## 4. Weltenwechsel-Animation (Tab 3 → Tab 4)

**Rendering:** Tab 4 rendert temporär eine `CurveCanvas`-Instanz für die Animation. Nach Abschluss wird der Canvas ausgeblendet (`display: none`) und die normale KeyGeneration-UI eingeblendet.

GSAP-Timeline beim ersten Öffnen von Tab 4:

1. **Phase 1 — Kurve fragmentiert** (~1s): Die temporäre CurveCanvas zeigt die glatte Kurve, die dann "zerbricht" — die Linie wird zu einzelnen Punkten, die sich auf ein Raster verteilen
2. **Phase 2 — Skalar wandert** (~0.8s): Der Skalar n animiert aus einer "n × G"-Anzeige in ein "Private Key"-Feld
3. **Phase 3 — Text-Overlay** (~0.6s): Erklärender Text blendet ein: *"Gleiche Gleichung, gleiche Operationen — aber jetzt über einem endlichen Körper. Dein Skalar wird zum Private Key."*
4. **Phase 4 — Key Generation** (~0.5s): CurveCanvas wird ausgeblendet, normale Tab-4-Ansicht eingeblendet, Key-Generation startet

Die Animation spielt nur beim ersten Besuch von Tab 4. Bei erneutem Besuch: direkter Einstieg (gesteuert durch `hasSeenWorldSwitch` State).

---

## 5. Architektur

### Shared State in EllipticCurvesVisualizer

```typescript
// Neuer State im EllipticCurvesVisualizer
const [placedPoints, setPlacedPoints] = useState<CurvePoint2D[]>([]);
const [additionResultPoint, setAdditionResultPoint] = useState<CurvePoint2D | null>(null);
const [scalar, setScalar] = useState<number>(2);
const [unlockedTabs, setUnlockedTabs] = useState<Set<string>>(new Set(["curve"]));
const [completedTabs, setCompletedTabs] = useState<Set<string>>(new Set());
const [completion, setCompletion] = useState<CompletionState>(initialCompletionState);
const [hasSeenWorldSwitch, setHasSeenWorldSwitch] = useState(false);

// Completion-Check Effect: wenn Kriterien erfüllt → Tab unlocken + als completed markieren
useEffect(() => {
  for (const [tabId, check] of Object.entries(COMPLETION_CHECKS)) {
    if (check(completion) && !completedTabs.has(tabId)) {
      setCompletedTabs(prev => new Set(prev).add(tabId));
      const nextTab = getNextTab(tabId);
      if (nextTab) setUnlockedTabs(prev => new Set(prev).add(nextTab));
    }
  }
}, [completion]);
```

### Props-Änderungen pro Tab

**TheCurve.tsx:**
- Neues Prop: `onPointsChange: (points: CurvePoint2D[]) => void` — called bei jedem Punkt-Setzen/Reset
- `placedPoints` State wird aus der Komponente nach oben gehoben

**PointAddition.tsx:**
- Neues Prop: `initialPoints?: CurvePoint2D[]` — Startpositionen für P/Q aus Tab 1
- Neues Prop: `onResultChange: (point: CurvePoint2D | null) => void` — called wenn P+Q-Ergebnis sich ändert. Extrahiert `result` aus `AdditionResult`.
- Completion-Tracking: `onConstructionComplete` fired wenn `animStep` auf `"done"` wechselt; `onPointDragged` fired beim ersten Drag-Event

**ScalarMultiplication.tsx:**
- Neues Prop: `basePoint?: CurvePoint2D` — Basispunkt aus Tab 2 (überschreibt Default)
- Neues Prop: `onScalarChange: (n: number) => void` — called bei Slider-Änderung
- Completion-Tracking: analog über Callbacks

**KeyGeneration.tsx:**
- Neues Prop: `scalar: number` — Skalar aus Tab 3 für konzeptionellen Vergleich
- Neues Prop: `showWorldSwitch: boolean` — steuert ob Animation abgespielt wird
- Neues Prop: `onWorldSwitchComplete: () => void` — called nach Animation-Ende

### Rendering-Pattern (ersetzt TAB_COMPONENTS Map)

Die aktuelle `Record<ECTab, React.ComponentType>` Map funktioniert nicht mehr, da jeder Tab unterschiedliche Props hat. Stattdessen: Switch-Statement im Render:

```typescript
const renderActiveTab = () => {
  switch (activeTab) {
    case "curve":
      return <TheCurve onPointsChange={setPlacedPoints} />;
    case "addition":
      return <PointAddition initialPoints={placedPoints} onResultChange={setAdditionResultPoint} ... />;
    case "scalar":
      return <ScalarMultiplication basePoint={additionResultPoint} onScalarChange={setScalar} ... />;
    case "keygen":
      return <KeyGeneration scalar={scalar} showWorldSwitch={!hasSeenWorldSwitch} ... />;
  }
};
```

### Neue Komponente: PipelineBar

```
src/components/visualizations/elliptic-curves/components/PipelineBar.tsx
```

Props: `activeTab: ECTab`, `unlockedTabs: Set<string>`, `completedTabs: Set<string>`, `onTabClick: (tab: ECTab) => void`

### Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `EllipticCurvesVisualizer.tsx` | Shared State, Completion-Tracking, Switch-Rendering, PipelineBar |
| `TheCurve.tsx` | State nach oben heben, `onPointsChange` Callback |
| `PointAddition.tsx` | `initialPoints`, `onResultChange`, Completion-Callbacks |
| `ScalarMultiplication.tsx` | `basePoint`, `onScalarChange`, Completion-Callbacks |
| `KeyGeneration.tsx` | `scalar` Prop, Weltenwechsel-Animation mit temporärem CurveCanvas |
| `types.ts` | `CompletionState` Interface hinzufügen |
| `constants.ts` | `COMPLETION_CHECKS` Record hinzufügen |
| **Neu:** `PipelineBar.tsx` | Pipeline-Bar Komponente |

---

## 6. Verifikation

1. `pnpm build` — Build muss durchlaufen
2. **Linearer Flow testen:** Seite öffnen → nur Tab 1 verfügbar → 2 Punkte setzen → Tab 2 wird freigeschaltet → Konstruktion abspielen + draggen → Tab 3 freigeschaltet → etc.
3. **Datenfluss prüfen:** Punkte aus Tab 1 erscheinen in Tab 2 als P/Q-Defaults, R aus Tab 2 erscheint als Basispunkt in Tab 3, Skalar aus Tab 3 erscheint in Tab 4
4. **Weltenwechsel:** Animation spielt beim ersten Tab-4-Besuch, nicht bei erneutem Besuch
5. **Revisit:** Abgeschlossene Tabs sind klickbar und funktional. Bei Upstream-Änderung zeigt Downstream-Tab Hinweis mit "Aktualisieren"-Link
6. **Responsive:** Pipeline-Bar auf Mobile horizontal scrollbar, aktiver Tab zentriert
7. **Standalone-Defaults:** Jeder Tab funktioniert mit Default-Werten wenn kein Upstream-Input vorhanden
8. **Tab 4 Vergleich:** Zeigt kleinen Skalar × G neben echtem 256-bit Key — keine unsicheren Keys
