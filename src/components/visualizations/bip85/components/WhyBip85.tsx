"use client";

const USE_CASES = [
  {
    icon: "🔒",
    title: "Hardware Wallet Backup",
    desc: "Ein einziges Backup sichert alle deine Wallets. Verlierst du ein Child-Wallet, leitest du es einfach neu ab.",
  },
  {
    icon: "🎯",
    title: "Getrennte Wallets pro Zweck",
    desc: "Ein Wallet für Spending, eins für Savings, eins für Business — alle aus demselben Master Seed.",
  },
  {
    icon: "🎁",
    title: "Seeds verschenken",
    desc: "Leite einen Child Seed ab und gib ihn weiter — ohne dein Master Backup zu gefährden.",
  },
  {
    icon: "🏦",
    title: "Multi-Vendor Setup",
    desc: "Verschiedene Hardware-Wallets mit unabhängigen Seeds, aber nur ein Master-Backup nötig.",
  },
];

export default function WhyBip85() {
  return (
    <div>
      {/* Intro */}
      <div data-bip85-animate>
        <div className="mb-8 flex gap-5 rounded-[14px] border border-[#fb7185]/25 bg-[#fb7185]/[0.06] p-6 items-start">
          <span className="text-3xl flex-shrink-0">🔮</span>
          <div>
            <div className="mb-2 font-code text-[15px] font-bold text-[#fb7185]">
              Das Problem
            </div>
            <div className="font-body text-sm leading-[1.8] text-text-secondary">
              Wer mehrere Bitcoin-Wallets nutzt, hat mehrere Seed-Phrases — und muss
              jede einzeln sichern. Verliert man ein Backup, ist das Geld weg.
              <strong className="text-[#fb7185]"> BIP-85</strong> löst dieses Problem.
            </div>
          </div>
        </div>
      </div>

      {/* Visual Metaphor */}
      <div data-bip85-animate>
        <div className="mb-8 rounded-xl border border-border-subtle bg-bg-card p-6">
          <div className="mb-4 font-code text-[13px] font-bold uppercase tracking-[2px] text-text-muted">
            Das Prinzip
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            {/* Master */}
            <div className="flex flex-col items-center gap-2">
              <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-[#fb7185] bg-[#fb7185]/10 text-3xl">
                🗝️
              </div>
              <span className="font-code text-xs text-[#fb7185]">Master Seed</span>
            </div>
            {/* Arrow */}
            <div className="text-2xl text-text-muted sm:rotate-0 rotate-90">→</div>
            {/* Children */}
            <div className="flex flex-wrap justify-center gap-3">
              {["Wallet A", "Wallet B", "Wallet C", "Wallet N"].map((label, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className="grid h-14 w-14 place-items-center rounded-xl border border-border-active bg-bg-primary text-xl">
                    {i === 3 ? "..." : "🌱"}
                  </div>
                  <span className="font-code text-[10px] text-text-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 text-center font-body text-sm text-accent-primary">
            Ein Backup → Unendlich viele unabhängige Wallets
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div data-bip85-animate>
        <div className="mb-3 font-code text-[13px] font-bold uppercase tracking-[2px] text-text-muted">
          Anwendungsfälle
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {USE_CASES.map((uc) => (
            <div
              key={uc.title}
              className="rounded-xl border border-border-subtle bg-bg-card p-5 transition-all hover:border-[#fb7185]/30 hover:bg-bg-card-hover"
            >
              <div className="mb-2 flex items-center gap-3">
                <span className="text-xl">{uc.icon}</span>
                <span className="font-code text-sm font-bold text-text-primary">{uc.title}</span>
              </div>
              <div className="font-body text-sm leading-[1.7] text-text-secondary">{uc.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Guarantee */}
      <div data-bip85-animate>
        <div className="mt-6 rounded-xl border border-accent-success/25 bg-accent-success/[0.06] p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <span className="font-code text-sm font-bold text-accent-success">Sicherheitsgarantie</span>
          </div>
          <div className="font-body text-sm leading-[1.8] text-text-secondary">
            Wird ein Child Seed kompromittiert, kann daraus <strong className="text-accent-success">weder der Master Seed
            noch andere Child Seeds</strong> abgeleitet werden. Die Ableitung ist eine
            kryptografische Einbahnstraße (HMAC-SHA512).
          </div>
        </div>
      </div>
    </div>
  );
}
