import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  insurancePlans,
  defaultFeeSchedules,
  teams,
  type NewInsurancePlan,
  type NewDefaultFeeSchedule
} from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { eq, and, isNull } from 'drizzle-orm';
import { CODE_REIMBURSEMENT } from '@/lib/insurance-data';

// GET - Fetch all custom insurances for the team
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const customInsurances = await db
      .select()
      .from(insurancePlans)
      .where(and(
        eq(insurancePlans.teamId, team.id),
        eq(insurancePlans.isCustom, true)
      ))
      .orderBy(insurancePlans.name);

    return NextResponse.json({ customInsurances });
  } catch (error) {
    console.error('Error fetching custom insurances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom insurances' },
      { status: 500 }
    );
  }
}

// POST - Create a new custom insurance
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, coversFreeExam } = body;
    
    console.log('Creating custom insurance:', { name, coversFreeExam, teamId: team.id });

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Insurance name is required' },
        { status: 400 }
      );
    }

    // Check if insurance with this name already exists for this team
    const existing = await db
      .select()
      .from(insurancePlans)
      .where(and(
        eq(insurancePlans.name, name.trim()),
        eq(insurancePlans.teamId, team.id)
      ))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Insurance with this name already exists' },
        { status: 400 }
      );
    }

    // Create the custom insurance
    const newInsurance: NewInsurancePlan = {
      name: name.trim(),
      coversFreeExam: coversFreeExam ?? false,
      teamId: team.id,
      isCustom: true,
    };

    const [createdInsurance] = await db
      .insert(insurancePlans)
      .values(newInsurance)
      .returning();

    // Get team state to determine which default rates to use
    const teamData = await db
      .select()
      .from(teams)
      .where(eq(teams.id, team.id))
      .limit(1);

    const teamState = teamData[0]?.state;

    // Check if there are state-specific default_private_insurance rates
    let defaultRates: any[] = [];
    if (teamState) {
      // First try to get state-specific rates
      const defaultInsurance = await db
        .select()
        .from(insurancePlans)
        .where(and(
          eq(insurancePlans.name, 'default_private_insurance'),
          isNull(insurancePlans.teamId)
        ))
        .limit(1);

      if (defaultInsurance.length > 0) {
        defaultRates = await db
          .select()
          .from(defaultFeeSchedules)
          .where(and(
            eq(defaultFeeSchedules.insurancePlanId, defaultInsurance[0].id),
            eq(defaultFeeSchedules.state, teamState)
          ));
      }
    }

    // If no state-specific rates, get global defaults
    if (defaultRates.length === 0) {
      const defaultInsurance = await db
        .select()
        .from(insurancePlans)
        .where(and(
          eq(insurancePlans.name, 'default_private_insurance'),
          isNull(insurancePlans.teamId)
        ))
        .limit(1);

      if (defaultInsurance.length > 0) {
        defaultRates = await db
          .select()
          .from(defaultFeeSchedules)
          .where(and(
            eq(defaultFeeSchedules.insurancePlanId, defaultInsurance[0].id),
            isNull(defaultFeeSchedules.state)
          ));
      }
    }

    // If we have default rates from the database, use them
    if (defaultRates.length > 0) {
      const newFeeSchedules: NewDefaultFeeSchedule[] = defaultRates.map(rate => ({
        insurancePlanId: createdInsurance.id,
        state: teamState,
        code: rate.code,
        amount: rate.amount,
      }));

      await db.insert(defaultFeeSchedules).values(newFeeSchedules);
    } else {
      // Fallback to hardcoded rates if database doesn't have them
      const rates = CODE_REIMBURSEMENT['default_private_insurance'];
      if (rates) {
        const newFeeSchedules: NewDefaultFeeSchedule[] = Object.entries(rates).map(([code, amount]) => ({
          insurancePlanId: createdInsurance.id,
          state: teamState,
          code,
          amount: Math.round(amount * 100), // Convert to cents
        }));

        await db.insert(defaultFeeSchedules).values(newFeeSchedules);
      }
    }

    return NextResponse.json({ 
      message: 'Custom insurance created successfully',
      insurance: createdInsurance 
    });
  } catch (error) {
    console.error('Error creating custom insurance:', error);
    
    // Check for specific database errors
    if (error instanceof Error) {
      // Check for unique constraint violation
      if (error.message.includes('duplicate key value') || error.message.includes('unique constraint')) {
        return NextResponse.json(
          { error: 'An insurance plan with this name already exists for your organization' },
          { status: 400 }
        );
      }
      
      // Log the full error for debugging
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to create custom insurance. Please try again.' },
      { status: 500 }
    );
  }
}

// PUT - Update a custom insurance
export async function PUT(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const body = await req.json();
    const { id, name, coversFreeExam } = body;

    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        { error: 'Insurance ID is required' },
        { status: 400 }
      );
    }

    // Verify the insurance belongs to this team and is custom
    const [insurance] = await db
      .select()
      .from(insurancePlans)
      .where(and(
        eq(insurancePlans.id, id),
        eq(insurancePlans.teamId, team.id),
        eq(insurancePlans.isCustom, true)
      ))
      .limit(1);

    if (!insurance) {
      return NextResponse.json(
        { error: 'Custom insurance not found' },
        { status: 404 }
      );
    }

    // Update the insurance
    const updateData: Partial<typeof insurancePlans.$inferInsert> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (coversFreeExam !== undefined) updateData.coversFreeExam = coversFreeExam;

    const [updatedInsurance] = await db
      .update(insurancePlans)
      .set(updateData)
      .where(eq(insurancePlans.id, id))
      .returning();

    return NextResponse.json({ 
      message: 'Custom insurance updated successfully',
      insurance: updatedInsurance 
    });
  } catch (error) {
    console.error('Error updating custom insurance:', error);
    return NextResponse.json(
      { error: 'Failed to update custom insurance' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a custom insurance
export async function DELETE(req: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Valid insurance ID is required' },
        { status: 400 }
      );
    }

    // Verify the insurance belongs to this team and is custom
    const [insurance] = await db
      .select()
      .from(insurancePlans)
      .where(and(
        eq(insurancePlans.id, Number(id)),
        eq(insurancePlans.teamId, team.id),
        eq(insurancePlans.isCustom, true)
      ))
      .limit(1);

    if (!insurance) {
      return NextResponse.json(
        { error: 'Custom insurance not found' },
        { status: 404 }
      );
    }

    // Delete the insurance (cascade will handle related records)
    await db
      .delete(insurancePlans)
      .where(eq(insurancePlans.id, Number(id)));

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