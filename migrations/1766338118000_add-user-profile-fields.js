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
  // Add user profile columns to users table
  pgm.addColumn('users', {
    first_name: {
      type: 'varchar(100)',
      notNull: false
    },
    last_name: {
      type: 'varchar(100)',
      notNull: false
    },
    phone_number: {
      type: 'varchar(20)',
      notNull: false
    },
    tkid: {
      type: 'varchar(20)',
      notNull: false
    }
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Remove user profile columns
  pgm.dropColumn('users', 'tkid');
  pgm.dropColumn('users', 'phone_number');
  pgm.dropColumn('users', 'last_name');
  pgm.dropColumn('users', 'first_name');
};

