import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authenticate } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const user = authenticate(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const folders = await prisma.folder.findMany({
    where: { userId: user.userId },
    include: { _count: { select: { notes: { where: { isDeleted: false } } } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(folders)
}

export async function POST(req: NextRequest) {
  const user = authenticate(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, color } = await req.json()
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })
  const folder = await prisma.folder.create({
    data: { name, color: color ?? "#888888", userId: user.userId },
  })
  return NextResponse.json(folder, { status: 201 })
}
