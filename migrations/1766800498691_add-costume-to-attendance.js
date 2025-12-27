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
  // Add costume fields to troop_attendees
  pgm.addColumns('troop_attendees', {
    costume_id: {
      type: 'integer',
      notNull: false,
    },
    costume_name: {
      type: 'varchar(255)',
      notNull: false,
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropColumns('troop_attendees', ['costume_id', 'costume_name']);
};
