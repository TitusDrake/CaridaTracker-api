export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreateInput {
  email: string;
  username: string;
  password: string;
}

export interface UserLoginInput {
  email: string;
  password: string;
}

export interface AuthTokenPayload {
  userId: number;
  email: string;
  username: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    username: string;
  };
  token: string;
}
