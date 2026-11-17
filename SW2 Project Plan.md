## [Nombre de la app]

Plataforma de venta y gestion de entradas para eventos de pequena escala

[Integrante 1] - [Integrante 2] - [Integrante 3] - [Integrante 4] - [Integrante 5]


## Los eventos chicos gestionan sus entradas a mano

Listas en papel

1

Transferencias chat

1

|

Resultado: sin control del cupo, cobro desordenado y cero visibilidad de cuántas entradas quedan.

Planillas compartidas

“A la gorra” en

lapuerta


## LA SOLUCIÓN

## Un Ticketmaster a escala chica

Cualquier persona u organización publica su evento y vende o reserva entradas desde una sola app.

ol

## Organizador

- \* Crea eventos con lugar, fecha y cupo

- \* Define si la entrada es paga o gratuita

- Ve ventas, cupos restantes y asistentes

## Administrador (opcional)

- \* Modera los eventos publicados

- \* Da de baja contenido inapropiado

## Asistente

- \* Explora los eventos disponibles

- \* Reserva o compra su entrada

- \* Recibe la entrada digital con QR


## Qué construimos de verdad y qué simulamos

## O Implementado

- \* Publicar y editar eventos

- \* Listado y detalle de eventos

- \* Reserva con control de cupo, sin sobreventa

- \* Entrada digital con código QR

- \* Panel básico del organizador

El informe documenta el producto completo; el prototipo cubre el núcleo en -6 semanas.

## S Simulado (mock)

- Pago: un botón que siempre aprueba

- Login: usuarios precargados

- Envío de mails de confirmación

- Validación del QR en la puerta

- Moderación del administrador


## Tecnologías que vamos a usar

| Área | Herramienta | Estado |
| --- | --- | --- |
| Frontend | React | Acordado |
| Backend | Node.js | Acordado |
| Base de datos | MongoDB | Acordado |
| Gestión del proyecto | Jira, con tablero Scrum | Acordado |
| Código y versiones | GitHub | Acordado |
| Diagramas UML | draw.io o PlantUML | Propuesta |
| Informe | Google Docs, exportado a Word | Propuesta |
| Comunicación | WhatsApp | En uso |


## METODOLOGÍA

## Scrum adaptado a nuestro equipo

Product Owner

[Integrante]

Scrum Master

Development Team

[Integrante]

Los 5, PO y SM incluidos

| Sprint Planning | Videollamada corta al inicio de cada sprint |
| --- | --- |
| Daily | Asincrónica por WhatsApp, cada 2-3 días |
| Review + Retro | Unificadas, en una llamada al cierre de cada sprint |
| Backlogs | Product Backlog y Sprint Backlog en Jira |


## PLANIFICACIÓN

## Tres sprints de dos semanas

## SPRINT 1 - [FECHAS]

## Definición y diseño

- \* Requisitos e historias de usuario

- \* Diagramas UML

- \* Repo y entorno armados

- \* Backlog cargado en Jira

## SPRINT 2 - [FECHAS]

## SPRINT 3 - [FECHAS]

## Núcleo funcional

- \* Alta y listado de eventos

- \* Reserva con control de cupo

- \* Generación de la entrada QR

- \* Algoritmo y patrón documentados

## Cierre y entrega

- Panel del organizador y mocks

- Flujo de fondos

- Informe final en Word

- PowerPoint y defensa


## PRODUCT BACKLOG

## Primeras historias de usuario

|   | quiero... |   |   |
| --- | --- | --- | --- |
| Organizador | publicar un evento con fecha y cupo | ofrecer entradas sin listas | a mano |
| Asistente | reservar una entrada gratuita | asegurar mi lugar en el evento |   |
| Asistente | comprar una entrada paga en la app | no depender de transferencias |   |
| Asistente | recibir mi entrada con código QR | presentarla al ingresar |   |
| Organizador | ver ventas, cupos y asistentes | controlar la capacidad del lugar |   |

Cada historia lleva criterios de aceptación y se estima en story points en Jira.


## DISEÑO

## Decisiones iniciales de diseño

## E Orientado a objetos

Herencia en Usuario y en Entrada; el cupo de un Evento solo cambia a través de sus propios métodos.

## 9 Patrón Strategy

Cada medio de pago es una estrategia intercambiable: gratuito, Mercado Pago o tarjeta.

Diagrama de casos de uso por rol y diagrama de clases del modelo, en draw.io o PlantUML.

## <> Algoritmo

Reserva de entrada con control de cupo, en pseudocódigo: el núcleo que evita la sobreventa.


## ANÁLISIS ECONÓMICO

## Cómo vamos a armar el flujo de fondos

## Evaluación

- \* Horizonte de [N] años

- \* Valores en USD, por la inflación

- \* Indicadores: VAN y TIR

## Egresos

- \* Horas del equipo a tarifa de mercado

- \* Infraestructura cloud

- \* Herramientas y licencias

- \* Comisión de la pasarela de pago

Los montos y supuestos se definen en el informe; acá mostramos la estructura del modelo.

## Ingresos

- \* Comisión por cada entrada paga vendida

- \* Las entradas gratuitas no generan ingreso


## Roles y responsabilidades

| Integrante | Rol en Scrum | Responsable en el informe |
| --- | --- | --- |
| [Integrante 1] | Product Owner | Descripción del sistema, requisitos y conclusión |
| [Integrante 2] | Scrum Master | Scrum y tablero en Jira |
| [Integrante 3] | Development Team | Diseño orientado a objetos y diagrama de clases |
| [Integrante 4] | Development Team | Casos de uso, algoritmo y patrón de diseño |
| [Integrante 5] | Development Team | Flujo de fondos y presentación final |

Los 5 desarrollamos: el MVP se reparte por historias de usuario, sprint a sprint.


## Próximos pasos

- 1. Confirmar el stack los roles de Scrum y

- 2. Cargar el Product Backlog en Jira

- 3. Arrancar el Sprint 1 el [fecha]

## ¿Preguntas?

TP Final - Ingeniería de Software 2
