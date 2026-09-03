const COMBINING_DIACRITICS = /[̀-ͯ]/g;

function normalizeToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

export class UsernamePolicy {
  /**
   * Yields candidate usernames in order of preference:
   * first letter of the first name + last name, then 2 letters + last name, etc.
   * Once the whole first name is exhausted, falls back to a numeric suffix.
   */
  static *candidates(
    name: string,
    lastName: string,
  ): Generator<string, never, unknown> {
    const firstToken = normalizeToken(name.split(/\s+/)[0] ?? name) || 'user';
    const lastToken =
      normalizeToken(lastName.split(/\s+/)[0] ?? lastName) || 'employee';

    for (let length = 1; length <= firstToken.length; length++) {
      yield firstToken.slice(0, length) + lastToken;
    }

    let suffix = 2;
    for (;;) {
      yield `${firstToken}${lastToken}${suffix}`;
      suffix++;
    }
  }
}
