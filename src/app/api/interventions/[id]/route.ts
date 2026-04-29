import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await sql`DELETE FROM interventions WHERE id = ${id}`;
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
