/**
 * Migration: Add trooper limits, waitlist, and admin approval
 *
 * Adds capacity limits for troopers and squires/handlers,
 * waitlist queue functionality, and admin approval requirement.
 */

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // Add capacity and approval fields to troops table
  pgm.addColumn('troops', {
    max_troopers: {
      type: 'integer',
      notNull: false,
      comment: 'Maximum number of costumed troopers allowed',
    },
    max_squires: {
      type: 'integer',
      notNull: false,
      comment: 'Maximum number of squires/handlers allowed',
    },
    admin_approval_required: {
      type: 'boolean',
      notNull: true,
      default: false,
      comment: 'Whether admin must approve each signup',
    },
    waitlist_enabled: {
      type: 'boolean',
      notNull: true,
      default: true,
      comment: 'Whether waitlist is enabled when capacity is reached',
    },
  });

  // Add capacity fields to shifts table (overrides troop-level settings)
  pgm.addColumn('troop_shifts', {
    max_troopers: {
      type: 'integer',
      notNull: false,
      comment: 'Maximum troopers for this shift (overrides troop setting)',
    },
    max_squires: {
      type: 'integer',
      notNull: false,
      comment: 'Maximum squires for this shift (overrides troop setting)',
    },
  });

  // Add attendee type and status fields to troop_attendees
  pgm.addColumn('troop_attendees', {
    attendee_type: {
      type: 'varchar(20)',
      notNull: true,
      default: 'trooper',
      comment: 'Type: trooper or squire',
    },
    signup_status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'confirmed',
      comment: 'Status: confirmed, waitlisted, pending_approval, rejected',
    },
    waitlist_position: {
      type: 'integer',
      notNull: false,
      comment: 'Position in waitlist queue (null if not waitlisted)',
    },
    approved_by: {
      type: 'integer',
      notNull: false,
      references: '"users"',
      onDelete: 'SET NULL',
      comment: 'Admin who approved this signup',
    },
    approved_at: {
      type: 'timestamp',
      notNull: false,
      comment: 'When the signup was approved',
    },
  });

  // Create index for waitlist ordering
  pgm.createIndex('troop_attendees', ['troop_id', 'shift_id', 'attendee_type', 'waitlist_position'], {
    name: 'idx_troop_attendees_waitlist',
    where: 'waitlist_position IS NOT NULL',
  });

  // Create index for quick signup_status lookups
  pgm.createIndex('troop_attendees', ['troop_id', 'signup_status']);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  // Drop indexes
  pgm.dropIndex('troop_attendees', ['troop_id', 'signup_status']);
  pgm.dropIndex('troop_attendees', ['troop_id', 'shift_id', 'attendee_type', 'waitlist_position'], {
    name: 'idx_troop_attendees_waitlist',
  });

  // Remove columns from troop_attendees
  pgm.dropColumn('troop_attendees', 'approved_at');
  pgm.dropColumn('troop_attendees', 'approved_by');
  pgm.dropColumn('troop_attendees', 'waitlist_position');
  pgm.dropColumn('troop_attendees', 'signup_status');
  pgm.dropColumn('troop_attendees', 'attendee_type');

  // Remove columns from troop_shifts
  pgm.dropColumn('troop_shifts', 'max_squires');
  pgm.dropColumn('troop_shifts', 'max_troopers');

  // Remove columns from troops
  pgm.dropColumn('troops', 'waitlist_enabled');
  pgm.dropColumn('troops', 'admin_approval_required');
  pgm.dropColumn('troops', 'max_squires');
  pgm.dropColumn('troops', 'max_troopers');
};
