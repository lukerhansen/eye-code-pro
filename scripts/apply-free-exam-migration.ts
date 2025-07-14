import { sql } from 'drizzle-orm';
import { db } from '../lib/db/drizzle';

async function applyMigration() {
  try {
    console.log('Applying migration to add covers_free_exam column...');
    
    await db.execute(sql`
      ALTER TABLE doctor_insurances 
      ADD COLUMN IF NOT EXISTS covers_free_exam BOOLEAN DEFAULT NULL
    `);
    
    console.log('Migration applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();