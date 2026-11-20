# Telnet — Private Real-Time Screen Sharing

> Lightweight, cross-platform screen-sharing application.  
> Video only · No mic · No camera · No audio capture.

```
telnet/
├── apps/
│   ├── desktop/      ← Electron + React + TypeScript (broadcaster client)
│   ├── viewer/       ← Browser viewer (React + LiveKit)
│   └── api/          ← NestJS backend (auth, rooms, tokens)
├── packages/
│   ├── shared/       ← Shared TypeScript types
│   └── webrtc/       ← LiveKit helpers
└── infrastructure/
    ├── livekit/      ← LiveKit SFU config
    └── coturn/       ← TURN server config
```

---

## Quick start

### 1. Prerequisites

| Tool | Version |
|------|---------|
| Node | ≥ 20 |
| pnpm | ≥ 9 |
| Docker + Compose | any recent |

### 2. Install dependencies

```bash
cd /home/missari/Telnet
pnpm install
```

### 3. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, LiveKit SFU, and coturn.

### 4. Start the API

```bash
pnpm --filter @telnet/api start:dev
```

### 5. Start the desktop app (Electron)

```bash
pnpm --filter @telnet/desktop dev
```

### 6. Start the browser viewer (optional)

```bash
pnpm --filter @telnet/viewer dev
```

---

## Architecture

```
Broadcaster (Electron)
  │
  │  desktopCapturer → video track (no audio)
  │  WebRTC publish
  ▼
LiveKit SFU (Docker)
  │
  │  Forward video track
  ▼
Viewer 1, 2, 3 … (Browser or Electron)
```

## Environment variables

Copy and edit before first run:

| File | Purpose |
|------|---------|
| `apps/api/.env` | Backend secrets (JWT, DB, LiveKit keys) |
| `apps/desktop/.env` | Vite env for the renderer |
| `apps/viewer/.env` | Vite env for the browser viewer |

> **Important:** Change `JWT_SECRET`, `LIVEKIT_API_SECRET`, and `TURN_SECRET` before any non-local deployment.

## Technology stack

| Layer | Choice |
|-------|--------|
| Desktop | Electron |
| UI | React + TypeScript + Tailwind |
| Capture | desktopCapturer + getUserMedia |
| Real-time media | WebRTC |
| SFU | LiveKit |
| Backend | NestJS |
| Database | PostgreSQL + TypeORM |
| Cache | Redis |
| TURN | coturn |
| Packaging | electron-builder |

## Roadmap

- [x] Phase 1 — Monorepo scaffold + Electron shell
- [x] Phase 2 — LiveKit integration + rooms API
- [ ] Phase 3 — Adaptive bitrate + hardware encoding
- [ ] Phase 4 — Text chat + annotations
- [ ] Phase 5 — Production packaging + auth hardening

## Linux / Wayland note

On Arch Linux with GNOME Wayland, screen capture requires PipeWire and XDG Desktop Portal.
Electron uses `desktopCapturer` which integrates with these automatically on supported versions.
If capture fails, check that `xdg-desktop-portal-gnome` is running.
