export type AuthUser = {
  id: number;
  email: string;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type AuthResponse = {
  user: AuthUser;
} & AuthTokens;

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type AuthFormMode = "login" | "register";
