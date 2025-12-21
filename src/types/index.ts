export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  tkid?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreateInput {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  tkid?: string;
  organizationId?: number;
  clubId?: number;
}

export interface UserLoginInput {
  emailOrUsername: string; // Can be either email or username
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
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    tkid?: string | null;
  };
  token: string;
}

export interface Organization {
  id: number;
  name: string;
  description?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Club {
  id: number;
  organization_id: number;
  name: string;
  description?: string | null;
  location?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ClubWithOrganization extends Club {
  organization?: Organization;
}
