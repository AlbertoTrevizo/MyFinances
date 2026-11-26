export function isGoogleAuthoritative(email: string, hostedDomain?: string): boolean {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const domain = parts[1];
  return domain === "gmail.com" || domain === "googlemail.com" || domain === hostedDomain?.toLowerCase();
}
