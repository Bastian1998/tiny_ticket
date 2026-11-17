import { ValidationError } from '../errors';
import { Admin } from './Admin';
import { Attendee } from './Attendee';
import { Organizer, OrganizerProps } from './Organizer';
import { Role, User } from './User';

/** Builds the right User subclass for a role (used when loading users from the database). */
export class UserFactory {
  static create(role: Role, props: OrganizerProps): User {
    switch (role) {
      case 'ORGANIZER':
        return new Organizer(props);
      case 'ATTENDEE':
        return new Attendee(props);
      case 'ADMIN':
        return new Admin(props);
      default:
        throw new ValidationError(`Rol desconocido: ${String(role)}`);
    }
  }
}
