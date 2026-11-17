import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Role } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ErrorMessage, Loading } from '../components/Feedback';
import { ROLE_LABEL } from '../format';
import { useAsync } from '../hooks/useAsync';

const HOME: Record<Role, string> = { ATTENDEE: '/', ORGANIZER: '/organizer', ADMIN: '/admin' };

/** MOCK login: pick one of the preloaded users (no passwords in the prototype). */
export function LoginPage() {
  const { data: users, error, loading } = useAsync(api.listUsers);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginError, setLoginError] = useState<string | null>(null);

  async function pick(id: string) {
    try {
      const user = await login(id);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? HOME[user.role], { replace: true });
    } catch (e) {
      setLoginError((e as Error).message);
    }
  }

  const groups: Role[] = ['ATTENDEE', 'ORGANIZER', 'ADMIN'];

  return (
    <section className="narrow">
      <h1>Ingresar</h1>
      <p className="muted">
        Login simulado: elegi uno de los usuarios precargados para probar cada rol.
      </p>
      <ErrorMessage message={error ?? loginError} />
      {loading && <Loading />}
      {users &&
        groups.map((role) => (
          <div key={role} className="login-group">
            <h2>{ROLE_LABEL[role]}</h2>
            <div className="login-list">
              {users
                .filter((u) => u.role === role)
                .map((u) => (
                  <button key={u.id} className="card login-card" onClick={() => pick(u.id)}>
                    <strong>{u.name}</strong>
                    <span className="muted">{u.organizationName ?? u.email}</span>
                  </button>
                ))}
            </div>
          </div>
        ))}
    </section>
  );
}
