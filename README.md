# 🚀 Noteflow

Noteflow is a full-stack note management application designed to organize notes efficiently using folders, tags, and search. It is built with a modern web stack and structured for scalability, maintainability, and deployment readiness.

---

# ✨ Features

- User authentication system  
- Create, update, delete notes  
- Organize notes using folders and tags  
- Search functionality for quick access  
- API-driven architecture  
- Structured backend using Prisma ORM  

---

# 🧠 Tech Stack

## Frontend & Backend
- Next.js (App Router + API routes)  
- TypeScript  

## Database
- PostgreSQL  
- Prisma ORM  

## Tooling
- ESLint  
- npm  

## DevOps
- Docker (containerization)  

---

# 🏗️ Architecture Overview

The application follows a full-stack architecture:

- Frontend (Next.js) handles UI and routing  
- API routes act as backend endpoints  
- Prisma ORM manages database interactions  
- PostgreSQL stores application data  

Flow:
Client → Next.js → API Routes → Prisma → PostgreSQL

---

# 📁 Project Structure

app/            → Application routes & API endpoints  
components/     → Reusable UI components  
lib/            → Utility functions and helpers  
prisma/         → Database schema and migrations  
public/         → Static assets  

---

# ⚙️ Getting Started

## 1. Clone the repository
```bash
git clone https://github.com/AbinNazer/noteflow.git
cd noteflow
```

## 2. Install dependencies
```bash
npm install
```

## 3. Setup environment variables
Create a `.env` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/noteflow"
```

## 4. Setup database
```bash
npm run db:generate
npm run db:migrate
```

## 5. Run development server
```bash
npm run dev
```

App will run at:
http://localhost:3000

---

# 🗄️ Database Setup (PostgreSQL)

Make sure PostgreSQL is installed and running.

Create database:
```sql
CREATE DATABASE noteflow;
```

Update `.env` with correct credentials, then run migrations.

---

# 🐳 Docker Usage

Build and run the application using Docker:

```bash
docker build -t noteflow .
docker run -p 3000:3000 noteflow
```

For full setup, use Docker with PostgreSQL (recommended via docker-compose).

---

# 🔌 API Overview

- /api/auth/* → authentication  
- /api/notes → notes CRUD  
- /api/folders → folder management  
- /api/tags → tag management  
- /api/search → search functionality  

---

# 🚧 Future Improvements

- Add role-based access control  
- Improve search with indexing  
- Add caching layer (Redis)  
- CI/CD pipeline integration  
- Deployment to cloud (AWS / VPS)  

---

# 📄 License

This project is licensed under the MIT License.


