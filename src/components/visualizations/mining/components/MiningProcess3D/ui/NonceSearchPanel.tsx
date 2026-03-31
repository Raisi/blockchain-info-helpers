"use client";

interface Props {
  nonce: number;
  lastHash: string | null;
  foundHash: string | null;
  hashAttempts: number;
}

const DIFFICULTY = 1; // must match worker difficulty
const TARGET_PREFIX = "0".repeat(DIFFICULTY);
const TARGET_DISPLAY = TARGET_PREFIX + "f".repeat(64 - DIFFICULTY);

function leadingZeros(hash: string): number {
  const match = hash.match(/^0*/);
  return match ? match[0].length : 0;
}

export default function NonceSearchPanel({
  nonce,
  lastHash,
  foundHash,
  hashAttempts,
}: Props) {
  const isFound = !!foundHash;
  const zeros = lastHash ? leadingZeros(lastHash) : 0;
  const meetsTarget = zeros >= DIFFICULTY;

  return (
    <div className="pointer-events-none absolute right-4 top-4 w-80 rounded-xl border border-border-subtle bg-bg-primary/92 p-4 font-mono text-xs backdrop-blur-md">
      {/* Title */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-sm font-semibold text-text-primary">
          Hash-Vergleich
        </span>
        <span className="text-text-muted">
          Versuch #{hashAttempts.toLocaleString("de-DE")}
        </span>
      </div>

      {/* The Rule */}
      <div className="mb-3 rounded-lg bg-bg-secondary/80 px-3 py-2 text-[11px] leading-relaxed text-text-secondary">
        <span className="text-accent-primary font-semibold">Regel:</span>{" "}
        Der Hash muss <span className="text-accent-success font-semibold">numerisch kleiner</span> als
        das Target sein. In der Praxis heißt das: er muss mit{" "}
        <span className="text-accent-success font-semibold">mindestens {DIFFICULTY} Null{DIFFICULTY > 1 ? "en" : ""}</span>{" "}
        beginnen.
      </div>

      {/* Target line */}
      <div className="mb-1 text-text-muted">
        <span className="mr-2 inline-block w-12 text-right text-text-secondary">Target:</span>
        <span className="text-accent-success">{TARGET_PREFIX}</span>
        <span className="text-text-muted">{"f".repeat(Math.min(20 - DIFFICULTY, 20))}...</span>
      </div>

      {/* Current hash */}
      <div className="mb-3 text-text-muted">
        <span className="mr-2 inline-block w-12 text-right text-text-secondary">Hash:</span>
        {lastHash ? (
          <>
            <span className="text-accent-success">
              {lastHash.slice(0, zeros)}
            </span>
            <span className={isFound ? "text-accent-success" : "text-accent-danger"}>
              {lastHash.slice(zeros, zeros + 1)}
            </span>
            <span className={isFound ? "text-accent-success" : "text-text-muted"}>
              {lastHash.slice(zeros + 1, 20)}...
            </span>
          </>
        ) : (
          <span className="text-text-muted">wird berechnet...</span>
        )}
      </div>

      {/* Visual comparison bar */}
      <div className="mb-3">
        <div className="mb-1 flex justify-between text-[10px] text-text-muted">
          <span>0x000... (klein)</span>
          <span>0xfff... (groß)</span>
        </div>
        <div className="relative h-5 overflow-hidden rounded-md bg-bg-secondary">
          {/* Target threshold */}
          <div
            className="absolute top-0 h-full border-r-2 border-accent-success"
            style={{ left: `${(1 / Math.pow(16, DIFFICULTY)) * 100 * 16}%` }}
          >
            <div className="absolute -top-0.5 right-1 text-[9px] text-accent-success">
              Target
            </div>
          </div>
          {/* Valid zone (green) */}
          <div
            className="absolute left-0 top-0 h-full bg-accent-success/15"
            style={{ width: `${(1 / Math.pow(16, DIFFICULTY)) * 100 * 16}%` }}
          />
          {/* Hash position indicator */}
          {lastHash && (
            <div
              className={`absolute top-0 h-full w-1 transition-all duration-150 ${
                meetsTarget ? "bg-accent-success" : "bg-accent-danger"
              }`}
              style={{
                left: `${Math.min(
                  (parseInt(lastHash.slice(0, 4), 16) / 0xffff) * 100,
                  99
                )}%`,
              }}
            />
          )}
        </div>
        <div className="mt-1 flex justify-between text-[10px]">
          <span className="text-accent-success">
            Gültig (Hash &lt; Target)
          </span>
          <span className="text-accent-danger">
            Ungültig (Hash &gt; Target)
          </span>
        </div>
      </div>

      {/* Nonce */}
      <div className="flex items-center justify-between border-t border-border-subtle pt-2">
        <div>
          <span className="text-text-muted">Nonce: </span>
          <span className="text-accent-primary font-semibold">
            {nonce.toLocaleString("de-DE")}
          </span>
        </div>
        <div>
          <span className="text-text-muted">Führende Nullen: </span>
          <span className={zeros >= DIFFICULTY ? "text-accent-success font-semibold" : "text-text-primary"}>
            {zeros}/{DIFFICULTY}
          </span>
        </div>
      </div>

      {/* Result */}
      {isFound && (
        <div className="mt-3 rounded-lg bg-accent-success/15 px-3 py-2 text-center text-accent-success font-display text-sm font-semibold">
          Hash &lt; Target — Block ist gültig!
        </div>
      )}
    </div>
  );
}
