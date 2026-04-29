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
        "userId" UUID REFERENCES users(id),
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

    // Vérifier si la colonne userId existe (si la table existait déjà)
    try {
      await sql`ALTER TABLE interventions ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES users(id)`;
    } catch (e) {
      // Ignorer si la colonne existe déjà
    }

    return true;
  } catch (error: any) {
    console.error('DB INIT FATAL:', error.message);
    throw error;
  }
}
