import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { demoAnalytics } from '@/lib/db/schema';
import { z } from 'zod';

const demoAnalyticsSchema = z.object({
  doctorDegree: z.string(),
  insuranceName: z.string(),
  patientType: z.string(),
  level: z.number(),
  recommendedCode: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = demoAnalyticsSchema.parse(body);

    await db.insert(demoAnalytics).values({
      doctorDegree: validatedData.doctorDegree,
      insuranceName: validatedData.insuranceName,
      patientType: validatedData.patientType,
      level: validatedData.level,
      recommendedCode: validatedData.recommendedCode,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error tracking demo analytics:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics' },
      { status: 500 }
    );
  }
}
