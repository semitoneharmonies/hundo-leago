export function accountPasswordError(password, confirmation) {
  const length = Array.from(password).length;
  if (length < 6 || length > 256) {
    return "Use a password between 6 and 256 characters.";
  }
  if (password !== confirmation) {
    return "The password confirmation does not match.";
  }
  return "";
}
