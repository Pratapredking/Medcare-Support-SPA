# MediCare Support SPA

A responsive, single-page web application for medical equipment fault reporting and marketplace management. Doctors can report equipment issues and track approvals; technicians can review and approve the shared fault queue. Both roles can browse and manage device listings.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## Environment configuration

Create a `.env` file in the project root. You can copy `.env.example` and replace its placeholders:

```env
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.region.firebasedatabase.app
```

Restart the development server after changing environment variables. The real `.env` file is excluded from Git.

## Production build

```bash
npm run build
npm run preview
```

The production bundle is written to `dist/`.

## Application structure

- `src/App.jsx` — authentication, SPA navigation, dashboards, marketplace, and forms
- `src/api.js` — Firebase Authentication and Realtime Database requests
- `src/styles.css` — responsive design system and layouts
- `assets/medicare-team.png` — generated sign-in artwork

The original React Native source remains in the repository for reference, but the active application is the Vite entry at `src/main.jsx`.
