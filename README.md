<div align="center">

# <img src="logo.svg" alt="Moji" width="32" height="32" style="vertical-align: middle;" /> Moji

**A workspace-centric productivity app for developers**

*Organize your todos, notes, and pages by project — not by endless lists.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)

</div>

---

## ✨ Why Moji?

Notion is great, but sometimes you just want a **focused space** for a project — tasks on one side, notes on the other, and rich pages for documentation. No databases, no templates, no friction. Just workspaces that keep you in flow.

### 🎯 Key Features

- **📁 Workspaces** — Create project-specific spaces to organize everything
- **✅ Tasks** — Quick todos with priorities (none, low, medium, high)
- **📝 Notes** — Titled notes with content and tags for quick reference
- **📄 Pages** — Rich text pages for detailed documentation within workspaces
- **🎨 Themes** — Multiple beautiful themes including Japanese Pastel
- **🔐 Authentication** — Secure auth via Supabase with row-level security
- **📱 Responsive** — Works beautifully on desktop and mobile
- **🎭 Demo Mode** — Try the app without signing up

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** — Modern, fast Python web framework
- **Supabase** — PostgreSQL database with real-time capabilities
- **Pydantic** — Data validation and settings management
- **Python-JOSE** — JWT authentication

### Frontend
- **Next.js 14** — React framework with App Router
- **TypeScript** — Type-safe development
- **Tailwind CSS** — Utility-first styling
- **Radix UI** — Accessible component primitives
- **SWR** — Data fetching and caching
- **Sonner** — Beautiful toast notifications

### Infrastructure
- **Supabase** — Database, authentication, and storage
- **PostgreSQL** — Relational database with RLS

---

## 📁 Project Structure

```
moji/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── config.py        # Settings and environment variables
│   │   ├── dependencies.py  # Auth and Supabase clients
│   │   ├── models/          # Pydantic schemas
│   │   │   ├── workspace.py
│   │   │   ├── task.py
│   │   │   ├── note.py
│   │   │   └── page.py
│   │   └── routes/          # API endpoints
│   │       ├── workspaces.py
│   │       ├── tasks.py
│   │       ├── notes.py
│   │       └── pages.py
│   └── requirements.txt
├── frontend/
│   ├── app/                 # Next.js pages (App Router)
│   │   ├── page.tsx         # Dashboard
│   │   ├── login/
│   │   ├── profile/
│   │   ├── settings/
│   │   └── workspaces/
│   │       └── [id]/
│   │           ├── page.tsx # Workspace detail
│   │           └── pages/
│   │               └── [pageId]/
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── Sidebar.tsx
│   │   ├── TaskList.tsx
│   │   ├── NoteList.tsx
│   │   ├── PageEditor.tsx
│   │   └── ...
│   └── lib/                 # Utilities
│       ├── api.ts           # API client
│       ├── supabase.ts      # Supabase client
│       ├── themes.ts        # Theme system
│       └── hooks.ts
└── supabase/
    ├── schema.sql           # Database schema
    └── add_pages.sql        # Pages table migration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **Supabase account** (free tier works)

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Run `supabase/add_pages.sql` to add the pages table
4. Enable **Email/Password** auth in **Authentication > Providers**
5. Get your API keys from **Settings > API**:
   - Project URL
   - `anon` key (public)
   - `service_role` key (secret, backend only)

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

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

The API will be available at `http://localhost:8000` with interactive docs at `/docs`.

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

---

## 📡 API Endpoints

All endpoints require authentication via Bearer token (Supabase JWT) in the `Authorization` header.

### Workspaces

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/workspaces` | List all workspaces |
| `POST` | `/api/v1/workspaces` | Create workspace |
| `PUT` | `/api/v1/workspaces/{id}` | Update workspace |
| `DELETE` | `/api/v1/workspaces/{id}` | Delete workspace |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/workspaces/{id}/tasks` | List tasks in workspace |
| `POST` | `/api/v1/workspaces/{id}/tasks` | Create task |
| `PUT` | `/api/v1/tasks/{id}` | Update task |
| `PATCH` | `/api/v1/tasks/{id}/toggle` | Toggle task completion |
| `DELETE` | `/api/v1/tasks/{id}` | Delete task |

### Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/workspaces/{id}/notes` | List notes in workspace |
| `POST` | `/api/v1/workspaces/{id}/notes` | Create note |
| `PUT` | `/api/v1/notes/{id}` | Update note |
| `DELETE` | `/api/v1/notes/{id}` | Delete note |

### Pages

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/workspaces/{id}/pages` | List pages in workspace |
| `POST` | `/api/v1/workspaces/{id}/pages` | Create page |
| `GET` | `/api/v1/pages/{id}` | Get specific page |
| `PUT` | `/api/v1/pages/{id}` | Update page |
| `DELETE` | `/api/v1/pages/{id}` | Delete page |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API status |
| `GET` | `/health` | Detailed health check |

---

## 🎨 Features in Detail

### Workspaces
Create project-specific spaces to organize your work. Each workspace contains its own tasks, notes, and pages.

### Tasks
- Quick todos with content
- Priority levels: none, low, medium, high
- Toggle completion status
- Organized by workspace

### Notes
- Titled notes with rich content
- Tag support for organization
- Quick access from workspace sidebar

### Pages
- Rich text pages for detailed documentation
- Full-page editor with auto-save
- Organized within workspaces
- Perfect for project documentation

### Themes
- **Default** — Clean dark theme with blue accents
- **Japanese Pastel** — Soft lavender and sakura tones with paper texture
- More themes coming soon!

### Security
- Row-level security (RLS) ensures users only see their own data
- JWT-based authentication via Supabase
- Secure API endpoints with user verification

---

## 🔮 Future Plans

- [ ] Real-time updates with Supabase subscriptions
- [ ] Drag-and-drop task reordering
- [ ] Markdown support for notes and pages
- [ ] Search across workspaces
- [ ] More theme options
- [ ] Mobile app (React Native)
- [ ] Workspace sharing and collaboration
- [ ] Export/import functionality

---

## 📄 License

This project is licensed under the Apache License 2.0 — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Noxire-Hash**

- GitHub: [@Noxire-Hash](https://github.com/Noxire-Hash)

---

<div align="center">

**Built with ❤️ using FastAPI, Next.js, and Supabase**

</div>
