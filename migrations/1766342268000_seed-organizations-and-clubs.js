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
  // Insert organizations
  pgm.sql(`
    INSERT INTO organizations (name, description) VALUES
    ('501st Legion', 'The 501st Legion is a worldwide Star Wars costuming organization dedicated to celebrating the Star Wars universe through the creation and wearing of quality costumes.'),
    ('Rebel Legion', 'The Rebel Legion is a worldwide Star Wars costuming organization focused on the heroes and good guys of the Star Wars universe.'),
    ('Mandalorian Mercs', 'The Mandalorian Mercs Costume Club is a worldwide Star Wars costuming organization dedicated to the Mandalorian culture and characters.'),
    ('Droid Builders', 'Droid Builders is a worldwide organization dedicated to building and operating astromech droids and other Star Wars robots.'),
    ('Jedi Sith Alliance', 'The Jedi Sith Alliance is a Star Wars costuming organization focused on Force-wielding characters from the Star Wars universe.')
    ON CONFLICT (name) DO NOTHING;
  `);

  // Insert clubs (need to get organization IDs first)
  // Using DO NOTHING to allow re-running the migration safely
  pgm.sql(`
    INSERT INTO clubs (organization_id, name, description, location)
    SELECT 
      (SELECT id FROM organizations WHERE name = '501st Legion' LIMIT 1),
      'Garrison Carida',
      'Garrison Carida is the Pennsylvania chapter of the 501st Legion.',
      'Pennsylvania, USA'
    WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Garrison Carida');
    
    INSERT INTO clubs (organization_id, name, description, location)
    SELECT 
      (SELECT id FROM organizations WHERE name = 'Rebel Legion' LIMIT 1),
      'Kyber Base',
      'Kyber Base is the Pennsylvania chapter of the Rebel Legion.',
      'Pennsylvania, USA'
    WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Kyber Base');
    
    INSERT INTO clubs (organization_id, name, description, location)
    SELECT 
      (SELECT id FROM organizations WHERE name = 'Rebel Legion' LIMIT 1),
      'Ghost Base',
      'Ghost Base is a chapter of the Rebel Legion.',
      'USA'
    WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Ghost Base');
    
    INSERT INTO clubs (organization_id, name, description, location)
    SELECT 
      (SELECT id FROM organizations WHERE name = '501st Legion' LIMIT 1),
      'Starkiller',
      'Starkiller is a chapter of the 501st Legion.',
      'USA'
    WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Starkiller');
    
    INSERT INTO clubs (organization_id, name, description, location)
    SELECT 
      (SELECT id FROM organizations WHERE name = 'Mandalorian Mercs' LIMIT 1),
      'Mav Oya''la Clan',
      'Mav Oya''la Clan is the Pennsylvania chapter of the Mandalorian Mercs Costume Club.',
      'Pennsylvania, USA'
    WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Mav Oya''la Clan');
    
    INSERT INTO clubs (organization_id, name, description, location)
    SELECT 
      (SELECT id FROM organizations WHERE name = 'Droid Builders' LIMIT 1),
      'Mid Atlantic Droid and Prop Builders',
      'Mid Atlantic Droid and Prop Builders is a regional chapter of Droid Builders serving the Mid-Atlantic region.',
      'Mid-Atlantic, USA'
    WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Mid Atlantic Droid and Prop Builders');
    
    INSERT INTO clubs (organization_id, name, description, location)
    SELECT 
      (SELECT id FROM organizations WHERE name = 'Jedi Sith Alliance' LIMIT 1),
      'Central PA Jedi Sith Alliance',
      'Central PA Jedi Sith Alliance is the Central Pennsylvania chapter of the Jedi Sith Alliance.',
      'Central Pennsylvania, USA'
    WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Central PA Jedi Sith Alliance');
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Remove clubs first (due to foreign key constraints)
  pgm.sql(`
    DELETE FROM clubs WHERE name IN (
      'Garrison Carida',
      'Starkiller',
      'Kyber Base',
      'Ghost Base',
      'Mav Oya''la Clan',
      'Mid Atlantic Droid and Prop Builders',
      'Central PA Jedi Sith Alliance'
    );
  `);

  // Remove organizations
  pgm.sql(`
    DELETE FROM organizations WHERE name IN (
      '501st Legion',
      'Rebel Legion',
      'Mandalorian Mercs',
      'Droid Builders',
      'Jedi Sith Alliance'
    );
  `);
};
