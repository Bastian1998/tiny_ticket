import { FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { PaymentMethod, ReservationResponse } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ErrorMessage, Loading, SeatsBar } from '../components/Feedback';
import { formatDate, formatMoney, formatPrice } from '../format';
import { useAsync } from '../hooks/useAsync';

const MAX_PER_ORDER = 10;

export function EventDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: ev, error, loading, reload } = useAsync(() => api.getEvent(id), [id]);

  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>('MERCADO_PAGO');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [result, setResult] = useState<ReservationResponse | null>(null);

  if (loading && !ev) return <Loading />;
  if (!ev) return <ErrorMessage message={error ?? 'Evento no encontrado'} />;

  const maxQty = Math.min(MAX_PER_ORDER, ev.availableSeats);

  async function onReserve(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await api.reserve(id, quantity, ev!.isFree ? undefined : method);
      setResult(res);
      await reload();
    } catch (err) {
      setActionError((err as Error).message);
      await reload();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="detail">
      <Link to="/" className="back">← Volver a eventos</Link>
      <div className="detail-grid">
        <article>
          <span className={`pill ${ev.isFree ? 'pill-free' : 'pill-paid'}`}>{formatPrice(ev.price)}</span>
          <h1>{ev.title}</h1>
          <p className="lead">{formatDate(ev.startsAt)} · {ev.location}</p>
          <p>{ev.description}</p>
          <p className="muted">Organiza: {ev.organizerName}</p>
          <SeatsBar sold={ev.soldSeats} capacity={ev.capacity} />
          <p className="small">{ev.availableSeats} de {ev.capacity} lugares disponibles</p>
        </article>

        <aside className="card">
          {result ? (
            <div>
              <h2>¡Listo!</h2>
              <p>
                Emitimos {result.tickets.length} entrada(s)
                {result.total > 0 && <> por {formatMoney(result.total)} (pago simulado {result.transactionId})</>}.
                Te enviamos la confirmacion por mail (simulado).
              </p>
              <div className="qr-row">
                {result.tickets.map((t) => (
                  <figure key={t.id} className="qr">
                    <img src={t.qrDataUrl} alt={`QR ${t.code}`} />
                    <figcaption>{t.code}</figcaption>
                  </figure>
                ))}
              </div>
              <Link to="/my-tickets" className="btn btn-primary">Ver mis entradas</Link>
            </div>
          ) : !ev.isBookable ? (
            <p className="muted">Este evento no admite reservas.</p>
          ) : ev.isSoldOut ? (
            <p className="alert">Entradas agotadas.</p>
          ) : user && user.role !== 'ATTENDEE' ? (
            <p className="muted">Ingresa como asistente para reservar entradas.</p>
          ) : (
            <form onSubmit={onReserve} className="form">
              <h2>{ev.isFree ? 'Reservar entrada' : 'Comprar entrada'}</h2>
              <label>
                Cantidad
                <input
                  type="number"
                  min={1}
                  max={maxQty}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))}
                />
              </label>
              {!ev.isFree && (
                <fieldset>
                  <legend>Medio de pago (simulado)</legend>
                  <label className="radio">
                    <input type="radio" checked={method === 'MERCADO_PAGO'} onChange={() => setMethod('MERCADO_PAGO')} />
                    Mercado Pago
                  </label>
                  <label className="radio">
                    <input type="radio" checked={method === 'CARD'} onChange={() => setMethod('CARD')} />
                    Tarjeta de credito / debito
                  </label>
                </fieldset>
              )}
              {!ev.isFree && <p className="total">Total: {formatMoney(ev.price * quantity)}</p>}
              <ErrorMessage message={actionError} />
              <button className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Procesando...' : ev.isFree ? 'Reservar' : 'Pagar y obtener entradas'}
              </button>
              {!user && <p className="small muted">Te vamos a pedir que ingreses.</p>}
            </form>
          )}
        </aside>
      </div>
    </section>
  );
}
