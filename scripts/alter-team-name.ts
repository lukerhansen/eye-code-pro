import { client } from '../lib/db/drizzle';
import dotenv from 'dotenv';

dotenv.config();

async function alterTeamName() {
  try {
    console.log('Connecting to database...');
    
    // Execute the ALTER TABLE command
    const result = await client`ALTER TABLE teams ALTER COLUMN name DROP NOT NULL;`;
    
    console.log('Successfully altered teams table - name column is now nullable');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('Error executing SQL command:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run the function
alterTeamName();