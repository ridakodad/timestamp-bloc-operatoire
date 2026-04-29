import { sql } from '@vercel/postgres';

export async function initDb() {
  try {
    // On utilise un try/catch silencieux pour la création
    // car gen_random_uuid() nécessite parfois pgcrypto sur certaines versions
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
    return true;
  } catch (error: any) {
    console.error('DB INIT WARNING:', error.message);
    // Si gen_random_uuid échoue, on tente une version plus simple sans UUID auto pour débloquer
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS interventions (
          id SERIAL PRIMARY KEY,
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
      return true;
    } catch (innerError: any) {
      console.error('DB INIT FATAL:', innerError.message);
      throw innerError;
    }
  }
}
