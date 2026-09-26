import client from "./client";

// Backend schema: UserRegister — adjust field names here if your
// actual schema differs (check /docs → Schemas → UserRegister).
export function registerUser({ name, email, password, role }) {
  return client.post("/auth/register", { name, email, password, role });
}

// Backend schema: Body_login_auth_login_post — FastAPI's default
// OAuth2PasswordRequestForm expects x-www-form-urlencoded data with
// "username" + "password" fields (username = email here).
export function loginUser({ email, password }) {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  return client.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

export const requestPasswordReset = (email) => client.post("/auth/forgot-password", { email });
export const resetPassword = ({ email, otp, password }) => client.post("/auth/reset-password", { email, otp, password });
