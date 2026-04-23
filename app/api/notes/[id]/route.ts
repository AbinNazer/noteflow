import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authenticate } from "@/lib/auth"

const include = {
  folder: { select: { id: true, name: true, color: true } },
  tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
}

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  const user = authenticate(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const note = await prisma.note.findFirst({ where: { id, userId: user.userId, isDeleted: false }, include })
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(note)
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = authenticate(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const existing = await prisma.note.findFirst({ where: { id, userId: user.userId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const { title, content, folderId, isPinned, tagNames } = await req.json()
  if (tagNames !== undefined) {
    await prisma.noteTag.deleteMany({ where: { noteId: id } })
    for (const name of tagNames as string[]) {
      const tag = await prisma.tag.upsert({
        where: { userId_name: { userId: user.userId, name } },
        create: { name, userId: user.userId },
        update: {},
      })
      await prisma.noteTag.upsert({
        where: { noteId_tagId: { noteId: id, tagId: tag.id } },
        create: { noteId: id, tagId: tag.id },
        update: {},
      })
    }
  }
  const note = await prisma.note.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(folderId !== undefined && { folderId }),
      ...(isPinned !== undefined && { isPinned }),
    },
    include,
  })
  return NextResponse.json(note)
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = authenticate(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const existing = await prisma.note.findFirst({ where: { id, userId: user.userId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.note.update({ where: { id }, data: { isDeleted: true } })
  return new NextResponse(null, { status: 204 })
}
