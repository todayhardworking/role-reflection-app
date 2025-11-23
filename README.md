📘 README.md — Revo Reflect

AI-Powered Daily Reflection App with Role-Based Coaching Suggestions



Revo Reflect is a modern, AI-enhanced journaling and reflection application that helps users grow across all areas of life.

Define your life roles, write daily reflections, and instantly receive role-specific coaching suggestions powered by AI.



Built using Next.js 14, Firebase Auth, Firestore, OpenAI, and deployed on Vercel.



🚀 Features

✨ 1. Daily Reflections



Write, edit, delete your reflections easily



Add a title or let the system auto-generate one



Timestamped and sorted from newest to oldest



🎭 2. Role-Based AI Suggestions



Tell the app your life roles (e.g., Father, Businessman, Creator, Coach, Founder).

The AI returns 5–7 sentence coaching suggestions per role, referencing your reflection content.



Suggestions appear as collapsible role sections.



🌐 3. Public Reflections (Optional)



You can choose to:



Keep reflections private



Make reflections public



Show your role tags



Share AI suggestions publicly



Display anonymously or with author ID



Public reflections appear at:

/public



🧭 4. Global Navigation Menu



A clean hamburger menu appears on all authenticated pages:



Dashboard



New Reflection



Reflections List



Public Reflections



Sign Out



🔒 5. Secure Authentication



Firebase Authentication (Email/Password)



Global auth wrapper ensures protected pages require login



☁️ 6. Cloud-Synced Data



Reflections stored in Firestore



Accessible across all devices



Designed for future mobile app release



🏛 Tech Stack

Frontend



Next.js 14 (App Router)



React 18



TypeScript



TailwindCSS



Backend



Vercel Serverless API Routes



Firebase Admin SDK



Firestore Database



AI



OpenAI (role-based suggestion generation)



Deployment



Vercel



Firestore composite indexes (auto-generated when needed)



📂 Project Structure

app/

&nbsp; ├── signin/

&nbsp; ├── signup/

&nbsp; ├── dashboard/

&nbsp; ├── roles/

&nbsp; ├── reflections/

&nbsp; ├── reflection/

&nbsp; ├── public/

&nbsp; ├── api/

components/

context/

lib/

public/





Full architecture documented in:

📄 SYSTEM\_ARCHITECTURE.md

📄 CODING\_GUIDELINES.md



🧠 How It Works

Writing a Reflection



User writes a reflection



Data saved to Firestore via API route



AI suggestions can be generated on demand



Suggestions saved alongside the reflection



Making a Reflection Public



Toggle “Make Public”



Reflection appears on /public



Optional: show AI suggestions + roles + anonymous mode



🛠 Development Setup

1\. Clone the repository

git clone https://github.com/<your-username>/role-reflection-app.git



2\. Install dependencies

npm install



3\. Environment variables



Create .env.local:



NEXT\_PUBLIC\_FIREBASE\_API\_KEY=

NEXT\_PUBLIC\_FIREBASE\_AUTH\_DOMAIN=

NEXT\_PUBLIC\_FIREBASE\_PROJECT\_ID=

NEXT\_PUBLIC\_FIREBASE\_APP\_ID=

FIREBASE\_ADMIN\_PRIVATE\_KEY=

FIREBASE\_ADMIN\_CLIENT\_EMAIL=

OPENAI\_API\_KEY=



4\. Run in development

npm run dev





App runs at http://localhost:3000



🔧 Firestore Index Requirements



The following features require Firestore composite indexes:



Load reflections (private)

where("uid" == user)

orderBy("createdAt", desc)



Load public reflections

where("isPublic" == true)

orderBy("createdAt", desc)





If missing, Firestore gives a link to auto-create the index.



🧪 Testing Checklist



Sign in / sign up



Create a reflection



Edit a reflection



Delete a reflection



Generate AI suggestions



Toggle public/private



View public feed



Navigation menu



Mobile responsive layout



📱 Future Roadmap



iOS + Android app (React Native or Expo)



Author profiles + follower system



Search + filter public reflections



Role-tag browsing



Daily reminders



Streak system



Image/audio reflections



More AI models

