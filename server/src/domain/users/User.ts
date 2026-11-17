import { ForbiddenError } from '../errors';

export type Role = 'ORGANIZER' | 'ATTENDEE' | 'ADMIN';

/** Everything a user may try to do in the system. Each subclass decides which ones it can do. */
export type Action =
  | 'CREATE_EVENT'
  | 'EDIT_EVENT'
  | 'VIEW_DASHBOARD'
  | 'VALIDATE_TICKET'
  | 'RESERVE_TICKET'
  | 'VIEW_OWN_TICKETS'
  | 'MODERATE_EVENT';

export interface UserProps {
  id: string;
  name: string;
  email: string;
}

/**
 * Base class of the user hierarchy (inheritance).
 * Subclasses: Organizer, Attendee, Admin.
 * `can()` is polymorphic: every role answers it differently.
 */
export abstract class User {
  readonly id: string;
  readonly name: string;
  readonly email: string;

  protected constructor(props: UserProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
  }

  abstract get role(): Role;

  abstract can(action: Action): boolean;

  /** Throws ForbiddenError if this user cannot perform the action. */
  assertCan(action: Action): void {
    if (!this.can(action)) {
      throw new ForbiddenError(`El rol ${this.role} no puede realizar la accion ${action}`);
    }
  }

  toJSON(): Record<string, unknown> {
    return { id: this.id, name: this.name, email: this.email, role: this.role };
  }
}
