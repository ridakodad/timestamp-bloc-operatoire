import { sql } from '@vercel/postgres';
import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // On attend les params ici
    const body = await req.json();
    const { time_entry, time_induction, time_closure, time_sspi_exit, status } = body;

    const { rows } = await sql`
      UPDATE interventions
      SET 
        time_entry = ${time_entry},
        time_induction = ${time_induction},
        time_closure = ${time_closure},
        time_sspi_exit = ${time_sspi_exit},
        status = ${status}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // On attend les params ici
    await sql`DELETE FROM interventions WHERE id = ${id}`;
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
