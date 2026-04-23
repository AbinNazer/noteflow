import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding...")

  const hash = await bcrypt.hash("demo1234", 12)
  
  const user = await prisma.user.upsert({
    where: { email: "demo@noteflow.app" },
    update: {},
    create: { email: "demo@noteflow.app", passwordHash: hash, name: "Demo User" },
  })

  const work = await prisma.folder.upsert({
    where: { userId_name: { userId: user.id, name: "Work" } },
    update: {},
    create: { name: "Work", color: "#c9a96e", userId: user.id },
  })

  const techTag = await prisma.tag.upsert({
    where: { userId_name: { userId: user.id, name: "tech" } },
    update: {},
    create: { name: "tech", color: "#5b8fa8", userId: user.id },
  })

  await prisma.note.create({
    data: {
      title: "Getting Started",
      content: "# Welcome to NoteFlow\n\nStart writing your notes here.\n\n- **Create** with + New Note\n- **Search** with Ctrl+K\n- **Auto-saves** as you type",
      userId: user.id,
      isPinned: true,
    },
  })

  const n2 = await prisma.note.create({
    data: {
      title: "Project Architecture",
      content: "# Architecture\n\n## Stack\n- Next.js 16\n- PostgreSQL + Prisma\n- JWT Auth\n- Zustand",
      userId: user.id,
      folderId: work.id,
    },
  })

  await prisma.noteTag.create({ data: { noteId: n2.id, tagId: techTag.id } })

  console.log("✅ Done! Login: demo@noteflow.app / demo1234")
}

main().catch(console.error).finally(() => prisma.$disconnect())
