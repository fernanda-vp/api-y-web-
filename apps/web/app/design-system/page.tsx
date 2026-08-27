const SCALES = [
  {
    label: "Primary (azul)",
    steps: [
      ["900", "bg-primary-900"],
      ["700", "bg-primary-700"],
      ["DEFAULT", "bg-primary"],
      ["400", "bg-primary-400"],
      ["200", "bg-primary-200"],
      ["50", "bg-primary-50"],
    ],
  },
  {
    label: "Accent (verde)",
    steps: [
      ["900", "bg-accent-900"],
      ["700", "bg-accent-700"],
      ["DEFAULT", "bg-accent"],
      ["400", "bg-accent-400"],
      ["200", "bg-accent-200"],
      ["50", "bg-accent-50"],
    ],
  },
  {
    label: "Neutral (gris)",
    steps: [
      ["900", "bg-neutral-900"],
      ["700", "bg-neutral-700"],
      ["DEFAULT", "bg-neutral"],
      ["400", "bg-neutral-400"],
      ["200", "bg-neutral-200"],
      ["100", "bg-neutral-100"],
    ],
  },
] as const;

export default function DesignSystemPage() {
  return (
    <div className="flex flex-1 flex-col gap-12 bg-neutral-100 px-6 py-10 sm:px-12">
      <header>
        <h1 className="text-2xl font-bold text-primary-900">Sistema de diseño — Intranet Kenmeina</h1>
        <p className="mt-1 text-sm text-neutral-700">
          Vista previa de los tokens de color aplicados con Tailwind.
        </p>
      </header>

      {SCALES.map((scale) => (
        <section key={scale.label}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-700">
            {scale.label}
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {scale.steps.map(([step, className]) => (
              <div key={step} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                <div className={`h-16 ${className}`} />
                <div className="px-2 py-1.5 text-xs font-medium text-neutral-900">{step}</div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-700">
          Semánticos
        </h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-md bg-success/10 px-3 py-1.5 font-medium text-success">Success</span>
          <span className="rounded-md bg-warning/10 px-3 py-1.5 font-medium text-warning">Warning</span>
          <span className="rounded-md bg-error/10 px-3 py-1.5 font-medium text-error">Error</span>
          <span className="rounded-md bg-info/10 px-3 py-1.5 font-medium text-info">Info</span>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-700">
          Vista previa aplicada
        </h2>
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <div className="flex items-center gap-5 border-b-[3px] border-accent bg-white px-5 py-3.5">
            <span className="text-lg font-extrabold text-primary">
              K<span className="text-accent">enmeina</span>
            </span>
            <nav className="ml-auto flex gap-4 text-sm text-neutral-700">
              <span>Inicio</span>
              <span className="font-bold text-primary">Comunicados</span>
              <span>Documentos</span>
              <span>Directorio</span>
            </nav>
          </div>
          <div className="flex flex-wrap gap-4 bg-white p-5">
            <button className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white">
              Ver comunicado
            </button>
            <button className="rounded-md bg-accent-700 px-4 py-2.5 text-sm font-semibold text-white">
              Nueva solicitud
            </button>
            <button className="rounded-md bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-700">
              Cancelar
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
