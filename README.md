# Moji

A workspace-centric productivity app for developers. Organize your todos and notes by project, not by endless pages.

## Why Moji?

Notion is great, but sometimes you just want a focused space for a project - tasks on one side, notes on the other. No databases, no templates, no friction. Just workspaces that keep you in flow.

## Tech Stack

- **Backend**: FastAPI + Supabase
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth

## Project Structure

```
moji/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app
│   │   ├── config.py        # Settings and env vars
│   │   ├── dependencies.py  # Auth and Supabase clients
│   │   ├── models/          # Pydantic schemas
│   │   └── routes/          # API endpoints
│   └── requirements.txt
├── frontend/
│   ├── app/                  # Next.js pages
│   ├── components/           # React components
│   └── lib/                  # Supabase & API clients
└── supabase/
    └── schema.sql           # Database schema
```

## Getting Started

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Enable Email/Password auth in Authentication > Providers
4. Get your API keys from Settings > API

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
DEBUG=true
ALLOWED_ORIGINS=http://localhost:3000
EOF

# Run the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` with docs at `/docs`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF

# Run the dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

## API Endpoints

### Workspaces
- `GET /api/v1/workspaces` - List all workspaces
- `POST /api/v1/workspaces` - Create workspace
- `PUT /api/v1/workspaces/{id}` - Update workspace
- `DELETE /api/v1/workspaces/{id}` - Delete workspace

### Tasks
- `GET /api/v1/workspaces/{id}/tasks` - List tasks in workspace
- `POST /api/v1/workspaces/{id}/tasks` - Create task
- `PUT /api/v1/tasks/{id}` - Update task
- `PATCH /api/v1/tasks/{id}/toggle` - Toggle task done
- `DELETE /api/v1/tasks/{id}` - Delete task

### Notes
- `GET /api/v1/workspaces/{id}/notes` - List notes in workspace
- `POST /api/v1/workspaces/{id}/notes` - Create note
- `PUT /api/v1/notes/{id}` - Update note
- `DELETE /api/v1/notes/{id}` - Delete note

All endpoints require authentication via Bearer token (Supabase JWT).

## Features

- **Workspaces**: Create project-specific spaces
- **Tasks**: Quick todos with priorities (none, low, medium, high)
- **Notes**: Titled notes with content and tags
- **Auth**: Secure authentication via Supabase
- **RLS**: Row-level security ensures users only see their own data

## Future Plans

- Real-time updates with Supabase subscriptions
- Drag-and-drop task reordering
- Markdown support for notes
- Search across workspaces
- Dark/light theme toggle
- Mobile app

## License

Apache License 2.0 - see [LICENSE](LICENSE)

## Author

- [Noxire-Hash](https://github.com/Noxire-Hash)
