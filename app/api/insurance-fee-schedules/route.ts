import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { defaultFeeSchedules, insurancePlans } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const insurancePlanId = searchParams.get('insurancePlanId');
    const state = searchParams.get('state'); // State code (e.g., 'CA', 'NY')

    if (!insurancePlanId) {
      return NextResponse.json(
        { error: 'Insurance plan ID is required' },
        { status: 400 }
      );
    }

    // Get the insurance plan details
    const [insurancePlan] = await db
      .select()
      .from(insurancePlans)
      .where(eq(insurancePlans.id, parseInt(insurancePlanId)))
      .limit(1);

    if (!insurancePlan) {
      return NextResponse.json(
        { error: 'Insurance plan not found' },
        { status: 404 }
      );
    }

    // Get default fee schedules for this insurance and state (with global fallback)
    let feeSchedules;
    
    if (state) {
      // Try to get state-specific fee schedules first
      feeSchedules = await db
        .select()
        .from(defaultFeeSchedules)
        .where(
          and(
            eq(defaultFeeSchedules.insurancePlanId, parseInt(insurancePlanId)),
            eq(defaultFeeSchedules.state, state)
          )
        );
    }
    
    // If no state-specific schedules found, get global defaults
    if (!feeSchedules || feeSchedules.length === 0) {
      feeSchedules = await db
        .select()
        .from(defaultFeeSchedules)
        .where(
          and(
            eq(defaultFeeSchedules.insurancePlanId, parseInt(insurancePlanId)),
            isNull(defaultFeeSchedules.state)
          )
        );
    }

    return NextResponse.json({
      insurancePlan,
      state,
      feeSchedules: feeSchedules.map(fs => ({
        code: fs.code,
        amount: fs.amount, // Amount is in cents
      })),
    });
  } catch (error) {
    console.error('Error fetching fee schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fee schedules' },
      { status: 500 }
    );
  }
}

// Get all available US states
export async function OPTIONS() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // US state abbreviations
    const states = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];

    return NextResponse.json({ states });
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json(
      { error: 'Failed to fetch states' },
      { status: 500 }
    );
  }
}