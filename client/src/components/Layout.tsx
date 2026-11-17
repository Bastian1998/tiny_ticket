import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABEL } from '../format';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand">
            <span className="brand-mark" aria-hidden>🎟</span> TinyTicket
          </NavLink>
          <nav className="nav">
            <NavLink to="/" end>Eventos</NavLink>
            {user?.role === 'ATTENDEE' && <NavLink to="/my-tickets">Mis entradas</NavLink>}
            {user?.role === 'ORGANIZER' && (
              <>
                <NavLink to="/organizer" end>Mi panel</NavLink>
                <NavLink to="/organizer/events/new">Publicar evento</NavLink>
                <NavLink to="/organizer/door">Control de acceso</NavLink>
              </>
            )}
            {user?.role === 'ADMIN' && <NavLink to="/admin">Moderacion</NavLink>}
          </nav>
          <div className="session">
            {user ? (
              <>
                <span className="session-user">
                  {user.name} <span className="badge">{ROLE_LABEL[user.role]}</span>
                </span>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  Salir
                </button>
              </>
            ) : (
              <NavLink to="/login" className="btn btn-primary">Ingresar</NavLink>
            )}
          </div>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
      <footer className="footer">TinyTicket · TP Final Ingenieria de Software 2 · Prototipo (pagos, login y mails simulados)</footer>
    </div>
  );
}
