import { Action, Role, User, UserProps } from './User';

/** Platform administrator: moderates published events (simulated in the MVP). */
export class Admin extends User {
  constructor(props: UserProps) {
    super(props);
  }

  get role(): Role {
    return 'ADMIN';
  }

  can(action: Action): boolean {
    return action === 'MODERATE_EVENT';
  }
}
