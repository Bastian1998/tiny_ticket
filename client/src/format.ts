const dateFmt = new Intl.DateTimeFormat('es-AR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const moneyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatMoney = (n: number) => moneyFmt.format(n);
export const formatPrice = (n: number) => (n === 0 ? 'Gratis' : formatMoney(n));

export const ROLE_LABEL = { ORGANIZER: 'Organizador', ATTENDEE: 'Asistente', ADMIN: 'Administrador' } as const;

export const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: 'Publicado',
  CANCELLED: 'Cancelado',
  REMOVED: 'Dado de baja',
  VALID: 'Valida',
  USED: 'Utilizada',
};

/** ISO date -> value for <input type="datetime-local"> (local time). */
export function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
