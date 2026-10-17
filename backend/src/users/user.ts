/** Usuario tal como lo ven las demás capas: nunca incluye la contraseña ni su hash. */
export interface User {
  id: string;
  name: string;
  email: string;
}
