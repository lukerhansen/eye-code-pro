import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { doctors, insurancePlans } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { getDynamicReimbursementById } from '@/lib/insurance-utils';

// CPT codes to fetch fees for
const CPT_CODES = [
  '92002', '92004', '92012', '92014',
  '99202', '99203', '99204', '99205',
  '99212', '99213', '99214', '99215'
];

export async function GET(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctorId');
    const insurancePlanId = searchParams.get('insurancePlanId');
    const otherSelectedAsInsurance = searchParams.get('otherSelectedAsInsurance') === 'true';

    if (!doctorId || !insurancePlanId) {
      return NextResponse.json(
        { error: 'Doctor ID and Insurance plan ID are required' },
        { status: 400 }
      );
    }

    // Verify doctor belongs to team
    const [doctor] = await db
      .select()
      .from(doctors)
      .where(and(eq(doctors.id, parseInt(doctorId)), eq(doctors.teamId, team.id)))
      .limit(1);

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
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

    // Get dynamic fee schedules for all CPT codes
    const feeSchedules = await Promise.all(
      CPT_CODES.map(async (code) => {
        const amount = await getDynamicReimbursementById(
          parseInt(doctorId),
          parseInt(insurancePlanId),
          code,
          team.state,
          otherSelectedAsInsurance
        );
        return {
          code,
          amount: Math.round(amount * 100), // Convert to cents for consistency
        };
      })
    );

    return NextResponse.json({
      insurancePlan,
      state: team.state,
      feeSchedules,
      usedFallback: otherSelectedAsInsurance,
    });
  } catch (error) {
    console.error('Error fetching dynamic fee schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dynamic fee schedules' },
      { status: 500 }
    );
  }
}