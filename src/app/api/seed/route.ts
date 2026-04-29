import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await sql`
      INSERT INTO users (email, password, name)
      VALUES ('admin@huim6.ma', ${hashedPassword}, 'Dr. Admin')
      ON CONFLICT (email) DO NOTHING
    `;
    
    return NextResponse.json({ message: 'User seeded successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
