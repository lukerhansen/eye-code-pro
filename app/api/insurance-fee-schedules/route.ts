import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { defaultFeeSchedules, insurancePlans } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const insurancePlanId = searchParams.get('insurancePlanId');
    const region = searchParams.get('region') || 'midwest'; // Default to midwest

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

    // Get default fee schedules for this insurance and region
    const feeSchedules = await db
      .select()
      .from(defaultFeeSchedules)
      .where(
        and(
          eq(defaultFeeSchedules.insurancePlanId, parseInt(insurancePlanId)),
          eq(defaultFeeSchedules.region, region)
        )
      );

    return NextResponse.json({
      insurancePlan,
      region,
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

// Get all available regions
export async function OPTIONS() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, we'll return a static list of regions
    // In the future, this could be dynamic from the database
    const regions = ['midwest', 'west', 'northeast', 'southeast', 'southwest'];

    return NextResponse.json({ regions });
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regions' },
      { status: 500 }
    );
  }
}