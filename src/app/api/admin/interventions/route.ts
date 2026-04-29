import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.email !== 'admin@huim6.ma') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rows } = await sql`
      SELECT i.*, u.name as "userName" 
      FROM interventions i
      LEFT JOIN users u ON i."userId" = u.id
      ORDER BY i."createdAt" DESC
    `;
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.email !== 'admin@huim6.ma') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const interventions = await req.json(); // Array of interventions
    
    for (const item of interventions) {
      await sql`
        INSERT INTO interventions (title, patient, room, status, time_entry, time_induction, time_closure, time_sspi_exit, "createdAt", "userId")
        VALUES (${item.title}, ${item.patient}, ${item.room}, ${item.status}, ${item.time_entry}, ${item.time_induction}, ${item.time_closure}, ${item.time_sspi_exit}, ${item.createdAt}, ${session.user.id})
      `;
    }

    return NextResponse.json({ message: 'Import successful' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
