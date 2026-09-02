import type { User, UserRole, UserWithCredentials } from "../../domain/user";

export interface CreateUserData {
  readonly email: string;
  readonly fullName: string;
  readonly jobTitle: string | null;
  readonly passwordHash: string;
  readonly role: UserRole;
  readonly siteId: string | null;
}

export interface UpdateUserData {
  readonly fullName?: string;
  readonly jobTitle?: string | null;
  readonly role?: UserRole;
  readonly isActive?: boolean;
  readonly siteId?: string | null;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<UserWithCredentials | null>;
  existsByEmail(email: string): Promise<boolean>;
  list(): Promise<User[]>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  recordSignIn(id: string, at: Date): Promise<void>;
  countByRole(role: UserRole, options?: { activeOnly?: boolean }): Promise<number>;
}
