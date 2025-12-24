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

export interface Troop {
  id: number;
  event_name: string;
  event_date: Date;
  venue_name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  start_time?: string | null;
  arrival_time?: string | null;
  end_time?: string | null;
  prop_weapons_allowed: boolean;
  share_with_sister_groups: boolean;
  requested_characters_count?: string | null;
  secure_changing_area: boolean;
  changing_area_description?: string | null;
  amenities?: string | null;
  description?: string | null;
  signup_link?: string | null;
  policies_link?: string | null;
  created_by?: number | null;
  created_by_club_id?: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface TroopCreateInput {
  event_name: string;
  event_date: string;
  venue_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  start_time?: string;
  arrival_time?: string;
  end_time?: string;
  prop_weapons_allowed?: boolean;
  share_with_sister_groups?: boolean;
  requested_characters_count?: string;
  secure_changing_area?: boolean;
  changing_area_description?: string;
  amenities?: string;
  description?: string;
  signup_link?: string;
  policies_link?: string;
  club_ids?: number[]; // Clubs that can see this troop
}

export interface TroopUpdateInput extends Partial<TroopCreateInput> {}

export interface TroopWithDetails extends Troop {
  creator_username?: string | null;
  creator_club_name?: string | null;
  attendee_count?: number;
  is_attending?: boolean;
  clubs?: Club[];
}

export interface TroopAttendee {
  id: number;
  troop_id: number;
  user_id: number;
  club_id: number;
  status: string;
  notes?: string | null;
  signed_up_at: Date;
}

export interface TroopClub {
  id: number;
  troop_id: number;
  club_id: number;
  enabled: boolean;
  created_at: Date;
}

export interface ClubMember {
  id: number;
  club_id: number;
  user_id: number;
  role: 'super_admin' | 'admin' | 'member' | 'cadet';
  joined_at: Date;
}
