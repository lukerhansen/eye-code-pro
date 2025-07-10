import { db } from './drizzle';
import { insurancePlans, defaultFeeSchedules } from './schema';
import { INSURANCE_PLANS, CODE_REIMBURSEMENT } from '../insurance-data';

// Default region for seed data
const DEFAULT_REGION = 'midwest';

async function seedInsurancePlans() {
  console.log('Seeding insurance plans...');

  try {
    // First, insert all insurance plans
    for (const [planName, coversFreeExam] of Object.entries(INSURANCE_PLANS)) {
      await db.insert(insurancePlans)
        .values({
          name: planName,
          coversFreeExam,
        })
        .onConflictDoNothing();
    }

    console.log('Insurance plans seeded successfully');

    // Get all insurance plans from database
    const plans = await db.select().from(insurancePlans);
    
    // Now seed default fee schedules for each plan that has reimbursement data
    console.log('Seeding default fee schedules...');
    
    for (const plan of plans) {
      const reimbursementData = CODE_REIMBURSEMENT[plan.name];
      
      if (reimbursementData) {
        for (const [code, amount] of Object.entries(reimbursementData)) {
          await db.insert(defaultFeeSchedules)
            .values({
              insurancePlanId: plan.id,
              region: DEFAULT_REGION,
              code,
              amount: Math.round(amount * 100), // Convert to cents
            })
            .onConflictDoNothing();
        }
      } else if (CODE_REIMBURSEMENT.Medicare) {
        // Use Medicare as default for plans without specific reimbursement data
        for (const [code, amount] of Object.entries(CODE_REIMBURSEMENT.Medicare)) {
          await db.insert(defaultFeeSchedules)
            .values({
              insurancePlanId: plan.id,
              region: DEFAULT_REGION,
              code,
              amount: Math.round(amount * 100), // Convert to cents
            })
            .onConflictDoNothing();
        }
      }
    }

    console.log('Default fee schedules seeded successfully');
    console.log('Seed completed successfully!');
    
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seedInsurancePlans();