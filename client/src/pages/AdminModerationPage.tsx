import { api } from '../api/client';
import { ErrorMessage, Loading } from '../components/Feedback';
import { formatDate, formatPrice, STATUS_LABEL } from '../format';
import { useAsync } from '../hooks/useAsync';

/** MOCK moderation: the admin can take any event down. */
export function AdminModerationPage() {
  const { data: events, error, loading, reload } = useAsync(api.adminEvents);

  async function remove(id: string, title: string) {
    const reason = window.prompt(`Motivo para dar de baja "${title}":`, 'Contenido inapropiado');
    if (reason === null) return;
    try {
      await api.removeEvent(id, reason);
    } catch (e) {
      window.alert((e as Error).message);
    }
    await reload();
  }

  return (
    <section>
      <h1>Moderacion de eventos</h1>
      <p className="muted">Funcion simulada del administrador: dar de baja contenido inapropiado.</p>
      <ErrorMessage message={error} />
      {loading && !events && <Loading />}
      {events && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Fecha</th>
                <th>Precio</th>
                <th className="num">Vendidas</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td>{ev.title}<div className="small muted">{ev.location}</div></td>
                  <td>{formatDate(ev.startsAt)}</td>
                  <td>{formatPrice(ev.price)}</td>
                  <td className="num">{ev.soldSeats}/{ev.capacity}</td>
                  <td>
                    <span className="badge">{STATUS_LABEL[ev.status]}</span>
                    {ev.removalReason && <div className="small muted">{ev.removalReason}</div>}
                  </td>
                  <td className="actions">
                    {ev.status !== 'REMOVED' && (
                      <button className="btn btn-danger" onClick={() => remove(ev.id, ev.title)}>Dar de baja</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
