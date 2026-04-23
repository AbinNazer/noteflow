import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authenticate } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const user = authenticate(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tags = await prisma.tag.findMany({
    where: { userId: user.userId },
    include: { _count: { select: { notes: true } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(tags)
}
