import { useEffect, useRef, useCallback, useState } from "react"
import { useNoteStore } from "@/store/noteStore"

type SaveData = { title: string; content: string; tagNames: string[]; folderId: string | null }
type Status = "saved" | "saving" | "error"

export function useAutoSave(noteId: string | null, data: SaveData) {
  const [status, setStatus] = useState<Status>("saved")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const token = useNoteStore((s) => s.token)
  const upsertNote = useNoteStore((s) => s.upsertNote)

  const save = useCallback(async () => {
    if (!noteId) return
    setStatus("saving")
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Save failed")
      upsertNote(await res.json())
      setStatus("saved")
    } catch {
      setStatus("error")
    }
  }, [noteId, token, data, upsertNote])

  useEffect(() => {
    if (!noteId) return
    setStatus("saving")
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(save, 800)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [data.title, data.content, data.tagNames.join(","), data.folderId])

  return status
}
