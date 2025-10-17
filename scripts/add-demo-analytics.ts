import { sql } from 'drizzle-orm';
import { db } from '../lib/db/drizzle';

async function applyMigration() {
  try {
    console.log('Creating demo_analytics table...');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS demo_analytics (
        id SERIAL PRIMARY KEY,
        doctor_degree VARCHAR(20) NOT NULL,
        insurance_name VARCHAR(100) NOT NULL,
        patient_type VARCHAR(20) NOT NULL,
        level INTEGER NOT NULL,
        recommended_code VARCHAR(20) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    console.log('Migration applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();
