import { Action, Role, User, UserProps } from './User';

export interface OrganizerProps extends UserProps {
  organizationName?: string;
}

/** Creates and manages their own events; sees sales and attendees; checks tickets at the door. */
export class Organizer extends User {
  private static readonly ALLOWED: ReadonlySet<Action> = new Set<Action>([
    'CREATE_EVENT',
    'EDIT_EVENT',
    'VIEW_DASHBOARD',
    'VALIDATE_TICKET',
  ]);

  readonly organizationName?: string;

  constructor(props: OrganizerProps) {
    super(props);
    this.organizationName = props.organizationName;
  }

  get role(): Role {
    return 'ORGANIZER';
  }

  can(action: Action): boolean {
    return Organizer.ALLOWED.has(action);
  }

  override toJSON(): Record<string, unknown> {
    return { ...super.toJSON(), organizationName: this.organizationName };
  }
}
