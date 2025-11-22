# VideoCaps Frontend

Next.js frontend for the AI Real-Time Caption Generator.

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/transcribe
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Project Structure

```
src/
├── app/              # Next.js 14 App Router
│   ├── layout.tsx   # Root layout
│   └── page.tsx     # Home page
├── components/       # React components
├── hooks/           # Custom React hooks
└── styles/          # Global styles
```

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React 18** - UI library
