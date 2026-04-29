import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    
    const users = [
      { email: 'urologie@huim6.ma', pass: 'urologie123', name: 'Département Urologie' },
      { email: 'chirgenerale@huim6.ma', pass: 'chirgeneral123', name: 'Département Chirurgie Générale' },
      { email: 'neurochirurgie@huim6.ma', pass: 'neurochirurgie123', name: 'Département Neurochirurgie' },
      { email: 'admin@huim6.ma', pass: 'admin123', name: 'Direction Médicale' },
    ];
    
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.pass, 10);
      await sql`
        INSERT INTO users (email, password, name)
        VALUES (${user.email}, ${hashedPassword}, ${user.name})
        ON CONFLICT (email) DO UPDATE SET password = ${hashedPassword}, name = ${user.name}
      `;
    }
    
    return NextResponse.json({ 
      message: 'Les 3 comptes (Urologie, Chir Générale, Neurochir) ont été créés avec succès.',
      details: users.map(u => u.email)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
