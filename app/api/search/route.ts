import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authenticate } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const user = authenticate(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const q = new URL(req.url).searchParams.get("q") ?? ""
  if (!q.trim()) return NextResponse.json([])
  const notes = await prisma.note.findMany({
    where: {
      userId: user.userId,
      isDeleted: false,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
        { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
      ],
    },
    include: {
      folder: { select: { id: true, name: true } },
      tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  })
  return NextResponse.json(notes)
}
