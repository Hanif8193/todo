import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  dueDate: z.string().optional().nullable(),
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
    const { title, dueDate } = updateSchema.parse(body);

    const task = await prisma.task.update({
      where: {
        id,
        userId: user.userId, // Isolation check
      },
      data: { 
        ...(title && { title }),
        dueDate: dueDate === null ? null : dueDate ? new Date(dueDate) : undefined,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    // Prisma error if task doesn't exist for user
    return NextResponse.json(
      { error: 'Task not found or unauthorized' },
      { status: 404 }
    );
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
      where: {
        id,
        userId: user.userId, // Isolation check
      },
    });

    return NextResponse.json({ message: 'Task deleted' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Task not found or unauthorized' },
      { status: 404 }
    );
  }
}
