export type FormState = {
  errors?: Record<string, string>;
  values?: Record<string, string>;
  message?: string;
};
export function formValues(data: FormData, fields: string[]) {
  return Object.fromEntries(
    fields.map((field) => [field, String(data.get(field) ?? "").trim()]),
  );
}
export function validateBlog(values: Record<string, string>) {
  const errors: Record<string, string> = {};
  for (const [field, maximum] of [
    ["title", 300],
    ["author", 200],
    ["url", 2000],
  ] as const) {
    if ((values[field]?.length ?? 0) < 5)
      errors[field] =
        `${field === "url" ? "URL" : field[0].toUpperCase() + field.slice(1)} must contain at least 5 characters.`;
    else if (values[field].length > maximum)
      errors[field] = `Maximum ${maximum} characters.`;
  }
  if (!errors.url) {
    try {
      if (!["https:", "http:"].includes(new URL(values.url).protocol))
        errors.url = "Use an HTTP or HTTPS URL.";
    } catch {
      errors.url = "Enter a valid HTTP or HTTPS URL.";
    }
  }
  return errors;
}
export function validateUser(
  values: Record<string, string>,
  password: string,
  confirmation: string,
) {
  const errors: Record<string, string> = {};
  if (values.username.length < 4 || values.username.length > 100)
    errors.username = "Username must contain between 4 and 100 characters.";
  if (!values.name || values.name.length > 200)
    errors.name = "Name is required (maximum 200 characters).";
  if (password.length < 4 || new TextEncoder().encode(password).length > 72)
    errors.password =
      "Password must contain at least 4 characters and at most 72 bytes.";
  if (password !== confirmation)
    errors.passwordConfirm = "Passwords must match.";
  return errors;
}
