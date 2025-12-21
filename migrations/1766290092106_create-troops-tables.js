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
  // Create troops table
  pgm.createTable('troops', {
    id: 'id',
    event_name: { type: 'varchar(255)', notNull: true },
    event_date: { type: 'date', notNull: true },
    venue_name: { type: 'varchar(255)' },
    address: { type: 'varchar(255)' },
    city: { type: 'varchar(100)' },
    state: { type: 'varchar(50)' },
    zip_code: { type: 'varchar(20)' },
    start_time: { type: 'time' },
    arrival_time: { type: 'time' },
    end_time: { type: 'time' },
    prop_weapons_allowed: { type: 'boolean', default: false },
    share_with_sister_groups: { type: 'boolean', default: false },
    requested_characters_count: { type: 'varchar(100)' },
    secure_changing_area: { type: 'boolean', default: false },
    changing_area_description: { type: 'text' },
    amenities: { type: 'text' },
    description: { type: 'text' },
    signup_link: { type: 'varchar(500)' },
    policies_link: { type: 'varchar(500)' },
    created_by: {
      type: 'integer',
      references: 'users(id)',
      onDelete: 'SET NULL'
    },
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

  // Create indexes
  pgm.createIndex('troops', 'event_date');
  pgm.createIndex('troops', 'created_by');

  // Create trigger to auto-update updated_at
  pgm.sql(`
    CREATE TRIGGER update_troops_updated_at
      BEFORE UPDATE ON troops
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `);

  // Create troop_attendees junction table
  pgm.createTable('troop_attendees', {
    id: 'id',
    troop_id: {
      type: 'integer',
      notNull: true,
      references: 'troops(id)',
      onDelete: 'CASCADE'
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    status: { type: 'varchar(50)', default: "'attending'" },
    notes: { type: 'text' },
    signed_up_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    }
  });

  // Add unique constraint to prevent duplicate attendees
  pgm.addConstraint('troop_attendees', 'unique_troop_user', {
    unique: ['troop_id', 'user_id']
  });

  // Create indexes for junction table
  pgm.createIndex('troop_attendees', 'troop_id');
  pgm.createIndex('troop_attendees', 'user_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop tables in reverse order (junction table first due to foreign keys)
  pgm.dropTable('troop_attendees');
  pgm.dropTable('troops');
};
