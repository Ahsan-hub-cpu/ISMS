import type { Permission } from "../../domain/permissions";
import type { User, UserWithCredentials } from "../../domain/user";

export interface NewUser {
  readonly email: string;
  readonly fullName: string;
  readonly jobTitle: string | null;
  readonly passwordHash: string;
  readonly roleId: string;
  readonly siteId: string | null;
}

export interface UserUpdates {
  readonly fullName?: string;
  readonly jobTitle?: string | null;
  readonly roleId?: string;
  readonly isActive?: boolean;
  readonly siteId?: string | null;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<UserWithCredentials | null>;
  existsByEmail(email: string): Promise<boolean>;
  list(): Promise<User[]>;
  create(data: NewUser): Promise<User>;
  update(id: string, data: UserUpdates): Promise<User>;
  recordSignIn(id: string, at: Date): Promise<void>;
  countByRoleId(roleId: string, options?: { activeOnly?: boolean }): Promise<number>;
}
