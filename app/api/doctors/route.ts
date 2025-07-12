import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { doctors, type NewDoctor } from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

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

    const doctorsList = await db
      .select()
      .from(doctors)
      .where(eq(doctors.teamId, team.id))
      .orderBy(doctors.name);

    return NextResponse.json({ 
      doctors: doctorsList,
      usage: {
        current: doctorsList.length,
        limit: team.doctorLimit
      }
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}

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

    // Check doctor limit
    const currentDoctorCount = await db
      .select()
      .from(doctors)
      .where(eq(doctors.teamId, team.id));
    
    if (currentDoctorCount.length >= team.doctorLimit) {
      return NextResponse.json(
        { 
          error: 'Doctor limit reached',
          message: `You have reached your limit of ${team.doctorLimit} doctors. Please upgrade your plan to add more doctors.`,
          currentCount: currentDoctorCount.length,
          limit: team.doctorLimit
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, degree } = body;

    if (!name || !degree) {
      return NextResponse.json(
        { error: 'Name and degree are required' },
        { status: 400 }
      );
    }

    const newDoctor: NewDoctor = {
      teamId: team.id,
      name: name.trim(),
      degree: degree.trim().toUpperCase(),
    };

    const [insertedDoctor] = await db
      .insert(doctors)
      .values(newDoctor)
      .returning();

    return NextResponse.json({ doctor: insertedDoctor }, { status: 201 });
  } catch (error) {
    console.error('Error creating doctor:', error);
    return NextResponse.json(
      { error: 'Failed to create doctor' },
      { status: 500 }
    );
  }
}

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
    const { id, name, degree } = body;

    if (!id || !name || !degree) {
      return NextResponse.json(
        { error: 'ID, name, and degree are required' },
        { status: 400 }
      );
    }

    const [updatedDoctor] = await db
      .update(doctors)
      .set({
        name: name.trim(),
        degree: degree.trim().toUpperCase(),
        updatedAt: new Date(),
      })
      .where(and(eq(doctors.id, id), eq(doctors.teamId, team.id)))
      .returning();

    if (!updatedDoctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({ doctor: updatedDoctor });
  } catch (error) {
    console.error('Error updating doctor:', error);
    return NextResponse.json(
      { error: 'Failed to update doctor' },
      { status: 500 }
    );
  }
}

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

    if (!id) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    const [deletedDoctor] = await db
      .delete(doctors)
      .where(and(eq(doctors.id, parseInt(id)), eq(doctors.teamId, team.id)))
      .returning();

    if (!deletedDoctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return NextResponse.json(
      { error: 'Failed to delete doctor' },
      { status: 500 }
    );
  }
}