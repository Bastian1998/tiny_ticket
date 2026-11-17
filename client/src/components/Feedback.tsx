export function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="alert alert-error" role="alert">{message}</div>;
}

export function Loading() {
  return <p className="muted">Cargando...</p>;
}

export function SeatsBar({ sold, capacity }: { sold: number; capacity: number }) {
  const pct = capacity ? Math.round((sold / capacity) * 100) : 0;
  return (
    <div className="seats" aria-label={`${pct}% ocupado`}>
      <div className="seats-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
