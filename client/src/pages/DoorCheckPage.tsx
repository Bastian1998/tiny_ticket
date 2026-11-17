import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import type { ValidationResponse } from '../api/types';
import { ErrorMessage } from '../components/Feedback';

/** MOCK door check: the organizer types the code shown under the attendee's QR. */
export function DoorCheckPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ValidationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await api.validateTicket(code));
      setCode('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="narrow">
      <h1>Control de acceso</h1>
      <p className="muted">
        Validacion simulada: ingresa el codigo que aparece debajo del QR (ej. TT-1A2B3C4D5E6F).
        Cada entrada se puede usar una sola vez.
      </p>
      <form className="form card" onSubmit={onSubmit}>
        <label>
          Codigo de entrada
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="TT-..."
            autoFocus
          />
        </label>
        <button className="btn btn-primary" disabled={busy}>Validar</button>
      </form>
      <ErrorMessage message={error} />
      {result && (
        <div className="alert alert-ok" role="status">
          <strong>Acceso permitido.</strong> {result.attendeeName} · {result.event.title} · {result.ticket.code}
        </div>
      )}
    </section>
  );
}
