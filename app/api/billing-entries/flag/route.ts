import { NextRequest, NextResponse } from 'next/server';
import { flagBillingEntry } from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  try {
    const { entryId } = await req.json();

    if (typeof entryId !== 'number') {
      return NextResponse.json({ error: 'Invalid entryId' }, { status: 400 });
    }

    await flagBillingEntry(entryId, true);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 