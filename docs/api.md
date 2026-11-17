# API REST

Base: `http://localhost:4000/api` (el frontend la usa a través del proxy de Vite en `/api`).

**Login simulado:** no hay contraseñas. Las rutas protegidas requieren el header `X-User-Id` con el id de un usuario precargado (ej. `att-sofia`, `org-lucia`, `adm-root`). Sin header → `401`; rol sin permiso → `403`.

Errores: `{ "error": "mensaje", "type": "SoldOutError" }`. Códigos: `400` validación · `402` pago rechazado · `403` sin permiso · `404` no existe · `409` sin cupo / estado inválido / conflicto de concurrencia.

| Método | Ruta | Rol | Descripción |
| --- | --- | --- | --- |
| GET | `/health` | — | Estado del servidor |
| GET | `/auth/users` | — | Usuarios precargados (selector del login mock) |
| POST | `/auth/login` | — | `{ userId }` → `{ user, token }` |
| GET | `/auth/me` | cualquiera | Usuario actual |
| GET | `/events?q=texto` | — | Eventos publicados y futuros (búsqueda por título o lugar) |
| GET | `/events/:id` | — | Detalle del evento |
| POST | `/events` | Organizador | Publicar evento. Body: `{ title, description, location, startsAt (ISO), capacity, price }` (`price: 0` = gratuito) |
| PUT | `/events/:id` | Organizador (dueño) | Editar evento (mismo body) |
| PATCH | `/events/:id/cancel` | Organizador (dueño) | Cancelar evento |
| POST | `/events/:id/reservations` | Asistente | Reservar/comprar. Body: `{ quantity, paymentMethod? }` con `MERCADO_PAGO` o `CARD` (ignorado si es gratuito). Respuesta `201`: `{ total, transactionId, tickets[] }` |
| GET | `/me/tickets` | Asistente | Mis entradas, con `qrDataUrl` (imagen PNG del QR) |
| GET | `/organizer/dashboard` | Organizador | Totales y, por evento: emitidas, ingresaron, recaudado, ocupación |
| GET | `/organizer/events/:id/attendees` | Organizador (dueño) | Asistentes y sus códigos |
| POST | `/tickets/:code/validate` | Organizador (dueño) | **Mock** de control de acceso: marca la entrada como usada (la segunda vez → `409`) |
| GET | `/admin/events` | Administrador | Todos los eventos (cualquier estado) |
| PATCH | `/admin/events/:id/remove` | Administrador | **Mock** de moderación: `{ reason }` → evento dado de baja |

## Ejemplo con curl

```bash
curl -X POST http://localhost:4000/api/events/<id>/reservations \
  -H "Content-Type: application/json" -H "X-User-Id: att-sofia" \
  -d '{"quantity": 2, "paymentMethod": "MERCADO_PAGO"}'
```
