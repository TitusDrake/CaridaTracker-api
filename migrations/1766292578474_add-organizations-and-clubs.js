/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Create organizations table
  pgm.createTable('organizations', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true, unique: true },
    description: { type: 'text' },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    }
  });

  // Create trigger for organizations updated_at
  pgm.sql(`
    CREATE TRIGGER update_organizations_updated_at
      BEFORE UPDATE ON organizations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `);

  // Create clubs table
  pgm.createTable('clubs', {
    id: 'id',
    organization_id: {
      type: 'integer',
      notNull: true,
      references: 'organizations(id)',
      onDelete: 'CASCADE'
    },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    location: { type: 'varchar(255)' },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    }
  });

  // Create index for clubs organization_id
  pgm.createIndex('clubs', 'organization_id');

  // Create trigger for clubs updated_at
  pgm.sql(`
    CREATE TRIGGER update_clubs_updated_at
      BEFORE UPDATE ON clubs
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `);

  // Create club_members junction table (users belong to clubs with roles)
  pgm.createTable('club_members', {
    id: 'id',
    club_id: {
      type: 'integer',
      notNull: true,
      references: 'clubs(id)',
      onDelete: 'CASCADE'
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    role: {
      type: 'varchar(50)',
      notNull: true,
      default: "'member'"
    },
    joined_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    }
  });

  // Add unique constraint - user can only have one role per club
  pgm.addConstraint('club_members', 'unique_club_user', {
    unique: ['club_id', 'user_id']
  });

  // Create indexes for club_members
  pgm.createIndex('club_members', 'club_id');
  pgm.createIndex('club_members', 'user_id');
  pgm.createIndex('club_members', 'role');

  // Create troop_clubs junction table (which clubs can see/access each troop)
  pgm.createTable('troop_clubs', {
    id: 'id',
    troop_id: {
      type: 'integer',
      notNull: true,
      references: 'troops(id)',
      onDelete: 'CASCADE'
    },
    club_id: {
      type: 'integer',
      notNull: true,
      references: 'clubs(id)',
      onDelete: 'CASCADE'
    },
    enabled: {
      type: 'boolean',
      notNull: true,
      default: true
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    }
  });

  // Add unique constraint - each club can only be enabled/disabled once per troop
  pgm.addConstraint('troop_clubs', 'unique_troop_club', {
    unique: ['troop_id', 'club_id']
  });

  // Create indexes for troop_clubs
  pgm.createIndex('troop_clubs', 'troop_id');
  pgm.createIndex('troop_clubs', 'club_id');
  pgm.createIndex('troop_clubs', 'enabled');

  // Add created_by_club_id to troops table
  pgm.addColumn('troops', {
    created_by_club_id: {
      type: 'integer',
      references: 'clubs(id)',
      onDelete: 'SET NULL'
    }
  });

  // Add index for created_by_club_id
  pgm.createIndex('troops', 'created_by_club_id');

  // MODIFY troop_attendees to add club_id
  // First, drop the existing unique constraint
  pgm.dropConstraint('troop_attendees', 'unique_troop_user');

  // Add club_id column to troop_attendees
  pgm.addColumn('troop_attendees', {
    club_id: {
      type: 'integer',
      notNull: true,
      references: 'clubs(id)',
      onDelete: 'CASCADE',
      // For existing rows, we'll need to handle this manually or set a default
      // Since this is a new feature, we can make it NOT NULL for new deployments
      default: 1 // Temporary default, should be removed after data migration
    }
  });

  // Add new unique constraint - user can attend same troop multiple times (once per club)
  pgm.addConstraint('troop_attendees', 'unique_troop_user_club', {
    unique: ['troop_id', 'user_id', 'club_id']
  });

  // Create index for club_id in troop_attendees
  pgm.createIndex('troop_attendees', 'club_id');

  // Add is_super_admin to users table for super admin role
  pgm.addColumn('users', {
    is_super_admin: {
      type: 'boolean',
      notNull: true,
      default: false
    }
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Remove is_super_admin from users
  pgm.dropColumn('users', 'is_super_admin');

  // Remove club_id from troop_attendees
  pgm.dropConstraint('troop_attendees', 'unique_troop_user_club');
  pgm.dropColumn('troop_attendees', 'club_id');

  // Restore original unique constraint
  pgm.addConstraint('troop_attendees', 'unique_troop_user', {
    unique: ['troop_id', 'user_id']
  });

  // Remove created_by_club_id from troops
  pgm.dropColumn('troops', 'created_by_club_id');

  // Drop tables in reverse order (respect foreign keys)
  pgm.dropTable('troop_clubs');
  pgm.dropTable('club_members');
  pgm.dropTable('clubs');
  pgm.dropTable('organizations');
};
