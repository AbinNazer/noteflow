import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authenticate } from "@/lib/auth"

const include = {
  folder: { select: { id: true, name: true, color: true } },
  tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
}

export async function GET(req: NextRequest) {
  const user = authenticate(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get("folderId")
  const tag = searchParams.get("tag")
  const notes = await prisma.note.findMany({
    where: {
      userId: user.userId,
      isDeleted: false,
      ...(folderId ? { folderId } : {}),
      ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
    },
    include,
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  })
  return NextResponse.json(notes)
}

export async function POST(req: NextRequest) {
  const user = authenticate(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { title, content, folderId, tagNames } = await req.json()
  const note = await prisma.note.create({
    data: {
      title: title ?? "Untitled",
      content: content ?? "",
      userId: user.userId,
      folderId: folderId ?? null,
    },
    include,
  })
  if (tagNames?.length) {
    for (const name of tagNames as string[]) {
      const tag = await prisma.tag.upsert({
        where: { userId_name: { userId: user.userId, name } },
        create: { name, userId: user.userId },
        update: {},
      })
      await prisma.noteTag.create({ data: { noteId: note.id, tagId: tag.id } })
    }
    const updated = await prisma.note.findUnique({ where: { id: note.id }, include })
    return NextResponse.json(updated, { status: 201 })
  }
  return NextResponse.json(note, { status: 201 })
}
