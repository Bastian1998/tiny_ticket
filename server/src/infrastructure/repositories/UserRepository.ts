import { Organizer } from '../../domain/users/Organizer';
import { Role, User } from '../../domain/users/User';
import { UserFactory } from '../../domain/users/UserFactory';
import { UserModel } from '../db/models';

interface UserDoc {
  _id: string;
  name: string;
  email: string;
  role: Role;
  organizationName?: string;
}

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean<UserDoc>();
    return doc ? this.toDomain(doc) : null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    const docs = await UserModel.find({ _id: { $in: ids } }).lean<UserDoc[]>();
    return docs.map((d) => this.toDomain(d));
  }

  async findAll(): Promise<User[]> {
    const docs = await UserModel.find().sort({ role: 1, name: 1 }).lean<UserDoc[]>();
    return docs.map((d) => this.toDomain(d));
  }

  async save(user: User): Promise<void> {
    const data: UserDoc = { _id: user.id, name: user.name, email: user.email, role: user.role };
    if (user instanceof Organizer) data.organizationName = user.organizationName;
    await UserModel.collection.replaceOne({ _id: user.id } as never, data as never, { upsert: true });
  }

  async deleteAll(): Promise<void> {
    await UserModel.deleteMany({});
  }

  private toDomain(doc: UserDoc): User {
    return UserFactory.create(doc.role, {
      id: doc._id,
      name: doc.name,
      email: doc.email,
      organizationName: doc.organizationName,
    });
  }
}
