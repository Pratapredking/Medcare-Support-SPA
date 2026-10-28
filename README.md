# MediCare Support SPA

A responsive, single-page web application for medical equipment fault reporting and marketplace management. Doctors can report equipment issues and track approvals, technicians can review the shared fault queue, and administrators can manage the hospital directory, doctor-to-hospital assignments, and medical equipment inventory. All roles can browse and manage device listings.

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

## Firebase roles and hospital mappings

User profiles are stored at `userProfiles/{uid}` with one of three roles: `doctor`, `technician`, or `admin`. Admin users can manage the hospital directory and doctor assignments stored at:

- `hospitals/{hospitalId}` with hospital name, specialization, address, status, and audit fields
- `doctorHospitalMappings/{doctorUid}`
- `medicalEquipment/{entryId}` for Admin-only inventory records, including the referenced `hospitalId` and canonical `hospitalName`
- `medicalEquipmentCatalog/{entryId}` for the authenticated fault-report dropdown

The Admin-only Manage Hospitals screen initializes six versioned sample hospitals (AIIMS, Apollo, Artemis, Fortis, Max, and Medanta) and saves new hospitals directly to Firebase. Hospital Mapping reads the same directory, so newly created records are immediately available for doctor assignments. Deploy the included Realtime Database rules with the Firebase CLI before using the Admin workflow:

The Device Entry register loads its Hospital Name dropdown from `hospitals`, validates the selected Firebase hospital during submission, and stores both its ID and canonical name with the equipment record. Versioned sample equipment records use Apollo Hospital and stable Firebase keys, including the IV Stand record and seed rows 20–42. Stable keys and seed versions prevent duplicate rows.

When a Doctor signs in, the dashboard loads `doctorHospitalMappings/{doctorUid}`, opens the primary hospital workspace, and allows switching among assigned hospitals. The Report a Device Fault catalog uses a Firebase `hospitalId` query, so only equipment belonging to the active hospital workspace is selectable. New fault reports store and validate the hospital and equipment relationship.

```bash
firebase deploy --only database
```

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
