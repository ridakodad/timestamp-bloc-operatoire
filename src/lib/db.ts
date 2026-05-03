import { sql } from '@vercel/postgres';

export async function initDb() {
  try {
    // Table Utilisateurs
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Table Interventions (mise à jour pour inclure userId)
    await sql`
      CREATE TABLE IF NOT EXISTS interventions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        patient TEXT NOT NULL,
        room TEXT,
        surgeon TEXT,
        anesthetist TEXT,
        status TEXT DEFAULT 'EN_COURS',
        time_service_arrival TIMESTAMP WITH TIME ZONE,
        time_reception TIMESTAMP WITH TIME ZONE,
        time_entry TIMESTAMP WITH TIME ZONE,
        time_induction TIMESTAMP WITH TIME ZONE,
        time_closure TIMESTAMP WITH TIME ZONE,
        time_recovery TIMESTAMP WITH TIME ZONE,
        time_exit TIMESTAMP WITH TIME ZONE,
        "userId" UUID REFERENCES users(id),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Vérifier si la colonne userId existe (si la table existait déjà)
    try {
      await sql`ALTER TABLE interventions ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES users(id)`;
      await sql`ALTER TABLE interventions ADD COLUMN IF NOT EXISTS time_reception TIMESTAMP WITH TIME ZONE`;
      await sql`ALTER TABLE interventions ADD COLUMN IF NOT EXISTS time_recovery TIMESTAMP WITH TIME ZONE`;
      await sql`ALTER TABLE interventions ADD COLUMN IF NOT EXISTS time_exit TIMESTAMP WITH TIME ZONE`;
      await sql`ALTER TABLE interventions ADD COLUMN IF NOT EXISTS surgeon TEXT`;
      await sql`ALTER TABLE interventions ADD COLUMN IF NOT EXISTS anesthetist TEXT`;
      await sql`ALTER TABLE interventions ADD COLUMN IF NOT EXISTS time_service_arrival TIMESTAMP WITH TIME ZONE`;
    } catch (e) {
      // Ignorer si les colonnes existent déjà
    }

    return true;
  } catch (error: any) {
    console.error('DB INIT FATAL:', error.message);
    throw error;
  }
}
