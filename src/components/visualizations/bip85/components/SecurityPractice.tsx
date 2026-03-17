"use client";

const COMPARISON = [
  {
    method: "BIP-85",
    backups: "1 Master Backup",
    security: "Höchste — kryptografische Isolation",
    recovery: "Deterministisch — jederzeit reproduzierbar",
    complexity: "Mittel — BIP-85 Support nötig",
    verdict: "✅",
  },
  {
    method: "Manuelle Seeds",
    backups: "N Backups (je Wallet)",
    security: "Hoch — aber mehr Angriffsfläche",
    recovery: "Jedes Backup einzeln aufbewahren",
    complexity: "Niedrig — universell unterstützt",
    verdict: "⚠️",
  },
  {
    method: "Seed Wiederverwendung",
    backups: "1 Backup",
    security: "Niedrig — keine Isolation",
    recovery: "Einfach — aber kein Privacy",
    complexity: "Niedrig",
    verdict: "❌",
  },
];

const CHECKLIST = [
  {
    icon: "✅",
    text: "Master Seed auf hochwertigem Hardware-Wallet generieren",
  },
  {
    icon: "✅",
    text: "Master Backup sicher aufbewahren (Metall, Safe, Multisig)",
  },
  {
    icon: "✅",
    text: "Child Seeds nur auf dem Hardware-Wallet ableiten (nie online)",
  },
  {
    icon: "✅",
    text: "Child Index dokumentieren (z.B. Index 0 = Daily, Index 1 = Savings)",
  },
  {
    icon: "✅",
    text: "Child Seeds in separate Wallets importieren",
  },
  {
    icon: "⚠️",
    text: "Wallet-Kompatibilität prüfen — nicht alle Wallets unterstützen BIP-85 Import-Verifizierung",
  },
];

export default function SecurityPractice() {
  return (
    <div>
      {/* One-Way Visual */}
      <div data-bip85-animate>
        <div className="mb-8 rounded-xl border border-border-subtle bg-bg-card p-6">
          <div className="mb-4 font-code text-[13px] font-bold uppercase tracking-[2px] text-text-muted">
            Einweg-Ableitung (Hardened Path)
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-accent-success bg-accent-success/10 text-2xl">
                🗝️
              </div>
              <span className="font-code text-xs text-accent-success">Master</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="font-code text-xs text-accent-success">HMAC-SHA512</div>
              <div className="text-2xl text-accent-success sm:rotate-0 rotate-90">→</div>
              <div className="text-lg text-accent-danger sm:rotate-0 rotate-90">✗</div>
              <div className="text-2xl text-accent-danger sm:rotate-180 -rotate-90">→</div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-[#fb7185] bg-[#fb7185]/10 text-2xl">
                🌱
              </div>
              <span className="font-code text-xs text-[#fb7185]">Child</span>
            </div>
          </div>
          <div className="mt-5 text-center font-body text-sm text-text-secondary">
            <strong className="text-accent-success">Master → Child:</strong> Jederzeit berechenbar &nbsp;|&nbsp;
            <strong className="text-accent-danger">Child → Master:</strong> Mathematisch unmöglich
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div data-bip85-animate>
        <div className="mb-2 font-code text-[13px] font-bold uppercase tracking-[2px] text-text-muted">
          Vergleich der Strategien
        </div>
        <div className="mb-8 overflow-x-auto rounded-xl border border-border-subtle">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-card">
                <th className="px-4 py-3 font-code text-[11px] font-bold uppercase tracking-wider text-text-muted" />
                <th className="px-4 py-3 font-code text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Methode
                </th>
                <th className="px-4 py-3 font-code text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Backups
                </th>
                <th className="px-4 py-3 font-code text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Sicherheit
                </th>
                <th className="hidden px-4 py-3 font-code text-[11px] font-bold uppercase tracking-wider text-text-muted sm:table-cell">
                  Recovery
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr
                  key={row.method}
                  className="border-b border-border-subtle last:border-0"
                >
                  <td className="px-4 py-3 text-center text-lg">{row.verdict}</td>
                  <td className="px-4 py-3 font-code text-sm text-text-primary">
                    {row.method}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-text-secondary">
                    {row.backups}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-text-secondary">
                    {row.security}
                  </td>
                  <td className="hidden px-4 py-3 font-body text-sm text-text-secondary sm:table-cell">
                    {row.recovery}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Practical Checklist */}
      <div data-bip85-animate>
        <div className="mb-2 font-code text-[13px] font-bold uppercase tracking-[2px] text-text-muted">
          Praktische Checkliste
        </div>
        <div className="mb-6 space-y-2">
          {CHECKLIST.map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-xl border p-4 ${
                item.icon === "⚠️"
                  ? "border-accent-warning/25 bg-accent-warning/[0.06]"
                  : "border-border-subtle bg-bg-card"
              }`}
            >
              <span className="mt-0.5 text-lg flex-shrink-0">{item.icon}</span>
              <span className="font-body text-sm leading-[1.7] text-text-secondary">
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div data-bip85-animate>
        <div className="rounded-xl border border-accent-danger/25 bg-accent-danger/[0.06] p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg">🚨</span>
            <span className="font-code text-sm font-bold text-accent-danger">
              Wichtig: Wallet-Kompatibilität
            </span>
          </div>
          <div className="font-body text-sm leading-[1.8] text-text-secondary">
            Nicht alle Wallets unterstützen BIP-85. Bevor du Child Seeds in ein Wallet importierst,
            stelle sicher, dass das Wallet den{" "}
            <strong className="text-accent-danger">korrekten BIP-39 Import</strong> unterstützt.
            Hardware-Wallets wie <strong className="text-text-primary">Coldcard</strong> und{" "}
            <strong className="text-text-primary">SeedSigner</strong> haben native BIP-85 Unterstützung.
          </div>
        </div>
      </div>
    </div>
  );
}
