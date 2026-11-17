import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { EventFormInput } from '../api/types';
import { ErrorMessage, Loading } from '../components/Feedback';
import { toDateTimeLocal } from '../format';

const EMPTY: EventFormInput = { title: '', description: '', location: '', startsAt: '', capacity: 50, price: 0 };

/** Create (no :id) or edit (with :id) an event. */
export function EventFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<EventFormInput>(EMPTY);
  const [isPaid, setIsPaid] = useState(false);
  const [soldSeats, setSoldSeats] = useState(0);
  const [loading, setLoading] = useState(editing);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .getEvent(id)
      .then((ev) => {
        setForm({
          title: ev.title,
          description: ev.description,
          location: ev.location,
          startsAt: toDateTimeLocal(ev.startsAt),
          capacity: ev.capacity,
          price: ev.price,
        });
        setIsPaid(!ev.isFree);
        setSoldSeats(ev.soldSeats);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const set = <K extends keyof EventFormInput>(key: K, value: EventFormInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload: EventFormInput = {
      ...form,
      startsAt: new Date(form.startsAt).toISOString(),
      price: isPaid ? form.price : 0,
    };
    try {
      if (id) await api.updateEvent(id, payload);
      else await api.createEvent(payload);
      navigate('/organizer');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  const priceLocked = editing && soldSeats > 0;

  return (
    <section className="narrow">
      <Link to="/organizer" className="back">← Volver al panel</Link>
      <h1>{editing ? 'Editar evento' : 'Publicar evento'}</h1>
      <form className="form card" onSubmit={onSubmit}>
        <label>
          Titulo
          <input required value={form.title} onChange={(e) => set('title', e.target.value)} />
        </label>
        <label>
          Descripcion
          <textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </label>
        <label>
          Lugar
          <input required value={form.location} onChange={(e) => set('location', e.target.value)} />
        </label>
        <div className="row">
          <label>
            Fecha y hora
            <input
              required
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => set('startsAt', e.target.value)}
            />
          </label>
          <label>
            Cupo maximo
            <input
              required
              type="number"
              min={Math.max(1, soldSeats)}
              value={form.capacity}
              onChange={(e) => set('capacity', Number(e.target.value))}
            />
          </label>
        </div>
        {editing && soldSeats > 0 && (
          <p className="small muted">Ya hay {soldSeats} entradas emitidas: el cupo no puede ser menor y el precio no se puede cambiar.</p>
        )}
        <fieldset disabled={priceLocked}>
          <legend>Tipo de entrada</legend>
          <label className="radio">
            <input type="radio" checked={!isPaid} onChange={() => setIsPaid(false)} /> Gratuita (reserva simple)
          </label>
          <label className="radio">
            <input type="radio" checked={isPaid} onChange={() => setIsPaid(true)} /> Paga (cobro en la app)
          </label>
          {isPaid && (
            <label>
              Precio (ARS)
              <input
                required
                type="number"
                min={1}
                value={form.price}
                onChange={(e) => set('price', Number(e.target.value))}
              />
            </label>
          )}
        </fieldset>
        <ErrorMessage message={error} />
        <button className="btn btn-primary" disabled={saving}>
          {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Publicar'}
        </button>
      </form>
    </section>
  );
}
