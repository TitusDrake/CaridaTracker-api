/**
 * Migration: Add password reset tokens table
 *
 * Creates the password_reset_tokens table for password reset functionality.
 */

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // Create password_reset_tokens table
  pgm.createTable('password_reset_tokens', {
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
  pgm.createIndex('password_reset_tokens', 'token');

  // Index for cleanup of expired tokens
  pgm.createIndex('password_reset_tokens', 'expires_at');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable('password_reset_tokens');
};
