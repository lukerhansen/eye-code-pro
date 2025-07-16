import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  doctorInsurances, 
  insurancePlans,
  doctors,
  customFeeSchedules,
  defaultFeeSchedules,
  type NewDoctorInsurance,
  type NewCustomFeeSchedule 
} from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { eq, and, or, isNull } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const resolvedParams = await params;
    const doctorId = parseInt(resolvedParams.id);

    // Verify doctor belongs to team
    const [doctor] = await db
      .select()
      .from(doctors)
      .where(and(eq(doctors.id, doctorId), eq(doctors.teamId, team.id)))
      .limit(1);

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Get all insurance plans - both global and team-specific custom ones
    const allInsurancePlans = await db
      .select()
      .from(insurancePlans)
      .where(
        or(
          isNull(insurancePlans.teamId), // Global insurances
          eq(insurancePlans.teamId, team.id) // Team's custom insurances
        )
      )
      .orderBy(insurancePlans.name);

    // Get doctor's insurance acceptances with custom fee schedules
    const doctorInsurancesList = await db
      .select({
        doctorInsurance: doctorInsurances,
        insurancePlan: insurancePlans,
      })
      .from(doctorInsurances)
      .innerJoin(insurancePlans, eq(doctorInsurances.insurancePlanId, insurancePlans.id))
      .where(eq(doctorInsurances.doctorId, doctorId));

    // Get custom fee schedules for this doctor
    const customFees = await db
      .select()
      .from(customFeeSchedules)
      .innerJoin(doctorInsurances, eq(customFeeSchedules.doctorInsuranceId, doctorInsurances.id))
      .where(eq(doctorInsurances.doctorId, doctorId));

    // Format response
    const insuranceAcceptances = allInsurancePlans.map(plan => {
      const acceptance = doctorInsurancesList.find(di => di.insurancePlan.id === plan.id);
      const customFeesForPlan = customFees.filter(cf => cf.doctor_insurances.insurancePlanId === plan.id);
      
      return {
        insurancePlan: plan,
        isAccepted: acceptance?.doctorInsurance.isAccepted ?? false,
        useCustomFeeSchedule: acceptance?.doctorInsurance.useCustomFeeSchedule ?? false,
        coversFreeExam: acceptance?.doctorInsurance.coversFreeExam ?? null,
        doctorInsuranceId: acceptance?.doctorInsurance.id,
        customFees: customFeesForPlan.map(cf => ({
          code: cf.custom_fee_schedules.code,
          amount: cf.custom_fee_schedules.amount,
        })),
      };
    });

    return NextResponse.json({ insuranceAcceptances });
  } catch (error) {
    console.error('Error fetching doctor insurances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctor insurances' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const resolvedParams = await params;
    const doctorId = parseInt(resolvedParams.id);
    const body = await req.json();
    const { insurancePlanId, isAccepted, useCustomFeeSchedule, coversFreeExam, customFees } = body;

    // Verify doctor belongs to team
    const [doctor] = await db
      .select()
      .from(doctors)
      .where(and(eq(doctors.id, doctorId), eq(doctors.teamId, team.id)))
      .limit(1);

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Check if relationship already exists
    const existing = await db
      .select()
      .from(doctorInsurances)
      .where(and(
        eq(doctorInsurances.doctorId, doctorId),
        eq(doctorInsurances.insurancePlanId, insurancePlanId)
      ))
      .limit(1);

    let doctorInsuranceId: number;

    if (existing.length > 0) {
      // Update existing
      const [updated] = await db
        .update(doctorInsurances)
        .set({
          isAccepted,
          useCustomFeeSchedule,
          coversFreeExam,
          updatedAt: new Date(),
        })
        .where(eq(doctorInsurances.id, existing[0].id))
        .returning();
      
      doctorInsuranceId = updated.id;

      // Delete existing custom fees if switching to default
      if (!useCustomFeeSchedule) {
        await db
          .delete(customFeeSchedules)
          .where(eq(customFeeSchedules.doctorInsuranceId, doctorInsuranceId));
      }
    } else {
      // Create new
      const newDoctorInsurance: NewDoctorInsurance = {
        doctorId,
        insurancePlanId,
        isAccepted,
        useCustomFeeSchedule,
        coversFreeExam,
      };

      const [inserted] = await db
        .insert(doctorInsurances)
        .values(newDoctorInsurance)
        .returning();
      
      doctorInsuranceId = inserted.id;
    }

    // Handle custom fees if provided and useCustomFeeSchedule is true
    if (useCustomFeeSchedule && customFees && Array.isArray(customFees)) {
      // Delete existing custom fees
      await db
        .delete(customFeeSchedules)
        .where(eq(customFeeSchedules.doctorInsuranceId, doctorInsuranceId));

      // Insert new custom fees
      const customFeeValues: NewCustomFeeSchedule[] = customFees.map(fee => ({
        doctorInsuranceId,
        code: fee.code,
        amount: fee.amount,
      }));

      if (customFeeValues.length > 0) {
        await db.insert(customFeeSchedules).values(customFeeValues);
      }
    }

    return NextResponse.json({ 
      message: 'Insurance acceptance updated successfully',
      doctorInsuranceId 
    });
  } catch (error) {
    console.error('Error updating doctor insurance:', error);
    return NextResponse.json(
      { error: 'Failed to update doctor insurance' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has owner role
    // if (user.accountRole !== 'owner') {
    //   return NextResponse.json({ error: 'Only owners can delete custom insurances' }, { status: 403 });
    // }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const resolvedParams = await params;
    const doctorId = parseInt(resolvedParams.id);
    
    const { searchParams } = new URL(req.url);
    const insurancePlanId = searchParams.get('insurancePlanId');
    
    if (!insurancePlanId || isNaN(Number(insurancePlanId))) {
      return NextResponse.json(
        { error: 'Valid insurance plan ID is required' },
        { status: 400 }
      );
    }

    // Verify doctor belongs to team
    const [doctor] = await db
      .select()
      .from(doctors)
      .where(and(eq(doctors.id, doctorId), eq(doctors.teamId, team.id)))
      .limit(1);

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Verify the insurance plan is custom and belongs to this team
    const [insurancePlan] = await db
      .select()
      .from(insurancePlans)
      .where(and(
        eq(insurancePlans.id, Number(insurancePlanId)),
        eq(insurancePlans.teamId, team.id),
        eq(insurancePlans.isCustom, true)
      ))
      .limit(1);

    if (!insurancePlan) {
      return NextResponse.json({ error: 'Custom insurance not found or does not belong to your team' }, { status: 404 });
    }

    // Delete in the correct order to avoid foreign key constraints:
    
    // 1. First delete from doctor_insurances (this will cascade delete custom_fee_schedules)
    await db
      .delete(doctorInsurances)
      .where(and(
        eq(doctorInsurances.doctorId, doctorId),
        eq(doctorInsurances.insurancePlanId, Number(insurancePlanId))
      ));

    // 2. Delete from default_fee_schedules
    await db
      .delete(defaultFeeSchedules)
      .where(eq(defaultFeeSchedules.insurancePlanId, Number(insurancePlanId)));

    // 3. Finally delete the custom insurance plan from insurance_plans table
    await db
      .delete(insurancePlans)
      .where(eq(insurancePlans.id, Number(insurancePlanId)));

    return NextResponse.json({ 
      message: 'Custom insurance deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting custom insurance:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom insurance' },
      { status: 500 }
    );
  }
}