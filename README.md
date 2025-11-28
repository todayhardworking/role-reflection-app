# Revo Reflect

AI-powered journaling that helps you grow across all of your life roles. Capture daily reflections, receive role-based AI coaching, share selected entries with the community, and generate weekly and monthly insights from your writing.

## Features
- **Reflection management**: Create, edit, and delete reflections with optional titles and role tags. Entries are timestamped and sorted newest-first.
- **Role-based AI coaching**: Generate tailored 5–7 sentence suggestions for each role attached to a reflection. Suggestions are saved alongside the entry and can be regenerated on demand.
- **Public reflections with likes**: Toggle any reflection to public or private, choose to display your author ID or stay anonymous, and optionally include AI suggestions and role tags. Public readers can like reflections, and signed-in users can review everything they have liked on **/my-likes**.
- **Weekly AI analysis**: Review weekly history on **/weekly/summary**, view the reflections for a given week, and generate AI analysis once a week is complete. Summaries include insights, wins, challenges, and next-week actions.
- **Monthly insights**: Combine completed weekly analyses into AI-generated monthly summaries on **/monthly/summary**, including patterns, emotional and productivity trends, and action steps.
- **Navigation and account management**: Global navigation for dashboard, reflections, roles, public feed, likes, weekly and monthly reports, plus secure sign out and a dedicated account/data deletion flow.
- **Secure authentication**: Email/password auth via Firebase Authentication with protected routes enforced by a global `withAuth` wrapper.

## Tech stack
- **Framework**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Vercel serverless API routes using Firebase Admin SDK + Firestore
- **AI**: OpenAI API (configurable model)
- **Auth**: Firebase Authentication (client SDK)

## Project structure (high level)
```
app/
  page.tsx                # Marketing/landing page
  signin/, signup/        # Public auth pages
  dashboard/              # Authenticated menu + account deletion
  reflection/new/, reflection/[id]/
  reflections/            # Authenticated list view
  public/, public/[id]/   # Public feed + detail with likes
  my-likes/               # Liked public reflections
  weekly/summary/, weekly/[weekId]/
  monthly/summary/
  roles/                  # Manage life roles
  api/                    # Serverless routes (reflections, roles, likes, AI, weekly/monthly)
components/               # UI + auth wrapper
context/                  # Firebase auth context
lib/                      # Firebase clients, reflection helpers, weekly/monthly utilities
public/                   # Static assets
```

For a deeper architectural reference, see **SYSTEM_ARCHITECTURE.md** and **CODING_GUIDELINES.md**.

## Development setup
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Environment variables** – create `.env.local` with:
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   FIREBASE_ADMIN_SERVICE_ACCOUNT=  # JSON string for a Firebase service account
   OPENAI_API_KEY=
   OPENAI_MODEL=gpt-4o-mini          # optional override
   ```
3. **Run locally**
   ```bash
   npm run dev
   ```
   The app starts at http://localhost:3000.

## Firestore index tips
Some queries require composite indexes. If an index is missing, Firestore will provide a direct link to create it. Common patterns:
- Private reflections: `where("uid" == user)` + `orderBy("createdAt", desc)`
- Public feed: `where("isPublic" == true)` + `orderBy("createdAt", desc)`

## Testing guidance
Manual checks to cover the main flows:
- Sign up / sign in and create, edit, delete a reflection.
- Generate AI suggestions for a reflection and save them.
- Toggle a reflection public/private, like/unlike from another account, and confirm it appears on **/my-likes**.
- View weekly history, generate AI analysis for a completed week, and open the detailed weekly page.
- Create a monthly summary from available weekly analyses.
