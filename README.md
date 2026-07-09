# Notebook — a Lumiverse Spindle extension

Save quotes, ideas, and message snippets to a running notebook you can reach
from anywhere in Lumiverse. No gated permissions required — everything here
runs on the free tier (drawer tabs, input bar actions, storage).

## What it does

- **Notebook tab** in the sidebar drawer (also searchable via `Ctrl/Cmd+K`) —
  a running list of everything you've saved, newest first, with search.
- **"New Note" input bar action** — click it from the Extras popover on the
  chat input bar to jot something down without leaving the conversation.
- **Right-click (or tap the `⋯` button) on any note** — copy, edit, or delete.
- Notes are tag-able (e.g. `Lohen`, `worldbuilding`, `job search`) so you can
  search by topic later.

## Project structure

```
lumiverse-notebook/
├── spindle.json       # extension manifest
├── src/
│   ├── backend.ts     # stores notes.json in extension storage, handles CRUD
│   └── frontend.ts     # drawer tab UI + input bar shortcut
├── package.json
└── tsconfig.json
```

There's no `dist/` folder — Lumiverse auto-builds `src/backend.ts` and
`src/frontend.ts` with `bun build` on install, so you can ship this as-is.

## Installing it

1. Push this folder to a GitHub repo (public or private — private repos work
   if your Lumiverse instance has repo access configured).
2. Update the `github` and `homepage` fields in `spindle.json` to point at
   your actual repo URL.
3. In Lumiverse: **Extensions panel → Install from Source**, paste the repo
   URL, and install.
4. Since `permissions` is `[]`, there's nothing to approve — it's usable
   immediately.

## Where your data lives

Notes are stored as JSON at:

```
{DATA_DIR}/extensions/notebook/storage/notes.json
```

If you ever want notes to stay separate per-user on a shared/operator-scoped
install, swap `spindle.storage` for `spindle.userStorage` in `backend.ts` —
the method signatures are the same, just with an extra `userId` argument.

## Ideas for a v2

- A "Save last message" input bar action that grabs the most recent AI
  reply automatically (would need the `chat_mutation` permission to read
  chat history from the backend).
- Bulk export to Markdown via `spindle.storage.list()` + a download.
- Per-character auto-tagging using the active chat's character name.

Let me know if you want me to build any of these next — happy to keep
iterating with you on this.
