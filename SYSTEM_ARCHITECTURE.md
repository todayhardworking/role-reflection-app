\# SYSTEM ARCHITECTURE — Revo Reflect

This document defines the complete architecture of the application. Codex must follow this structure when generating or modifying code.



---



\# 1. OVERVIEW

Revo Reflect is a full-stack Next.js 14 App Router application deployed on Vercel, using:



\- Firebase Authentication (Client SDK)

\- Firestore Database (Admin SDK via API routes)

\- OpenAI API for AI suggestions

\- Client-side pages using "use client"

\- API routes as server-side handlers

\- TailwindCSS for UI

\- Global auth wrapper (withAuth) for authenticated pages

\- Public reflections feature with optional author identity



The app supports:

\- User authentication

\- Writing reflections

\- Editing/deleting reflections

\- Role-based AI suggestions

\- Public/Private reflections toggle

\- Public reflection feed



---



\# 2. PROJECT STRUCTURE



app/

&nbsp; ├── signin/                 (Public)

&nbsp; ├── signup/                 (Public)

&nbsp; ├── dashboard/              (Auth)

&nbsp; ├── roles/                  (Auth)

&nbsp; ├── reflections/            (Auth)

&nbsp; │      ├── page.tsx         (List)

&nbsp; ├── reflection/

&nbsp; │      ├── new/             (Auth)

&nbsp; │      ├── \[id]/            (Auth, detail + AI suggestions)

&nbsp; ├── public/                 (Public reflections feed)

&nbsp; ├── api/

&nbsp; │      ├── saveReflection/

&nbsp; │      ├── getReflections/

&nbsp; │      ├── getReflection/

&nbsp; │      ├── updateReflection/

&nbsp; │      ├── deleteReflection/

&nbsp; │      ├── togglePublic/

&nbsp; │      ├── publicReflections/



components/

&nbsp; ├── withAuth.tsx            (Global auth wrapper + navigation drawer)

&nbsp; ├── UI components



context/

&nbsp; ├── UserContext.tsx         (Firebase Auth client state)



lib/

&nbsp; ├── firebase.ts             (Client SDK)

&nbsp; ├── firebaseAdmin.ts        (Admin SDK)

&nbsp; ├── reflections.ts          (Client fetch helpers)

&nbsp; ├── roles.ts                (Future expansion)



public/

&nbsp; ├── icons / logo assets



---



\# 3. AUTHENTICATION FLOW



\- Firebase Authentication (Email/Password)

\- Auth state managed on client via UserContext

\- Protected pages are wrapped with:

&nbsp; 

&nbsp;     export default withAuth(PageComponent);



\- Users not logged in are automatically redirected to /signin

\- Logout triggers signOut() from UserContext and redirects to /signin



---



\# 4. DATA FLOW



\## 4.1 Reflection Creation

1\. Client creates reflection (title, text)

2\. Calls POST `/api/saveReflection`

3\. API route:

&nbsp;  - Validates inputs

&nbsp;  - Uses Firestore Admin SDK

&nbsp;  - Saves { text, title, createdAt (Timestamp), uid, roles, isPublic, aiSuggestions }

4\. Returns success + reflection ID



\## 4.2 Reflection Fetch (List)

Client → GET `/api/getReflections?uid=XXX`  

Server → Firestore query sorted by createdAt desc  

Server → Returns array with timestamps converted to ISO strings  

Client → Displays reflection list



\## 4.3 Reflection Fetch (Detail)

Client → GET `/api/getReflection?id=XXX`



\## 4.4 Update Reflection

Client → PATCH `/api/updateReflection`



\## 4.5 Delete Reflection

Client → DELETE `/api/deleteReflection?id=XXX`



---



\# 5. FIRESTORE SCHEMA



Collection: reflections



Fields:



\- id (string auto)

\- uid (string)

\- title (string)

\- text (string)

\- roles (string\[])

\- aiSuggestions (Record<string, string> | null)

\- isPublic (boolean, default false)

\- createdAt (Timestamp)

\- updatedAt (Timestamp)



---



\# 6. AI SUGGESTION SYSTEM



Trigger:

\- User clicks "Generate AI Suggestion"



Process:

1\. Client calls POST `/api/generateAISuggestions`

2\. API route calls OpenAI API with:

&nbsp;  - reflection text

&nbsp;  - selected roles

&nbsp;  - strict JSON response format

3\. API updates Firestore:

&nbsp;  - aiSuggestions stored under the reflection document

4\. Client updates UI with accordion sections per role



---



\# 7. PUBLIC REFLECTIONS



\## 7.1 Publishing

From reflection detail:

\- User toggles \*\*Make Public\*\*

\- Calls `/api/togglePublic`

\- Firestore updates:

&nbsp; - isPublic = true / false



\## 7.2 Public Feed

Route: `/public`



Query:

where("isPublic", "==", true)

.orderBy("createdAt", "desc")





Requires Firestore index.



Public page shows:

\- title

\- text preview

\- created date

\- roles tags

\- optional author (UID or anonymous)

\- AI suggestions (if user allowed them)



---



\# 8. CLIENT/SERVER SEPARATION RULES



\### Client:

\- All pages inside `app/...` that use fetch must run in useEffect

\- Must begin with `"use client"`



\### Server:

\- API routes only

\- Must use Admin SDK

\- Must convert timestamps to ISO

\- Must sanitize Firestore return data



---



\# 9. NAVIGATION SYSTEM



Global navigation drawer is included via withAuth wrapper:



Links:

\- Dashboard

\- New Reflection

\- Reflections

\- Public Reflections

\- Sign Out



Public pages (signin, signup, public) DO NOT show the drawer.



---



\# 10. DEPLOYMENT RULES



\- Must pass TypeScript

\- No raw Firestore Timestamp returned to client

\- No server-side fetch("/api/...") usage

\- No direct onClick on SVG — wrap inside button

\- All indexes must exist before queries are used

\- Vercel must show no build errors before merging



---



\# END OF SYSTEM ARCHITECTURE





