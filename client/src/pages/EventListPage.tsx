import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorMessage, Loading, SeatsBar } from '../components/Feedback';
import { formatDate, formatPrice } from '../format';
import { useAsync } from '../hooks/useAsync';

export function EventListPage() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const { data: events, error, loading } = useAsync(() => api.listEvents(search), [search]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSearch(query);
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Proximos eventos</h1>
          <p className="muted">Muestras, shows en vivo, talleres y fiestas de pequena escala.</p>
        </div>
        <form className="search" onSubmit={onSubmit}>
          <input
            type="search"
            placeholder="Buscar por nombre o lugar"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar eventos"
          />
          <button className="btn">Buscar</button>
        </form>
      </div>

      <ErrorMessage message={error} />
      {loading && <Loading />}
      {events && events.length === 0 && <p className="muted">No hay eventos para mostrar.</p>}

      <div className="grid">
        {events?.map((ev) => (
          <Link key={ev.id} to={`/events/${ev.id}`} className="card event-card">
            <div className="event-card-top">
              <span className={`pill ${ev.isFree ? 'pill-free' : 'pill-paid'}`}>{formatPrice(ev.price)}</span>
              {ev.isSoldOut && <span className="pill pill-soldout">Agotado</span>}
            </div>
            <h3>{ev.title}</h3>
            <p className="muted">{formatDate(ev.startsAt)}</p>
            <p className="muted">{ev.location}</p>
            <SeatsBar sold={ev.soldSeats} capacity={ev.capacity} />
            <p className="small">
              {ev.availableSeats} de {ev.capacity} lugares disponibles · {ev.organizerName}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
