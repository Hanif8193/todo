import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const currentTask = await prisma.task.findUnique({
      where: { id, userId: user.userId },
    });

    if (!currentTask) {
      return NextResponse.json(
        { error: 'Task not found or unauthorized' },
        { status: 404 }
      );
    }

    const task = await prisma.task.update({
      where: { id },
      data: { completed: !currentTask.completed },
    });

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
