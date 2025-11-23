# GLOBAL CODING GUIDELINES — DO NOT VIOLATE
# These rules define the architecture of Revo Reflect. Codex must follow them exactly.

## FIRESTORE RULES
1. All Firestore timestamps must be converted to ISO strings before returning to client:
     createdAt: data.createdAt.toDate().toISOString()
2. Always store createdAt as Firestore Timestamp:
     admin.firestore.Timestamp.now()
3. Never return raw Firestore objects.
4. Any query using where() + orderBy() requires a composite index.
5. Sanitize all Firestore documents before returning them:
     - id
     - text
     - createdAt (ISO)
     - uid
     - roles
     - isPublic
     - authorId

## NEXT.JS RULES
6. Client components must begin with "use client".
7. Server components must NOT call fetch("/api/...").
8. All client fetches must run inside useEffect.
9. API routes must avoid Next.js Dynamic Server Error. Use:
       const { searchParams } = new URL(request.url)
   safely inside server routes only.

## CLIENT/SERVER SEPARATION
10. API routes return JSON only, with no Firestore Timestamp objects.
11. Pages must not mix server fetch + client logic.
12. Client pages use useState/useEffect to load API data.

## VERCEL DEPLOYMENT RULES
13. All components must pass TypeScript validation.
14. Do not attach onClick directly to SVG icons — wrap inside <button>.
15. Ensure all Next.js pages conform to valid page signatures.

# END OF GUIDELINES
