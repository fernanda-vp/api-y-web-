const RFC_PATTERN = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

export class RfcPolicy {
  static isValid(rfc: string): boolean {
    return RFC_PATTERN.test(rfc.trim().toUpperCase());
  }

  static normalize(rfc: string): string {
    return rfc.trim().toUpperCase();
  }
}
