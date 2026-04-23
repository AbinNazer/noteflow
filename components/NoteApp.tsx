"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useNoteStore, type Note } from "@/store/noteStore"
import { useAutoSave } from "@/hooks/useAutoSave"
import { useRouter } from "next/navigation"

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime()
  if (d < 60000) return "just now"
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`
  return `${Math.floor(d / 86400000)}d ago`
}

const TC: Record<string, string> = { tech:"#5b8fa8",books:"#8fa87a",work:"#c9a96e",personal:"#a87a8f",idea:"#8a7ac9",todo:"#c97a7a",research:"#7ac9b8" }
const tc = (tag: string) => TC[tag] ?? "#7a7a7a"

function renderMd(text: string) {
  return text
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1.6rem;font-weight:700;color:#f0ede8;font-family:Georgia,serif;margin:0 0 0.75rem;line-height:1.2">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.15rem;font-weight:600;color:#e8e4de;margin:1.25rem 0 0.5rem">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1rem;font-weight:600;color:#d4cfc8;margin:1rem 0 0.4rem">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e8e4de;font-weight:600">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:#b8b3aa">$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#2a2520;color:#c9a96e;padding:1px 6px;border-radius:4px;font-size:0.85em;font-family:monospace">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #c9a96e;margin:1rem 0;padding:0.5rem 1rem;color:#9c9990;font-style:italic">$1</blockquote>')
    .replace(/^[-*] (.+)$/gm, '<li style="margin:0.2rem 0 0.2rem 1.25rem;list-style:disc;color:#c4bfb8;line-height:1.7">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:0.2rem 0 0.2rem 1.25rem;list-style:decimal;color:#c4bfb8;line-height:1.7">$1</li>')
    .replace(/\n\n/g, '</p><p style="margin:0.6rem 0;color:#9c9990;line-height:1.8">')
    .replace(/\n/g, "<br/>")
}

export default function NoteApp() {
  const { notes, activeNoteId, searchQuery, activeFolderId, activeTagName,
    token, sidebarOpen, setNotes, upsertNote, removeNote,
    setActiveNote, setSearch, setActiveFolder, setActiveTag,
    setToken, setSidebarOpen } = useNoteStore()
  const router = useRouter()

  const [folders, setFolders] = useState<{id:string;name:string;color:string;_count:{notes:number}}[]>([])
  const [allTags, setAllTags] = useState<{id:string;name:string;color:string;_count:{notes:number}}[]>([])
  const [editMode, setEditMode] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editTags, setEditTags] = useState<string[]>([])
  const [editFolderId, setEditFolderId] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState("")
  const [view, setView] = useState<"list"|"grid">("list")
  const [cmdOpen, setCmdOpen] = useState(false)
  const [cmdQ, setCmdQ] = useState("")

  const saveStatus = useAutoSave(editMode ? activeNoteId : null, {
    title: editTitle, content: editContent, tagNames: editTags, folderId: editFolderId,
  })

  const headers = useMemo(() => ({
    "Content-Type": "application/json", Authorization: `Bearer ${token}`,
  }), [token])

  useEffect(() => {
    if (!token) return
    Promise.all([
      fetch("/api/notes", { headers }).then(r => r.json()),
      fetch("/api/folders", { headers }).then(r => r.json()),
      fetch("/api/tags", { headers }).then(r => r.json()),
    ]).then(([n, f, t]) => {
      if (Array.isArray(n)) setNotes(n)
      if (Array.isArray(f)) setFolders(f)
      if (Array.isArray(t)) setAllTags(t)
    })
  }, [token])

  const activeNote = notes.find(n => n.id === activeNoteId) ?? null

  const openNote = useCallback((note: Note) => {
    setActiveNote(note.id)
    setEditMode(false)
    setEditTitle(note.title)
    setEditContent(note.content)
    setEditTags(note.tags.map(nt => nt.tag.name))
    setEditFolderId(note.folderId)
  }, [setActiveNote])

  const createNote = async () => {
    const res = await fetch("/api/notes", { method: "POST", headers, body: JSON.stringify({ title: "Untitled Note", folderId: activeFolderId }) })
    const note = await res.json()
    upsertNote(note); openNote(note); setEditMode(true)
  }

  const deleteNote = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: "DELETE", headers })
    removeNote(id)
    const rem = notes.filter(n => n.id !== id)
    if (rem.length) openNote(rem[0]); else setActiveNote(null)
  }

  const pinNote = async (id: string) => {
    const note = notes.find(n => n.id === id); if (!note) return
    const res = await fetch(`/api/notes/${id}`, { method: "PATCH", headers, body: JSON.stringify({ isPinned: !note.isPinned }) })
    upsertNote(await res.json())
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-")
    if (t && !editTags.includes(t)) { setEditTags(p => [...p, t]); setTagInput("") }
  }

  const filteredNotes = useMemo(() => notes.filter(n => {
    if (n.isDeleted) return false
    const q = searchQuery.toLowerCase()
    const mQ = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(nt => nt.tag.name.includes(q))
    const mF = !activeFolderId || n.folderId === activeFolderId
    const mT = !activeTagName || n.tags.some(nt => nt.tag.name === activeTagName)
    return mQ && mF && mT
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  }), [notes, searchQuery, activeFolderId, activeTagName])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") { e.preventDefault(); createNote() }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setCmdOpen(true) }
      if (e.key === "Escape") { setCmdOpen(false); setEditMode(false) }
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [])

  const wc = editContent.trim() ? editContent.trim().split(/\s+/).length : 0
  const activeLabel = activeTagName ? `#${activeTagName}` : activeFolderId ? (folders.find(f => f.id === activeFolderId)?.name ?? "Notes") : "All Notes"
  const cmdNotes = cmdQ ? filteredNotes.filter(n => n.title.toLowerCase().includes(cmdQ.toLowerCase())).slice(0,8) : filteredNotes.slice(0,8)

  const B = { background:"none", border:"none", cursor:"pointer" }
  const card = (active: boolean) => ({ padding:"0.75rem 0.875rem", cursor:"pointer", borderBottom:"1px solid #161310", background: active ? "#1a1814" : "transparent", position:"relative" as const, transition:"background 0.12s" })

  return (
    <div style={{ display:"flex", height:"100vh", background:"#0f0d0b", color:"#c4bfb8", fontFamily:"system-ui,sans-serif", overflow:"hidden" }}>

      {/* Sidebar */}
      <div style={{ width: sidebarOpen?"220px":"0", minWidth: sidebarOpen?"220px":"0", background:"#111009", borderRight:"1px solid #1e1c18", display:"flex", flexDirection:"column", transition:"all 0.22s", overflow:"hidden", flexShrink:0 }}>
        <div style={{ width:"220px", display:"flex", flexDirection:"column", height:"100%", opacity: sidebarOpen?1:0, transition:"opacity 0.18s" }}>
          <div style={{ padding:"1.1rem 0.875rem 0.75rem", borderBottom:"1px solid #1e1c18" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"0.875rem" }}>
              <div style={{ width:"26px", height:"26px", background:"linear-gradient(135deg,#c9a96e,#a07840)", borderRadius:"7px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px" }}>✦</div>
              <span style={{ fontSize:"0.9rem", fontWeight:"600", color:"#f0ede8", fontFamily:"Georgia,serif" }}>NoteFlow</span>
            </div>
            <button onClick={createNote} style={{ width:"100%", background:"#c9a96e", color:"#1a1510", border:"none", borderRadius:"7px", padding:"7px 10px", fontSize:"12px", fontWeight:"600", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"5px" }}>
              <span style={{ fontSize:"15px", lineHeight:1 }}>+</span> New Note
            </button>
          </div>
          <div style={{ flex:1, overflow:"auto", padding:"0.5rem 0.5rem 0" }}>
            <div onClick={() => { setActiveFolder(null); setActiveTag(null) }}
              style={{ display:"flex", alignItems:"center", gap:"7px", padding:"5px 8px", borderRadius:"6px", cursor:"pointer", fontSize:"12px", color:(!activeFolderId&&!activeTagName)?"#f0ede8":"#7a7570", background:(!activeFolderId&&!activeTagName)?"#252018":"transparent", marginBottom:"1px" }}>
              <span>◈</span><span>All Notes</span>
              <span style={{ marginLeft:"auto", fontSize:"10px", color:"#4a4540" }}>{notes.filter(n=>!n.isDeleted).length}</span>
            </div>
            {folders.length > 0 && <>
              <div style={{ padding:"0.6rem 0.5rem 0.2rem", fontSize:"9px", fontWeight:"600", letterSpacing:"0.1em", color:"#4a4540", textTransform:"uppercase" }}>Folders</div>
              {folders.map(f => (
                <div key={f.id} onClick={() => { setActiveFolder(f.id); setActiveTag(null) }}
                  style={{ display:"flex", alignItems:"center", gap:"7px", padding:"5px 8px", borderRadius:"6px", cursor:"pointer", fontSize:"12px", color: activeFolderId===f.id?"#f0ede8":"#7a7570", background: activeFolderId===f.id?"#252018":"transparent", marginBottom:"1px" }}>
                  <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:f.color, flexShrink:0 }}/>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</span>
                  <span style={{ marginLeft:"auto", fontSize:"10px", color:"#4a4540" }}>{f._count.notes}</span>
                </div>
              ))}
            </>}
            {allTags.length > 0 && <>
              <div style={{ padding:"0.6rem 0.5rem 0.2rem", fontSize:"9px", fontWeight:"600", letterSpacing:"0.1em", color:"#4a4540", textTransform:"uppercase" }}>Tags</div>
              {allTags.map(t => (
                <div key={t.id} onClick={() => { setActiveTag(activeTagName===t.name?null:t.name); setActiveFolder(null) }}
                  style={{ display:"flex", alignItems:"center", gap:"7px", padding:"4px 8px", borderRadius:"6px", cursor:"pointer", fontSize:"12px", color: activeTagName===t.name?"#c9a96e":"#6a6560", background: activeTagName===t.name?"#1e1c17":"transparent", marginBottom:"1px" }}>
                  <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:tc(t.name), flexShrink:0 }}/>
                  <span>{t.name}</span>
                  <span style={{ marginLeft:"auto", fontSize:"10px", color:"#3a3530" }}>{t._count.notes}</span>
                </div>
              ))}
            </>}
          </div>
          <div style={{ padding:"0.75rem 0.875rem", borderTop:"1px solid #1a1814", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:"11px", color:"#4a4540", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>demo@noteflow.app</span>
            <button onClick={() => { setToken(null); router.push("/login") }} style={{ ...B, color:"#4a4540", fontSize:"11px" }}>↩</button>
          </div>
        </div>
      </div>

      {/* Note List */}
      <div style={{ width:"268px", minWidth:"268px", borderRight:"1px solid #1a1814", display:"flex", flexDirection:"column", background:"#0e0c0a", flexShrink:0 }}>
        <div style={{ padding:"0.875rem 0.875rem 0.75rem", borderBottom:"1px solid #1a1814" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.625rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ ...B, color:"#5a5550", fontSize:"16px", lineHeight:1, padding:"2px" }}>☰</button>
              <span style={{ fontSize:"12px", fontWeight:"600", color:"#7a7570" }}>{activeLabel}</span>
            </div>
            <div style={{ display:"flex", gap:"3px" }}>
              <button onClick={() => setView("list")} style={{ ...B, background: view==="list"?"#252018":"none", color: view==="list"?"#c9a96e":"#5a5550", borderRadius:"5px", padding:"3px 7px", fontSize:"11px" }}>≡</button>
              <button onClick={() => setView("grid")} style={{ ...B, background: view==="grid"?"#252018":"none", color: view==="grid"?"#c9a96e":"#5a5550", borderRadius:"5px", padding:"3px 7px", fontSize:"11px" }}>⊞</button>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"7px", background:"#161310", border:"1px solid #1e1c18", borderRadius:"7px", padding:"6px 9px" }}>
            <span style={{ color:"#3a3530", fontSize:"12px" }}>⌕</span>
            <input style={{ flex:1, background:"none", border:"none", outline:"none", color:"#c4bfb8", fontSize:"12px", fontFamily:"inherit" }}
              placeholder="Search…" value={searchQuery} onChange={e => setSearch(e.target.value)} />
            {searchQuery && <button onClick={() => setSearch("")} style={{ ...B, color:"#4a4540", fontSize:"11px" }}>✕</button>}
          </div>
          {searchQuery && <div style={{ fontSize:"10px", color:"#4a4540", marginTop:"5px" }}>{filteredNotes.length} result{filteredNotes.length!==1?"s":""}</div>}
        </div>
        <div style={{ flex:1, overflow:"auto" }}>
          {filteredNotes.length === 0 ? (
            <div style={{ padding:"3rem 1rem", textAlign:"center", color:"#3a3530", fontSize:"12px" }}>
              <div style={{ fontSize:"1.5rem", marginBottom:"0.5rem" }}>◈</div>No notes found
            </div>
          ) : view === "list" ? filteredNotes.map(note => (
            <div key={note.id} style={card(note.id===activeNoteId)} onClick={() => openNote(note)}>
              {note.isPinned && <span style={{ position:"absolute", top:"9px", right:"9px", fontSize:"9px", color:"#c9a96e" }}>★</span>}
              <div style={{ fontSize:"12px", fontWeight:"600", color: note.id===activeNoteId?"#f0ede8":"#c4bfb8", marginBottom:"3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight: note.isPinned?"16px":"0" }}>{note.title}</div>
              <div style={{ fontSize:"10px", color:"#4a4540", marginBottom:"5px", display:"flex", gap:"5px" }}>
                <span>{timeAgo(note.updatedAt)}</span>
                {note.folder && <><span>·</span><span>{note.folder.name}</span></>}
              </div>
              <div style={{ fontSize:"11px", color:"#5a5550", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as const, lineHeight:"1.5" }}>
                {note.content.replace(/[#*`>]/g,"").trim()||"Empty note"}
              </div>
              {note.tags.length > 0 && (
                <div style={{ display:"flex", gap:"3px", marginTop:"6px", flexWrap:"wrap" as const }}>
                  {note.tags.slice(0,3).map(nt => (
                    <span key={nt.tag.id} style={{ fontSize:"9px", padding:"1px 5px", borderRadius:"3px", background:tc(nt.tag.name)+"22", color:tc(nt.tag.name), border:`1px solid ${tc(nt.tag.name)}44` }}>{nt.tag.name}</span>
                  ))}
                  {note.tags.length > 3 && <span style={{ fontSize:"9px", color:"#4a4540" }}>+{note.tags.length-3}</span>}
                </div>
              )}
            </div>
          )) : (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px", padding:"8px" }}>
              {filteredNotes.map(note => (
                <div key={note.id} onClick={() => openNote(note)}
                  style={{ padding:"0.7rem", cursor:"pointer", borderRadius:"7px", border:`1px solid ${note.id===activeNoteId?"#3a3020":"#1a1814"}`, background: note.id===activeNoteId?"#1a1814":"#0e0c0a" }}>
                  <div style={{ fontSize:"12px", fontWeight:"600", color:"#c4bfb8", marginBottom:"3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{note.title}</div>
                  <div style={{ fontSize:"10px", color:"#4a4540" }}>{timeAgo(note.updatedAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
        {activeNote ? (<>
          <div style={{ display:"flex", gap:"1.25rem", padding:"0.4rem 1.75rem", borderBottom:"1px solid #161310", background:"#0c0a08" }}>
            <span style={{ fontSize:"10px", color:"#4a4540" }}>✎ {wc} words</span>
            <span style={{ fontSize:"10px", color:"#4a4540" }}>🕐 {timeAgo(activeNote.updatedAt)}</span>
            <span style={{ marginLeft:"auto", fontSize:"10px", color: saveStatus==="saved"?"#5a8a5a":saveStatus==="saving"?"#9a8050":"#8a5050" }}>
              {saveStatus==="saved"?"✓ Saved":saveStatus==="saving"?"● Saving…":"⚠ Error"}
            </span>
          </div>
          <div style={{ padding:"0.875rem 1.75rem 0.75rem", borderBottom:"1px solid #161310", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", flexWrap:"wrap" as const, flex:1 }}>
              {editMode ? (<>
                {editTags.map(t => (
                  <span key={t} onClick={() => setEditTags(p => p.filter(x => x!==t))} style={{ fontSize:"10px", padding:"2px 6px", borderRadius:"4px", background:tc(t)+"22", color:tc(t), border:`1px solid ${tc(t)}44`, cursor:"pointer" }}>{t} ✕</span>
                ))}
                <div style={{ display:"flex", alignItems:"center", background:"#161310", border:"1px solid #1e1c18", borderRadius:"5px", padding:"2px 7px", gap:"4px" }}>
                  <input style={{ background:"none", border:"none", outline:"none", fontSize:"11px", color:"#c4bfb8", width:"70px" }}
                    placeholder="Add tag…" value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key==="Enter"||e.key===",") { e.preventDefault(); addTag() } }} />
                  <button onClick={addTag} style={{ ...B, color:"#c9a96e", fontSize:"12px" }}>+</button>
                </div>
                <select value={editFolderId??""} onChange={e => setEditFolderId(e.target.value||null)}
                  style={{ background:"#161310", border:"1px solid #1e1c18", borderRadius:"5px", color:"#7a7570", fontSize:"11px", padding:"3px 7px", outline:"none" }}>
                  <option value="">No folder</option>
                  {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </>) : (<>
                {activeNote.tags.map(nt => (
                  <span key={nt.tag.id} style={{ fontSize:"10px", padding:"2px 6px", borderRadius:"4px", background:tc(nt.tag.name)+"22", color:tc(nt.tag.name), border:`1px solid ${tc(nt.tag.name)}44` }}>{nt.tag.name}</span>
                ))}
                {activeNote.folder && <span style={{ fontSize:"11px", color:"#4a4540" }}>in {activeNote.folder.name}</span>}
              </>)}
            </div>
            <div style={{ display:"flex", gap:"4px", alignItems:"center", flexShrink:0 }}>
              <button onClick={() => pinNote(activeNote.id)} style={{ ...B, color: activeNote.isPinned?"#c9a96e":"#4a4540", fontSize:"14px", padding:"4px" }}>
                {activeNote.isPinned?"★":"☆"}
              </button>
              {!editMode
                ? <button onClick={() => setEditMode(true)} style={{ background:"#c9a96e22", border:"1px solid #c9a96e44", color:"#c9a96e", borderRadius:"6px", padding:"4px 10px", fontSize:"11px", cursor:"pointer" }}>Edit</button>
                : <button onClick={() => setEditMode(false)} style={{ background:"#1a3a1a", border:"1px solid #2a5a2a", color:"#6ab06a", borderRadius:"6px", padding:"4px 10px", fontSize:"11px", cursor:"pointer" }}>Done</button>
              }
              <button onClick={() => { if (window.confirm("Delete this note?")) deleteNote(activeNote.id) }} style={{ ...B, color:"#4a4540", fontSize:"13px", padding:"4px" }}>🗑</button>
            </div>
          </div>
          <div style={{ flex:1, overflow:"auto", padding:"1.75rem 1.75rem 4rem", maxWidth:"720px", width:"100%", margin:"0 auto" }}>
            {editMode ? (<>
              <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Untitled Note"
                style={{ fontSize:"1.875rem", fontWeight:"700", color:"#f0ede8", background:"none", border:"none", outline:"none", width:"100%", fontFamily:"Georgia,serif", letterSpacing:"-0.02em", lineHeight:1.2, marginBottom:"0.75rem" }} />
              <div style={{ height:"1px", background:"#1a1814", marginBottom:"1.25rem" }} />
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                placeholder={"Start writing… Markdown works:\n# Heading  **bold**  *italic*  `code`\n> quote   - list"}
                style={{ width:"100%", background:"none", border:"none", outline:"none", color:"#c4bfb8", fontSize:"14px", lineHeight:"1.85", fontFamily:"system-ui,sans-serif", resize:"none", minHeight:"62vh" }} />
            </>) : (<>
              <h1 style={{ fontFamily:"Georgia,serif", fontSize:"1.875rem", fontWeight:"700", color:"#f0ede8", letterSpacing:"-0.02em", lineHeight:1.2, marginBottom:"0.75rem" }}>{activeNote.title}</h1>
              <div style={{ height:"1px", background:"#1a1814", marginBottom:"1.25rem" }} />
              {activeNote.content
                ? <div style={{ fontSize:"14px", lineHeight:"1.85" }} dangerouslySetInnerHTML={{ __html: renderMd(activeNote.content) }} />
                : <p style={{ color:"#3a3530", fontStyle:"italic", fontSize:"14px" }}>Empty — click Edit to start writing.</p>}
            </>)}
          </div>
        </>) : (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"0.75rem", color:"#3a3530" }}>
            <div style={{ fontSize:"2.5rem", opacity:0.2 }}>✦</div>
            <div style={{ fontSize:"0.9rem", color:"#4a4540" }}>Select or create a note</div>
            <button onClick={createNote} style={{ background:"#c9a96e", color:"#1a1510", border:"none", borderRadius:"7px", padding:"9px 18px", fontSize:"12px", fontWeight:"600", cursor:"pointer" }}>+ New Note</button>
          </div>
        )}
      </div>

      {/* Command palette */}
      {cmdOpen && (
        <div onClick={e => { if (e.target===e.currentTarget) setCmdOpen(false) }}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"flex-start", justifyContent:"center", zIndex:100, paddingTop:"18vh" }}>
          <div style={{ background:"#161310", border:"1px solid #2a2520", borderRadius:"12px", width:"460px", overflow:"hidden" }}>
            <input autoFocus style={{ width:"100%", background:"none", border:"none", outline:"none", borderBottom:"1px solid #1e1c18", color:"#f0ede8", fontSize:"14px", padding:"0.875rem 1.125rem", fontFamily:"inherit" }}
              placeholder="Search notes…" value={cmdQ} onChange={e => setCmdQ(e.target.value)} />
            <div style={{ maxHeight:"320px", overflow:"auto" }}>
              {!cmdQ && <div onClick={() => { createNote(); setCmdOpen(false) }}
                style={{ padding:"0.575rem 1.125rem", cursor:"pointer", fontSize:"12px", color:"#c4bfb8", display:"flex", alignItems:"center", gap:"9px" }}
                onMouseEnter={e => (e.currentTarget.style.background="#1a1814")} onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
                <span style={{ color:"#5a5550" }}>+</span> New Note <span style={{ marginLeft:"auto", fontSize:"10px", color:"#3a3530" }}>⌘N</span>
              </div>}
              {cmdNotes.map(note => (
                <div key={note.id} onClick={() => { openNote(note); setCmdOpen(false); setCmdQ("") }}
                  style={{ padding:"0.575rem 1.125rem", cursor:"pointer", fontSize:"12px", color:"#c4bfb8", display:"flex", alignItems:"center", gap:"9px" }}
                  onMouseEnter={e => (e.currentTarget.style.background="#1a1814")} onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
                  <span style={{ fontSize:"11px", color:"#4a4540" }}>◈</span>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{note.title}</span>
                  {note.folder && <span style={{ marginLeft:"auto", fontSize:"10px", color:"#4a4540", whiteSpace:"nowrap" }}>{note.folder.name}</span>}
                </div>
              ))}
            </div>
            <div style={{ padding:"0.5rem 1.125rem", borderTop:"1px solid #161310", display:"flex", gap:"1rem" }}>
              <span style={{ fontSize:"10px", color:"#3a3530" }}>↵ open</span>
              <span style={{ fontSize:"10px", color:"#3a3530" }}>esc close</span>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <div style={{ position:"fixed", bottom:"1.25rem", right:"1.25rem", display:"flex", gap:"6px", zIndex:50 }}>
        <button onClick={() => setCmdOpen(true)} style={{ background:"#161310", border:"1px solid #2a2520", color:"#7a7570", borderRadius:"7px", padding:"7px 12px", fontSize:"11px", cursor:"pointer" }}>⌘K</button>
        <button onClick={createNote} style={{ background:"#c9a96e", border:"none", color:"#1a1510", borderRadius:"7px", padding:"7px 12px", fontSize:"11px", fontWeight:"600", cursor:"pointer" }}>+ New</button>
      </div>
    </div>
  )
}
