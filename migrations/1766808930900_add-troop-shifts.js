/**
 * Migration: Add troop shifts table
 *
 * Creates the troop_shifts table for troops with multiple time slots.
 * Also adds shift_id to troop_attendees and updates attendance fields.
 */

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // Create troop_shifts table
  pgm.createTable('troop_shifts', {
    id: 'id',
    troop_id: {
      type: 'integer',
      notNull: true,
      references: '"troops"',
      onDelete: 'CASCADE',
    },
    name: {
      type: 'varchar(100)',
      notNull: true,
    },
    start_time: {
      type: 'time',
      notNull: false,
    },
    end_time: {
      type: 'time',
      notNull: false,
    },
    max_attendees: {
      type: 'integer',
      notNull: false,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Add index for efficient lookup by troop
  pgm.createIndex('troop_shifts', 'troop_id');

  // Add shift_id to troop_attendees
  pgm.addColumn('troop_attendees', {
    shift_id: {
      type: 'integer',
      notNull: false,
      references: '"troop_shifts"',
      onDelete: 'SET NULL',
    },
  });

  // Add backup costume fields to troop_attendees
  pgm.addColumn('troop_attendees', {
    backup_costume_id: {
      type: 'integer',
      notNull: false,
    },
    backup_costume_name: {
      type: 'varchar(255)',
      notNull: false,
    },
  });

  // Add attendance_status column (replacing generic 'status' with more specific values)
  pgm.addColumn('troop_attendees', {
    attendance_status: {
      type: 'varchar(50)',
      notNull: false,
      default: 'confirmed',
    },
  });

  // Create index for shift_id lookups
  pgm.createIndex('troop_attendees', 'shift_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  // Remove indexes first
  pgm.dropIndex('troop_attendees', 'shift_id');

  // Remove columns from troop_attendees
  pgm.dropColumn('troop_attendees', 'attendance_status');
  pgm.dropColumn('troop_attendees', 'backup_costume_name');
  pgm.dropColumn('troop_attendees', 'backup_costume_id');
  pgm.dropColumn('troop_attendees', 'shift_id');

  // Drop index and table
  pgm.dropIndex('troop_shifts', 'troop_id');
  pgm.dropTable('troop_shifts');
};
