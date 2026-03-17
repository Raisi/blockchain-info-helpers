"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { InfoCard } from "./InfoCard";

export function WatchOnlyWallet() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      // Animate the security boundary line
      gsap.from("[data-boundary]", {
        scaleY: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.3,
      });
      // Stagger the can/cannot items
      gsap.from("[data-capability]", {
        x: -20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: "power3.out",
        delay: 0.5,
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef}>
      {/* Security Boundary Diagram */}
      <div data-zpub-animate className="mb-6">
        <div className="mb-3 font-code text-xs font-bold uppercase tracking-[2px] text-text-muted">
          Security Boundary
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-0 rounded-xl border border-border-subtle bg-bg-primary overflow-hidden">
          {/* zpub Side */}
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent-success/15 font-code text-sm text-accent-success">
                🔓
              </div>
              <div className="font-body text-sm font-bold text-accent-success">
                zpub (Public)
              </div>
            </div>
            <div className="space-y-1 text-xs text-text-secondary">
              <div>Extended Public Key</div>
              <div>Chain Code</div>
              <div>Alle Public Keys</div>
              <div>Alle Adressen</div>
            </div>
          </div>

          {/* Boundary */}
          <div className="flex items-stretch py-4">
            <div
              data-boundary
              className="w-px bg-gradient-to-b from-accent-danger/0 via-accent-danger to-accent-danger/0 origin-top"
            />
          </div>

          {/* Private Key Side */}
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent-danger/15 font-code text-sm text-accent-danger">
                🔐
              </div>
              <div className="font-body text-sm font-bold text-accent-danger">
                Private Keys
              </div>
            </div>
            <div className="space-y-1 text-xs text-text-secondary">
              <div>Master Private Key</div>
              <div>Account Private Keys</div>
              <div>Signing-Fähigkeit</div>
              <div>Seed / Mnemonic</div>
            </div>
          </div>
        </div>
      </div>

      {/* Can / Cannot Comparison */}
      <div data-zpub-animate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* KANN */}
        <div className="rounded-xl border border-accent-success/30 bg-accent-success/5 p-4">
          <div className="mb-3 font-code text-xs font-bold uppercase tracking-[2px] text-accent-success">
            Kann ✓
          </div>
          <div className="space-y-2">
            {[
              "Empfangsadressen generieren",
              "Balances & UTXOs prüfen",
              "Unsigned Transactions erstellen",
              "Eingehende Zahlungen verifizieren",
              "Transaktionshistorie einsehen",
            ].map((item) => (
              <div
                key={item}
                data-capability
                className="flex items-center gap-2 rounded-lg bg-bg-primary p-2 text-xs text-text-secondary"
              >
                <span className="text-accent-success">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* KANN NICHT */}
        <div className="rounded-xl border border-accent-danger/30 bg-accent-danger/5 p-4">
          <div className="mb-3 font-code text-xs font-bold uppercase tracking-[2px] text-accent-danger">
            Kann nicht ✗
          </div>
          <div className="space-y-2">
            {[
              "Transaktionen signieren",
              "Funds ausgeben / transferieren",
              "Private Keys ableiten",
              "Seed / Mnemonic rekonstruieren",
              "Andere Accounts ableiten",
            ].map((item) => (
              <div
                key={item}
                data-capability
                className="flex items-center gap-2 rounded-lg bg-bg-primary p-2 text-xs text-text-secondary"
              >
                <span className="text-accent-danger">✗</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div data-zpub-animate className="mt-6">
        <div className="mb-3 font-code text-xs font-bold uppercase tracking-[2px] text-text-muted">
          Real-World Use Cases
        </div>
        <div className="space-y-2">
          {[
            {
              title: "Hardware Wallet + Watch-Only App",
              description:
                "zpub exportieren → in Sparrow/BlueWallet importieren → Adressen & Balances sehen, ohne die Hardware Wallet anzuschließen. Signiert wird nur auf dem Gerät.",
              color: "var(--accent-primary)",
            },
            {
              title: "Business Accounting",
              description:
                "Buchhaltung bekommt den zpub → kann alle Transaktionen nachverfolgen und Adressen für Rechnungen generieren, ohne Zugriff auf die Funds.",
              color: "var(--accent-secondary)",
            },
            {
              title: "Spenden-Monitoring",
              description:
                "zpub öffentlich teilen → Spender können verifizieren, dass Gelder eingehen. Empfangsadressen rotieren automatisch für Privacy.",
              color: "var(--accent-warning)",
            },
          ].map((useCase) => (
            <div
              key={useCase.title}
              className="rounded-xl border border-border-subtle bg-bg-card p-4"
            >
              <div
                className="mb-1 font-body text-sm font-bold"
                style={{ color: useCase.color }}
              >
                {useCase.title}
              </div>
              <div className="text-xs leading-[1.7] text-text-secondary">
                {useCase.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div data-zpub-animate>
        <InfoCard color="var(--accent-warning)">
          <strong>Der zpub ist die &quot;Fabrik&quot; für bc1q-Adressen.</strong> Er
          enthält keinen Private Key, aber genug Information, um unendlich viele
          Empfangsadressen deterministisch zu erzeugen — vollständig ohne Risiko
          für deine Coins. Er ist das Fundament jeder Watch-Only Wallet.
        </InfoCard>
      </div>
    </div>
  );
}
