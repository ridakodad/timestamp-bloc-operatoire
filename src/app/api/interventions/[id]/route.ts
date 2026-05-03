import { sql } from '@vercel/postgres';
import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { 
      time_service_arrival, time_reception, time_entry, time_induction, 
      time_closure, time_recovery, time_exit, 
      status 
    } = body;

    const { rows } = await sql`
      UPDATE interventions
      SET 
        time_service_arrival = ${time_service_arrival !== undefined ? time_service_arrival : sql`time_service_arrival`},
        time_reception = ${time_reception !== undefined ? time_reception : sql`time_reception`},
        time_entry = ${time_entry !== undefined ? time_entry : sql`time_entry`},
        time_induction = ${time_induction !== undefined ? time_induction : sql`time_induction`},
        time_closure = ${time_closure !== undefined ? time_closure : sql`time_closure`},
        time_recovery = ${time_recovery !== undefined ? time_recovery : sql`time_recovery`},
        time_exit = ${time_exit !== undefined ? time_exit : sql`time_exit`},
        status = ${status !== undefined ? status : sql`status`}
      WHERE id = ${id} AND "userId" = ${session.user.id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { rowCount } = await sql`
      DELETE FROM interventions 
      WHERE id = ${id} AND "userId" = ${session.user.id}
    `;

    if (rowCount === 0) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
