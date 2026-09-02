import { ForbiddenError, UnauthorizedError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import { toSessionUser, type SessionUser } from "../../domain/user";
import type { PasswordHasher } from "../ports/password-hasher";
import type { UserRepository } from "../ports/user-repository";
import type { SignInInput } from "../schemas";

interface Dependencies {
  readonly users: UserRepository;
  readonly hasher: PasswordHasher;
}

/**
 * Verifies credentials and returns the identity to put in a session.
 * Creating the cookie is a transport concern and stays in the API layer.
 */
export const signIn =
  ({ users, hasher }: Dependencies) =>
  async (input: SignInInput): Promise<Result<SessionUser>> => {
    const user = await users.findByEmail(input.email);

    // A missing account and a wrong password return the same message so the
    // sign-in form cannot be used to discover which emails exist.
    const invalidCredentials = new UnauthorizedError("Email or password is incorrect.");

    if (!user) {
      // Hash anyway to keep the response time similar for unknown accounts.
      await hasher.hash(input.password);
      return failure(invalidCredentials);
    }

    const passwordMatches = await hasher.verify(input.password, user.passwordHash);
    if (!passwordMatches) {
      return failure(invalidCredentials);
    }

    if (!user.isActive) {
      return failure(new ForbiddenError("This account has been deactivated."));
    }

    await users.recordSignIn(user.id, new Date());

    return success(toSessionUser(user));
  };
