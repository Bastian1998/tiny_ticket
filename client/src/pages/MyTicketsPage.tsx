import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorMessage, Loading } from '../components/Feedback';
import { formatDate, formatPrice, STATUS_LABEL } from '../format';
import { useAsync } from '../hooks/useAsync';

export function MyTicketsPage() {
  const { data: tickets, error, loading } = useAsync(api.myTickets);

  return (
    <section>
      <h1>Mis entradas</h1>
      <p className="muted">Mostra el codigo QR en la puerta del evento.</p>
      <ErrorMessage message={error} />
      {loading && <Loading />}
      {tickets && tickets.length === 0 && (
        <p>
          Todavia no tenes entradas. <Link to="/">Explora los eventos</Link>.
        </p>
      )}
      <div className="grid">
        {tickets?.map((t) => (
          <div key={t.id} className={`card ticket ${t.status !== 'VALID' ? 'ticket-used' : ''}`}>
            <img src={t.qrDataUrl} alt={`QR ${t.code}`} className="ticket-qr" />
            <div>
              <h3>{t.event?.title ?? 'Evento'}</h3>
              {t.event && <p className="muted">{formatDate(t.event.startsAt)} · {t.event.location}</p>}
              <p className="code">{t.code}</p>
              <p className="small">
                {formatPrice(t.price)} · <span className="badge">{STATUS_LABEL[t.status]}</span>
                {t.event && t.event.status !== 'PUBLISHED' && (
                  <span className="badge badge-warn">{STATUS_LABEL[t.event.status]}</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
