import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1),
  dueDate: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, dueDate } = taskSchema.parse(body);

    const task = await prisma.task.create({
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: user.userId,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
