import { sql } from '@vercel/postgres';

export async function initDb() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS interventions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        patient TEXT NOT NULL,
        room TEXT,
        status TEXT DEFAULT 'EN_COURS',
        time_entry TIMESTAMP WITH TIME ZONE,
        time_induction TIMESTAMP WITH TIME ZONE,
        time_closure TIMESTAMP WITH TIME ZONE,
        time_sspi_exit TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Database initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}
