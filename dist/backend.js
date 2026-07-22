// @bun
// src/backend.ts
var NOTES_FILE = "notes.json";
async function loadNotes() {
  return spindle.storage.getJson(NOTES_FILE, { fallback: [] });
}
async function saveNotes(notes) {
  await spindle.storage.setJson(NOTES_FILE, notes, { indent: 2 });
}
function makeId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
spindle.onFrontendMessage(async (payload, userId) => {
  try {
    switch (payload.type) {
      case "list_notes": {
        const notes = await loadNotes();
        notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        spindle.sendToFrontend({ type: "notes_list", notes }, userId);
        break;
      }
      case "add_note": {
        const notes = await loadNotes();
        const now = new Date().toISOString();
        const note = {
          id: makeId(),
          text: String(payload.text ?? "").trim(),
          tag: payload.tag ? String(payload.tag).trim() : null,
          source: payload.source ? String(payload.source).trim() : null,
          createdAt: now,
          updatedAt: now
        };
        if (!note.text) {
          spindle.sendToFrontend({ type: "error", message: "Note text cannot be empty." }, userId);
          break;
        }
        notes.push(note);
        await saveNotes(notes);
        spindle.sendToFrontend({ type: "note_added", note }, userId);
        break;
      }
      case "update_note": {
        const notes = await loadNotes();
        const idx = notes.findIndex((n) => n.id === payload.id);
        if (idx === -1) {
          spindle.sendToFrontend({ type: "error", message: "Note not found." }, userId);
          break;
        }
        notes[idx] = {
          ...notes[idx],
          text: payload.text !== undefined ? String(payload.text).trim() : notes[idx].text,
          tag: payload.tag !== undefined ? payload.tag ? String(payload.tag).trim() : null : notes[idx].tag,
          updatedAt: new Date().toISOString()
        };
        await saveNotes(notes);
        spindle.sendToFrontend({ type: "note_updated", note: notes[idx] }, userId);
        break;
      }
      case "delete_note": {
        const notes = await loadNotes();
        const next = notes.filter((n) => n.id !== payload.id);
        await saveNotes(next);
        spindle.sendToFrontend({ type: "note_deleted", id: payload.id }, userId);
        break;
      }
      default:
        spindle.log.warn(`Notebook: unknown message type "${payload.type}"`);
    }
  } catch (err) {
    spindle.log.error(`Notebook backend error: ${err?.message ?? err}`);
    spindle.sendToFrontend({ type: "error", message: "Something went wrong saving your note." }, userId);
  }
});
spindle.log.info("Notebook backend ready");
