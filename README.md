# InterviewX

**A real-time technical interview platform.** Interviewers and candidates meet face to face in a virtual room, solve problems together in a live code editor, and keep every interview scheduled and tracked in one place.

Built with Next.js, TypeScript, Convex, Clerk, Stream and shadcn/ui.

---

## Features

- **Face-to-face video interviews:** join a virtual room for a live call, powered by Stream.
- **Live code editor:** write and review code during the interview, with changes updating in real time for everyone in the room.
- **Interview scheduling:** interviewers schedule interviews ahead of time, and candidates see them in their own dashboard.
- **Interview status:** follow each interview from scheduled to completed so nothing gets lost.
- **Recordings and comments:** review past sessions and keep notes on each interview.
- **Two roles:** interviewers and candidates each get a dashboard built for what they need to do.
- **Real-time updates:** data is synced over WebSockets, so changes show up instantly without refreshing.
- **Secure authentication:** sign-in and user management with Clerk.
- **Modern UI:** responsive, accessible components from shadcn/ui, with light and dark themes.

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | [Next.js](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Backend and database | [Convex](https://www.convex.dev/) (real-time, WebSocket-based) |
| Authentication | [Clerk](https://clerk.com/) |
| Video and virtual room | [Stream Video](https://getstream.io/video/) |
| UI | [shadcn/ui](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/) |

## How It Works

1. **Sign in** with Clerk. Your profile is synced to Convex.
2. **Interviewers** start an instant call or schedule an interview.
3. **Candidates** see their upcoming interviews and join with one click.
4. Everyone meets in a **virtual room** with video, and the shared **code editor** stays in sync live.
5. Interview **status** is updated so both sides always know where things stand.

## Getting Started

### Prerequisites

- Node.js 18 or later
- A [Clerk](https://clerk.com/) account
- A [Convex](https://www.convex.dev/) account
- A [Stream](https://getstream.io/) account

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Aditya4726/InterviewX.git
cd InterviewX

# 2. Install dependencies
npm install
```

### Environment variables

Create a `.env.local` file in the project root and fill in your own keys. You can copy `.env.example` to start.

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Convex (CONVEX_DEPLOYMENT is added for you by `npx convex dev`)
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=

# Stream
NEXT_PUBLIC_STREAM_API_KEY=
STREAM_SECRET_KEY=
```

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk dashboard, API keys |
| `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL` | Created by `npx convex dev`, or the Convex dashboard |
| `NEXT_PUBLIC_STREAM_API_KEY`, `STREAM_SECRET_KEY` | Stream dashboard, your app's API keys |

Convex also needs your Clerk issuer URL set in its auth configuration so the two can work together. Never commit `.env.local`.

### Run the app

```bash
# Terminal 1: start the Convex backend
npx convex dev

# Terminal 2: start the Next.js app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/            Next.js routes and layouts (home, schedule, meeting, recordings, dashboard)
├── components/     UI components, meeting room, code editor and providers
├── actions/        Server actions (Stream)
├── hooks/          Custom React hooks (for example, user role)
├── constants/      Shared constants
├── lib/            Utilities
└── middleware.ts   Clerk route protection
convex/             Backend functions and schema (users, interviews, comments, code sessions)
public/             Static assets
```

## Contributing

Contributions are welcome. Fork the repo, create a branch, make your changes and open a pull request.
