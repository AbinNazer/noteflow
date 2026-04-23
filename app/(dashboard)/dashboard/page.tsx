"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useNoteStore } from "@/store/noteStore"
import NoteApp from "@/components/NoteApp"

export default function DashboardPage() {
  const token = useNoteStore((s) => s.token)
  const router = useRouter()
  useEffect(() => { if (!token) router.push("/login") }, [token])
  if (!token) return null
  return <NoteApp />
}
