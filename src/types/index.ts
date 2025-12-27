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
  max_troopers?: number | null;
  max_squires?: number | null;
  admin_approval_required: boolean;
  waitlist_enabled: boolean;
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
  max_troopers?: number;
  max_squires?: number;
  admin_approval_required?: boolean;
  waitlist_enabled?: boolean;
  club_ids?: number[]; // Clubs that can see this troop
}

export type TroopUpdateInput = Partial<TroopCreateInput>;

export interface TroopWithDetails extends Troop {
  creator_username?: string | null;
  creator_club_name?: string | null;
  attendee_count?: number;
  is_attending?: boolean;
  clubs?: Club[];
}

export type AttendeeType = 'trooper' | 'squire';
export type SignupStatus = 'confirmed' | 'waitlisted' | 'pending_approval' | 'rejected';

export interface TroopAttendee {
  id: number;
  troop_id: number;
  user_id: number;
  club_id: number;
  status: string;
  notes?: string | null;
  costume_id?: number | null;
  costume_name?: string | null;
  backup_costume_id?: number | null;
  backup_costume_name?: string | null;
  attendance_status?: 'confirmed' | 'tentative' | null;
  shift_id?: number | null;
  attendee_type: AttendeeType;
  signup_status: SignupStatus;
  waitlist_position?: number | null;
  approved_by?: number | null;
  approved_at?: Date | null;
  signed_up_at: Date;
}

export interface TroopShift {
  id: number;
  troop_id: number;
  name: string;
  start_time?: string | null;
  end_time?: string | null;
  max_attendees?: number | null;
  max_troopers?: number | null;
  max_squires?: number | null;
  created_at: Date;
}

export interface TroopShiftInput {
  name: string;
  start_time?: string;
  end_time?: string;
  max_attendees?: number;
  max_troopers?: number;
  max_squires?: number;
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

// 501st Legion API Types
export interface Legion501Costume {
  costumeId: number;
  prefix: string;
  costumeName: string;
  photoURL: string;
  thumbnail: string;
  bucketOffPhoto: string;
}

export interface Legion501CostumesResponse {
  costumes: Legion501Costume[];
}

export interface Legion501Member {
  legionId: number;
  fullName: string;
  thumbnail: string;
  link: string;
  memberApproved: string;
  memberStatus: string;
  memberStanding: string;
  joinDate: string;
}
