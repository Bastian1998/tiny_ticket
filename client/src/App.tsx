import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireRole } from './components/RequireRole';
import { AdminModerationPage } from './pages/AdminModerationPage';
import { AttendeesPage } from './pages/AttendeesPage';
import { DoorCheckPage } from './pages/DoorCheckPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { EventFormPage } from './pages/EventFormPage';
import { EventListPage } from './pages/EventListPage';
import { LoginPage } from './pages/LoginPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<EventListPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />

        <Route element={<RequireRole role="ATTENDEE" />}>
          <Route path="my-tickets" element={<MyTicketsPage />} />
        </Route>

        <Route element={<RequireRole role="ORGANIZER" />}>
          <Route path="organizer" element={<OrganizerDashboardPage />} />
          <Route path="organizer/events/new" element={<EventFormPage />} />
          <Route path="organizer/events/:id/edit" element={<EventFormPage />} />
          <Route path="organizer/events/:id/attendees" element={<AttendeesPage />} />
          <Route path="organizer/door" element={<DoorCheckPage />} />
        </Route>

        <Route element={<RequireRole role="ADMIN" />}>
          <Route path="admin" element={<AdminModerationPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
