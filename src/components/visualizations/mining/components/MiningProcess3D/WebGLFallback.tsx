"use client";

export default function WebGLFallback() {
  return (
    <div className="flex h-[600px] items-center justify-center rounded-xl border border-border-subtle bg-bg-card">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-danger/15">
          <svg
            className="h-8 w-8 text-accent-danger"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="mb-2 font-display text-lg text-text-primary">
          WebGL nicht verfügbar
        </h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          Dein Browser oder Gerät unterstützt kein WebGL, das für die
          3D-Visualisierung benötigt wird. Versuche einen aktuellen Browser wie
          Chrome, Firefox oder Edge.
        </p>
      </div>
    </div>
  );
}
