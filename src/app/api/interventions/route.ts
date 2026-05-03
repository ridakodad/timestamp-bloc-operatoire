import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDb();
    const { rows } = await sql`
      SELECT * FROM interventions 
      WHERE "userId" = ${session.user.id} 
      ORDER BY "createdAt" DESC
    `;
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('API GET ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, patient, room, surgeon, anesthetist, time_service_arrival } = await req.json();
    
    const { rows } = await sql`
      INSERT INTO interventions (title, patient, room, surgeon, anesthetist, time_service_arrival, "userId")
      VALUES (${title}, ${patient}, ${room}, ${surgeon || null}, ${anesthetist || null}, ${time_service_arrival || null}, ${session.user.id})
      RETURNING *
    `;
    
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error('API POST ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
