import { randomBytes } from 'node:crypto';

export class TempPasswordPolicy {
  static generate(): string {
    return randomBytes(9).toString('base64url');
  }
}
