// src/frontend.ts
var NOTEBOOK_ICON = `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="2.5" width="14" height="15" rx="2" stroke="currentColor" stroke-width="1.4"/>
  <path d="M7 2.5V17.5" stroke="currentColor" stroke-width="1.4"/>
  <path d="M9.5 6.5H14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M9.5 9.5H14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M9.5 12.5H12.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
</svg>`;
function setup(ctx) {
  ctx.deferReady?.();
  let notes = [];
  let listEl = null;
  let searchQuery = "";
  const unsubBackend = ctx.onBackendMessage((payload) => {
    switch (payload.type) {
      case "notes_list":
        notes = payload.notes;
        renderList();
        break;
      case "note_added":
        notes.unshift(payload.note);
        renderList();
        ctx.toast?.success("Saved to notebook");
        break;
      case "note_updated": {
        const idx = notes.findIndex((n) => n.id === payload.note.id);
        if (idx !== -1)
          notes[idx] = payload.note;
        renderList();
        break;
      }
      case "note_deleted":
        notes = notes.filter((n) => n.id !== payload.id);
        renderList();
        break;
      case "error":
        ctx.toast?.error(payload.message ?? "Notebook error");
        break;
    }
  });
  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  function openNoteModal(existing) {
    const modal = ctx.ui.showModal({ title: existing ? "Edit Note" : "New Note", width: 440 });
    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex; flex-direction:column; gap:10px;";
    const textarea = document.createElement("textarea");
    textarea.value = existing?.text ?? "";
    textarea.placeholder = "Paste a quote, jot an idea, save anything...";
    textarea.rows = 6;
    textarea.style.cssText = `
      resize: vertical;
      padding: 10px;
      border-radius: var(--lumiverse-radius);
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill-subtle);
      color: var(--lumiverse-text);
      font: inherit;
      font-size: 13px;
    `;
    const tagInput = document.createElement("input");
    tagInput.type = "text";
    tagInput.value = existing?.tag ?? "";
    tagInput.placeholder = "Tag (optional) — e.g. Lohen, worldbuilding, job search";
    tagInput.style.cssText = `
      padding: 8px 10px;
      border-radius: var(--lumiverse-radius);
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill-subtle);
      color: var(--lumiverse-text);
      font: inherit;
      font-size: 12.5px;
    `;
    const saveBtn = document.createElement("button");
    saveBtn.textContent = existing ? "Save Changes" : "Save to Notebook";
    saveBtn.style.cssText = `
      padding: 8px 14px;
      border-radius: var(--lumiverse-radius);
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill-subtle);
      color: var(--lumiverse-text);
      font: inherit;
      font-size: 13px;
      cursor: pointer;
      align-self: flex-end;
    `;
    saveBtn.addEventListener("click", () => {
      const text = textarea.value.trim();
      if (!text)
        return;
      if (existing) {
        ctx.sendToBackend({ type: "update_note", id: existing.id, text, tag: tagInput.value });
      } else {
        ctx.sendToBackend({ type: "add_note", text, tag: tagInput.value });
      }
      modal.dismiss();
    });
    wrap.appendChild(textarea);
    wrap.appendChild(tagInput);
    wrap.appendChild(saveBtn);
    modal.root.appendChild(wrap);
    textarea.focus();
  }
  async function handleNoteMenu(note, x, y) {
    const { selectedKey } = await ctx.ui.showContextMenu({
      position: { x, y },
      items: [
        { key: "copy", label: "Copy Text" },
        { key: "edit", label: "Edit" },
        { key: "div", label: "", type: "divider" },
        { key: "delete", label: "Delete", danger: true }
      ]
    });
    if (selectedKey === "copy") {
      await navigator.clipboard.writeText(note.text);
      ctx.toast?.info("Copied to clipboard");
    } else if (selectedKey === "edit") {
      openNoteModal(note);
    } else if (selectedKey === "delete") {
      const { confirmed } = await ctx.ui.showConfirm({
        title: "Delete Note",
        message: "This note will be permanently removed.",
        variant: "danger",
        confirmLabel: "Delete"
      });
      if (confirmed)
        ctx.sendToBackend({ type: "delete_note", id: note.id });
    }
  }
  function renderList() {
    if (!listEl)
      return;
    listEl.innerHTML = "";
    const filtered = notes.filter((n) => {
      if (!searchQuery)
        return true;
      const q = searchQuery.toLowerCase();
      return n.text.toLowerCase().includes(q) || (n.tag ?? "").toLowerCase().includes(q);
    });
    if (filtered.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = notes.length === 0 ? 'Nothing saved yet. Hit "New Note" to add your first one.' : "No notes match your search.";
      empty.style.cssText = "color: var(--lumiverse-text-dim); font-size: 12.5px; text-align:center; padding: 24px 8px;";
      listEl.appendChild(empty);
      return;
    }
    for (const note of filtered) {
      const card = document.createElement("div");
      card.style.cssText = `
        padding: 10px 12px;
        margin-bottom: 8px;
        background: var(--lumiverse-fill-subtle);
        border: 1px solid var(--lumiverse-border);
        border-radius: var(--lumiverse-radius);
        cursor: context-menu;
      `;
      const text = document.createElement("div");
      text.textContent = note.text;
      text.style.cssText = "font-size: 13px; color: var(--lumiverse-text); white-space: pre-wrap; word-break: break-word;";
      const meta = document.createElement("div");
      meta.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-top:8px; gap:8px;";
      const metaLeft = document.createElement("span");
      metaLeft.style.cssText = "font-size: 11px; color: var(--lumiverse-text-dim);";
      metaLeft.textContent = note.tag ? `#${note.tag} · ${fmtDate(note.updatedAt)}` : fmtDate(note.updatedAt);
      const moreBtn = document.createElement("button");
      moreBtn.textContent = "⋯";
      moreBtn.title = "Note options";
      moreBtn.style.cssText = `
        background: none;
        border: none;
        color: var(--lumiverse-text-dim);
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
        padding: 2px 6px;
      `;
      moreBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const rect = moreBtn.getBoundingClientRect();
        handleNoteMenu(note, rect.left, rect.bottom);
      });
      meta.appendChild(metaLeft);
      meta.appendChild(moreBtn);
      card.appendChild(text);
      card.appendChild(meta);
      card.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        handleNoteMenu(note, e.clientX, e.clientY);
      });
      listEl.appendChild(card);
    }
  }
  const tab = ctx.ui.registerDrawerTab({
    id: "notebook",
    title: "Notebook",
    shortName: "Notes",
    description: "Save quotes, ideas, and snippets for later",
    keywords: ["notes", "save", "quotes", "snippets", "ideas"],
    headerTitle: "Notebook",
    iconSvg: NOTEBOOK_ICON
  });
  const container = document.createElement("div");
  container.style.cssText = "display:flex; flex-direction:column; height:100%; padding:12px; gap:10px;";
  const toolbar = document.createElement("div");
  toolbar.style.cssText = "display:flex; gap:8px;";
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search notes...";
  searchInput.style.cssText = `
    flex: 1;
    padding: 7px 10px;
    border-radius: var(--lumiverse-radius);
    border: 1px solid var(--lumiverse-border);
    background: var(--lumiverse-fill-subtle);
    color: var(--lumiverse-text);
    font: inherit;
    font-size: 12.5px;
  `;
  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value;
    renderList();
  });
  const newBtn = document.createElement("button");
  newBtn.textContent = "+ New Note";
  newBtn.style.cssText = `
    padding: 7px 12px;
    border-radius: var(--lumiverse-radius);
    border: 1px solid var(--lumiverse-border);
    background: var(--lumiverse-fill-subtle);
    color: var(--lumiverse-text);
    font: inherit;
    font-size: 12.5px;
    cursor: pointer;
    white-space: nowrap;
  `;
  newBtn.addEventListener("click", () => openNoteModal());
  toolbar.appendChild(searchInput);
  toolbar.appendChild(newBtn);
  listEl = document.createElement("div");
  listEl.style.cssText = "flex:1; overflow-y:auto;";
  container.appendChild(toolbar);
  container.appendChild(listEl);
  tab.root.appendChild(container);
  tab.onActivate(() => {
    ctx.sendToBackend({ type: "list_notes" });
  });
  const action = ctx.ui.registerInputBarAction({
    id: "new-note",
    label: "New Note",
    iconSvg: NOTEBOOK_ICON
  });
  const unsubAction = action.onClick(() => openNoteModal());
  ctx.sendToBackend({ type: "list_notes" });
  ctx.ready?.();
  return () => {
    unsubBackend();
    unsubAction();
    tab.destroy();
    action.destroy();
  };
}
export {
  setup
};
