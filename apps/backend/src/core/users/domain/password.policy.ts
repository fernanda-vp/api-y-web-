import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export class PasswordPolicy {
  static hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
  }

  static verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}
