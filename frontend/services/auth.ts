import api from "./api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: "doctor" | "patient";
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: string;
  user_id: string;
  name: string;
}

export const authService = {
  login: (data: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", data).then((r) => r.data),

  register: (data: RegisterPayload) =>
    api.post("/auth/register", data).then((r) => r.data),
};
