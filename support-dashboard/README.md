# Spotly Support Dashboard

Real-time three-column WhatsApp support workspace (React + Tailwind + Socket.io).

- `src/SupportDashboard.tsx` — the UI (sidebar · chat feed · metadata + 24h countdown)
- `src/useSupport.ts` — data + Socket.io realtime hook
- `src/types.ts` — wire types shared with the backend

These are drop-in files. See **[../docs/WHATSAPP_SUPPORT.md](../docs/WHATSAPP_SUPPORT.md)**
for full setup: scaffolding a Vite + Tailwind app, env vars, Twilio webhook
configuration, and the backend it talks to (`backend/bridge/whatsapp-chat.js`).

Quick start:

```bash
npm create vite@latest . -- --template react-ts   # in this folder
npm install socket.io-client
npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
# render <SupportDashboard /> from src/main.tsx, then:
npm run dev
```
