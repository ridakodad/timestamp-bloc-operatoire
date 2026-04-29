import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await sql`SELECT * FROM interventions ORDER BY "createdAt" DESC`;
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDb(); // Ensure table exists
    const { title, patient, room } = await req.json();
    
    const { rows } = await sql`
      INSERT INTO interventions (title, patient, room)
      VALUES (${title}, ${patient}, ${room})
      RETURNING *
    `;
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
