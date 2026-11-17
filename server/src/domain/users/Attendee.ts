import { Action, Role, User, UserProps } from './User';

/** Browses events and reserves or buys tickets. */
export class Attendee extends User {
  private static readonly ALLOWED: ReadonlySet<Action> = new Set<Action>([
    'RESERVE_TICKET',
    'VIEW_OWN_TICKETS',
  ]);

  constructor(props: UserProps) {
    super(props);
  }

  get role(): Role {
    return 'ATTENDEE';
  }

  can(action: Action): boolean {
    return Attendee.ALLOWED.has(action);
  }
}
