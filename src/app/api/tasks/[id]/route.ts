import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, dueDate, priority } = updateSchema.parse(body);

    const task = await prisma.task.update({
      where: { id, userId: user.userId },
      data: {
        ...(title !== undefined && { title }),
        ...(priority !== undefined && { priority }),
        dueDate: dueDate === null ? null : dueDate ? new Date(dueDate) : undefined,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    console.error('[TASK PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.task.delete({
      where: { id, userId: user.userId },
    });

    return NextResponse.json({ message: 'Task deleted' });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    console.error('[TASK DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
