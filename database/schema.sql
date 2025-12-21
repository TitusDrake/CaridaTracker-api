-- CaridaTracker Database Schema

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(30) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create troops table
CREATE TABLE IF NOT EXISTS troops (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  venue_name VARCHAR(255),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  start_time TIME,
  arrival_time TIME,
  end_time TIME,
  prop_weapons_allowed BOOLEAN DEFAULT false,
  share_with_sister_groups BOOLEAN DEFAULT false,
  requested_characters_count VARCHAR(100),
  secure_changing_area BOOLEAN DEFAULT false,
  changing_area_description TEXT,
  amenities TEXT,
  description TEXT,
  signup_link VARCHAR(500),
  policies_link VARCHAR(500),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on event_date for faster lookups and sorting
CREATE INDEX IF NOT EXISTS idx_troops_event_date ON troops(event_date);

-- Create index on created_by for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_troops_created_by ON troops(created_by);

-- Trigger to automatically update updated_at for troops
CREATE TRIGGER update_troops_updated_at
  BEFORE UPDATE ON troops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create troop_attendees junction table (for many-to-many relationship)
CREATE TABLE IF NOT EXISTS troop_attendees (
  id SERIAL PRIMARY KEY,
  troop_id INTEGER NOT NULL REFERENCES troops(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'attending',
  notes TEXT,
  signed_up_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(troop_id, user_id)
);

-- Create indexes for junction table
CREATE INDEX IF NOT EXISTS idx_troop_attendees_troop_id ON troop_attendees(troop_id);
CREATE INDEX IF NOT EXISTS idx_troop_attendees_user_id ON troop_attendees(user_id);
