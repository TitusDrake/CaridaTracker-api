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
  // Insert test troops for Garrison Carida (club_id = 1)
  // Using dates relative to "now" for realistic upcoming/past mix
  pgm.sql(`
    INSERT INTO troops (event_name, event_date, created_by_club_id, venue_name, address, city, state, zip_code, description, created_at, updated_at)
    VALUES
      ('Star Wars Day at Hersheypark', CURRENT_DATE + INTERVAL '14 days', 1, 'Hersheypark', '100 Hersheypark Drive', 'Hershey', 'PA', '17033', 'Meet at the main entrance. Bring your own water bottles! Supporting Make-A-Wish Foundation.', NOW(), NOW()),
      ('Reading Phillies Game', CURRENT_DATE + INTERVAL '30 days', 1, 'FirstEnergy Stadium', '1900 Centre Ave', 'Reading', 'PA', '19605', 'Pre-game parade on the field. Arrive 2 hours early. Supporting Childrens Miracle Network.', NOW(), NOW()),
      ('Lancaster Comic Con', CURRENT_DATE + INTERVAL '45 days', 1, 'Lancaster County Convention Center', '25 S Queen St', 'Lancaster', 'PA', '17603', 'Full weekend event. Saturday and Sunday shifts available.', NOW(), NOW()),
      ('Harrisburg Hospital Visit', CURRENT_DATE - INTERVAL '7 days', 1, 'UPMC Pinnacle Harrisburg', '111 S Front St', 'Harrisburg', 'PA', '17101', 'Pediatric ward visit. Keep noise levels down. Supporting UPMC Childrens Hospital.', NOW(), NOW()),
      ('York Revolution Game', CURRENT_DATE + INTERVAL '60 days', 1, 'PeoplesBank Park', '5 Brooks Robinson Way', 'York', 'PA', '17401', 'Star Wars night! Fireworks after the game. Supporting York County Food Bank.', NOW(), NOW());
  `);

  // Enable all troops for Garrison Carida (club_id = 1)
  pgm.sql(`
    INSERT INTO troop_clubs (troop_id, club_id, enabled, created_at)
    SELECT id, 1, true, NOW()
    FROM troops
    WHERE created_by_club_id = 1;
  `);

  // Also enable some troops for Kyber Base (club_id = 2) - sister club sharing
  pgm.sql(`
    INSERT INTO troop_clubs (troop_id, club_id, enabled, created_at)
    SELECT id, 2, true, NOW()
    FROM troops
    WHERE created_by_club_id = 1
    AND event_name IN ('Star Wars Day at Hersheypark', 'Lancaster Comic Con', 'York Revolution Game');
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Remove troop_clubs entries first (foreign key constraint)
  pgm.sql(`
    DELETE FROM troop_clubs
    WHERE troop_id IN (
      SELECT id FROM troops WHERE created_by_club_id = 1
    );
  `);

  // Remove the test troops
  pgm.sql(`
    DELETE FROM troops WHERE created_by_club_id = 1;
  `);
};
