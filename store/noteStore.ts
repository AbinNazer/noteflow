import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface NoteTag {
  tag: { id: string; name: string; color: string }
}
export interface NoteFolder {
  id: string; name: string; color: string
}
export interface Note {
  id: string
  title: string
  content: string
  folderId: string | null
  isPinned: boolean
  isDeleted: boolean
  tags: NoteTag[]
  folder: NoteFolder | null
  updatedAt: string
  createdAt: string
}

interface NoteStore {
  notes: Note[]
  activeNoteId: string | null
  searchQuery: string
  activeFolderId: string | null
  activeTagName: string | null
  token: string | null
  sidebarOpen: boolean
  setNotes: (notes: Note[]) => void
  upsertNote: (note: Note) => void
  removeNote: (id: string) => void
  setActiveNote: (id: string | null) => void
  setSearch: (q: string) => void
  setActiveFolder: (id: string | null) => void
  setActiveTag: (name: string | null) => void
  setToken: (token: string | null) => void
  setSidebarOpen: (v: boolean) => void
}

export const useNoteStore = create<NoteStore>()(
  persist(
    (set) => ({
      notes: [],
      activeNoteId: null,
      searchQuery: "",
      activeFolderId: null,
      activeTagName: null,
      token: null,
      sidebarOpen: true,
      setNotes: (notes) => set({ notes }),
      upsertNote: (note) =>
        set((s) => ({
          notes: s.notes.find((n) => n.id === note.id)
            ? s.notes.map((n) => (n.id === note.id ? note : n))
            : [note, ...s.notes],
        })),
      removeNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
      setActiveNote: (id) => set({ activeNoteId: id }),
      setSearch: (q) => set({ searchQuery: q }),
      setActiveFolder: (id) => set({ activeFolderId: id, activeTagName: null }),
      setActiveTag: (name) => set({ activeTagName: name, activeFolderId: null }),
      setToken: (t) => set({ token: t }),
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
    }),
    { name: "noteflow", partialize: (s) => ({ token: s.token, sidebarOpen: s.sidebarOpen }) }
  )
)
