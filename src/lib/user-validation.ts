export type ValidationCode =
  | "required"
  | "tooLong"
  | "invalidEmail"
  | "passwordLength"
  | "passwordMismatch";

const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MIN_PASSWORD = 12;
const MAX_PASSWORD = 128;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateName(value: string): { value: string; error?: ValidationCode } {
  const name = value.trim();
  if (!name) return { value: name, error: "required" };
  if (name.length > MAX_NAME) return { value: name, error: "tooLong" };
  return { value: name };
}

export function validateEmail(value: string): { value: string; error?: ValidationCode } {
  const email = normalizeEmail(value);
  if (!email) return { value: email, error: "required" };
  if (email.length > MAX_EMAIL || !EMAIL_FORMAT.test(email)) {
    return { value: email, error: "invalidEmail" };
  }
  return { value: email };
}

export type ProfileFields = "name" | "lastName" | "email";

export function validateProfile(input: { name: string; lastName: string; email: string }) {
  const name = validateName(input.name);
  const lastName = validateName(input.lastName);
  const email = validateEmail(input.email);
  const errors: Partial<Record<ProfileFields, ValidationCode>> = {};
  if (name.error) errors.name = name.error;
  if (lastName.error) errors.lastName = lastName.error;
  if (email.error) errors.email = email.error;
  return {
    values: { name: name.value, lastName: lastName.value, email: email.value },
    errors,
  };
}

export function validateNewPassword(
  password: string,
  confirm: string
): Partial<Record<"password" | "confirm", ValidationCode>> {
  if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
    return { password: "passwordLength" };
  }
  if (password !== confirm) return { confirm: "passwordMismatch" };
  return {};
}
