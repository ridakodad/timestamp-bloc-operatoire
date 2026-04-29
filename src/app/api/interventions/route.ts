import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // On essaie d'initialiser à chaque GET au cas où
    await initDb();
    const { rows } = await sql`SELECT * FROM interventions ORDER BY "createdAt" DESC`;
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('API GET ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, patient, room } = await req.json();
    
    const { rows } = await sql`
      INSERT INTO interventions (title, patient, room)
      VALUES (${title}, ${patient}, ${room})
      RETURNING *
    `;
    
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error('API POST ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
