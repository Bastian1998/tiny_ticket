import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorMessage, Loading } from '../components/Feedback';
import { formatDate, STATUS_LABEL } from '../format';
import { useAsync } from '../hooks/useAsync';

export function AttendeesPage() {
  const { id = '' } = useParams();
  const { data, error, loading } = useAsync(() => api.attendees(id), [id]);

  return (
    <section>
      <Link to="/organizer" className="back">← Volver al panel</Link>
      <ErrorMessage message={error} />
      {loading && <Loading />}
      {data && (
        <>
          <h1>Asistentes · {data.event.title}</h1>
          <p className="muted">
            {formatDate(data.event.startsAt)} · {data.event.soldSeats} de {data.event.capacity} lugares ocupados
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th className="num">Entradas</th>
                  <th>Codigos</th>
                </tr>
              </thead>
              <tbody>
                {data.attendees.map((a) => (
                  <tr key={a.attendeeId}>
                    <td>{a.name}</td>
                    <td>{a.email}</td>
                    <td className="num">{a.tickets.length}</td>
                    <td>
                      {a.tickets.map((t) => (
                        <div key={t.code} className="small">
                          <span className="code">{t.code}</span> <span className="badge">{STATUS_LABEL[t.status]}</span>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
                {data.attendees.length === 0 && (
                  <tr><td colSpan={4} className="muted">Todavia no hay asistentes.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
