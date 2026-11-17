# Arquitectura de TinyTicket

Documento de referencia para el equipo: cómo está organizado el código y dónde está cada concepto que pide la consigna. Los nombres de clases y métodos están en inglés (así figuran en el código); el informe puede usar la traducción entre paréntesis.

## Vista general

```
React (client/)  ──HTTP/JSON──►  Express API (server/src/api)
                                     │
                                     ▼
                              Servicios (casos de uso)       server/src/services
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
          Modelo de dominio (POO)         Infraestructura
          server/src/domain               server/src/infrastructure
          Event, Ticket, User,            Mongoose (MongoDB), repositorios,
          PaymentStrategy...              generador de QR
```

Arquitectura en capas. Cada capa solo conoce a la de abajo:

| Capa | Carpeta | Responsabilidad |
| --- | --- | --- |
| Presentación | `client/src` | Pantallas React por rol |
| API | `server/src/api` | Rutas REST, login simulado (`X-User-Id`), traducción de errores a HTTP |
| Servicios / casos de uso | `server/src/services` | Orquestan cada caso de uso (reservar, publicar, panel, moderar, validar) |
| Dominio | `server/src/domain` | Clases con las reglas del negocio. **No dependen de Express ni de MongoDB** |
| Infraestructura | `server/src/infrastructure` | Persistencia (MongoDB/Mongoose), repositorios, QR |

`server/src/container.ts` es la *composition root*: crea todos los objetos una vez y les inyecta sus dependencias (inyección por constructor).

## Mapa de carpetas (backend)

```
server/src/
  domain/
    errors.ts                     Errores de negocio (SoldOutError, ValidationError...)
    users/                        User (abstracta), Organizer, Attendee, Admin, UserFactory
    events/Event.ts               Evento: cupo encapsulado
    tickets/                      Ticket (abstracta), FreeTicket, PaidTicket, TicketFactory
    payments/                     Patrón Strategy: PaymentStrategy + estrategias + PaymentProcessor
  services/
    ReservationService.ts         ALGORITMO de reserva sin sobreventa
    EventService.ts               Publicar, editar, cancelar, listar
    OrganizerDashboardService.ts  Ventas, cupos, asistentes
    TicketQueryService.ts         "Mis entradas"
    TicketValidationService.ts    (mock) control de acceso en la puerta
    ModerationService.ts          (mock) moderación del administrador
    NotificationService.ts        (mock) mails de confirmación
  infrastructure/
    db/models.ts                  Esquemas Mongoose
    repositories/                 EventRepository (bloqueo optimista), TicketRepository, UserRepository
    qr/QrCodeGenerator.ts         Código -> imagen QR
  api/                            Rutas Express + middlewares
  seed/                           Datos de demo
```

## Dónde está cada concepto de la consigna

| Concepto | Dónde verlo | Explicación |
| --- | --- | --- |
| **Encapsulamiento** | `domain/events/Event.ts` | `capacity`, `availableSeats` y `status` son privados. Solo cambian a través de `reserveSeats()`, `releaseSeats()`, `changeCapacity()`, `cancel()` y `remove()`, que garantizan `0 <= availableSeats <= capacity`. El constructor es privado: se crea con `Event.create()` (valida) o `Event.restore()` (desde la BD). |
| **Herencia** | `domain/users/*`, `domain/tickets/*` | `User` (abstracta) → `Organizer`, `Attendee`, `Admin`. `Ticket` (abstracta) → `FreeTicket`, `PaidTicket`. |
| **Polimorfismo** | `User.can()`, `Ticket.getPrice()`, `PaymentStrategy.pay()` | Cada rol responde `can(action)` distinto; cada entrada calcula su precio (`FreeTicket` → 0); cada estrategia cobra a su manera. El panel suma `ticket.getPrice()` sin preguntar el tipo. |
| **Modularidad** | Capas y carpetas | Dominio, servicios, infraestructura y API separados. Cambiar MongoDB por otra BD solo toca `infrastructure/`. |
| **Patrón de diseño (Strategy)** | `domain/payments/` | Ver [strategy-pattern.md](strategy-pattern.md). |
| **Patrón Factory (extra)** | `UserFactory`, `TicketFactory`, `PaymentStrategyFactory` | Deciden qué subclase instanciar. |
| **Algoritmo** | `services/ReservationService.ts` + `EventRepository.modify()` | Ver [reservation-algorithm.md](reservation-algorithm.md). |
| **Simulados (mocks)** | Pago, login, mails, QR en puerta, moderación | Cada clase mock tiene el comentario `MOCK` en su encabezado. |

## Clases principales y responsabilidades

| Clase | Atributos clave | Métodos clave | Responsabilidad |
| --- | --- | --- | --- |
| `User` (abstracta) | id, name, email | `role`, `can(action)`, `assertCan(action)` | Identidad y permisos |
| `Organizer` | organizationName | `can()` | Publica y gestiona sus eventos |
| `Attendee` | — | `can()` | Reserva o compra entradas |
| `Admin` | — | `can()` | Modera eventos |
| `Event` | title, location, startsAt, capacity, availableSeats, price, status, version | `reserveSeats`, `releaseSeats`, `changeCapacity`, `updateDetails`, `cancel`, `remove`, `isFree`, `isBookable` | Proteger el cupo y el estado del evento |
| `Ticket` (abstracta) | code, eventId, attendeeId, status, issuedAt | `getPrice()`, `markUsed()`, `isValid()` | Entrada digital |
| `FreeTicket` / `PaidTicket` | (PaidTicket) price, paymentId, paymentMethod | `getPrice()` | Variantes de entrada |
| `PaymentStrategy` (interfaz) | method | `pay(request)` | Cobro intercambiable |
| `PaymentProcessor` | strategy | `setStrategy`, `process` | Contexto del Strategy |
| `ReservationService` | repos, factory, notifier | `reserve(attendee, request)` | Algoritmo de reserva |
| `EventRepository` | — | `find`, `insert`, `saveIfUnchanged`, `modify` | Persistencia con bloqueo optimista |

## Frontend

`client/src/pages` tiene una página por caso de uso: Login (mock), Listado y Detalle de eventos, Mis entradas (QR), Panel del organizador, Alta/Edición de evento, Asistentes, Control de acceso (mock) y Moderación (mock). `client/src/api/client.ts` concentra todas las llamadas HTTP.
