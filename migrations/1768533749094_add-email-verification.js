/**
 * Migration: Add email verification
 *
 * Adds email_verified field to users and creates email_verification_tokens table.
 */

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // Add email_verified column to users
  pgm.addColumn('users', {
    email_verified: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    email_verified_at: {
      type: 'timestamp with time zone',
      default: null,
    },
  });

  // Create email_verification_tokens table
  pgm.createTable('email_verification_tokens', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    token: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    expires_at: {
      type: 'timestamp with time zone',
      notNull: true,
    },
    used_at: {
      type: 'timestamp with time zone',
      default: null,
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Index for faster lookups by token
  pgm.createIndex('email_verification_tokens', 'token');

  // Index for cleanup of expired tokens
  pgm.createIndex('email_verification_tokens', 'expires_at');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable('email_verification_tokens');
  pgm.dropColumn('users', 'email_verified_at');
  pgm.dropColumn('users', 'email_verified');
};
