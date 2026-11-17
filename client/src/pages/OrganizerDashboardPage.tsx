import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorMessage, Loading, SeatsBar } from '../components/Feedback';
import { formatDate, formatMoney, formatPrice, STATUS_LABEL } from '../format';
import { useAsync } from '../hooks/useAsync';

export function OrganizerDashboardPage() {
  const { data, error, loading, reload } = useAsync(api.dashboard);

  async function cancel(id: string, title: string) {
    if (!window.confirm(`¿Cancelar "${title}"? No se podran reservar mas entradas.`)) return;
    try {
      await api.cancelEvent(id);
    } catch (e) {
      window.alert((e as Error).message);
    }
    await reload();
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Panel del organizador</h1>
          <p className="muted">Ventas, cupos restantes y asistentes de tus eventos.</p>
        </div>
        <Link to="/organizer/events/new" className="btn btn-primary">+ Publicar evento</Link>
      </div>

      <ErrorMessage message={error} />
      {loading && !data && <Loading />}

      {data && (
        <>
          <div className="stats">
            <div className="card stat"><span>Eventos</span><strong>{data.totals.events}</strong></div>
            <div className="card stat"><span>Entradas emitidas</span><strong>{data.totals.ticketsIssued}</strong></div>
            <div className="card stat"><span>Recaudacion</span><strong>{formatMoney(data.totals.revenue)}</strong></div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Fecha</th>
                  <th>Precio</th>
                  <th>Ocupacion</th>
                  <th className="num">Emitidas</th>
                  <th className="num">Ingresaron</th>
                  <th className="num">Recaudado</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.events.map((ev) => (
                  <tr key={ev.id}>
                    <td><Link to={`/events/${ev.id}`}>{ev.title}</Link></td>
                    <td>{formatDate(ev.startsAt)}</td>
                    <td>{formatPrice(ev.price)}</td>
                    <td>
                      <SeatsBar sold={ev.soldSeats} capacity={ev.capacity} />
                      <span className="small">{ev.soldSeats}/{ev.capacity} · quedan {ev.availableSeats}</span>
                    </td>
                    <td className="num">{ev.ticketsIssued}</td>
                    <td className="num">{ev.ticketsUsed}</td>
                    <td className="num">{formatMoney(ev.revenue)}</td>
                    <td><span className="badge">{STATUS_LABEL[ev.status]}</span></td>
                    <td className="actions">
                      <Link to={`/organizer/events/${ev.id}/attendees`}>Asistentes</Link>
                      {ev.status === 'PUBLISHED' && (
                        <>
                          <Link to={`/organizer/events/${ev.id}/edit`}>Editar</Link>
                          <button className="link-btn" onClick={() => cancel(ev.id, ev.title)}>Cancelar</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {data.events.length === 0 && (
                  <tr><td colSpan={9} className="muted">Todavia no publicaste eventos.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
