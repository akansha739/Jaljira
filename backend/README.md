# Backend

This backend can run with either PostgreSQL or a local SQLite file.

Set the database URL in `backend/.env`:

```env
SQLALCHEMY_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/jaljira
```

`DATABASE_URL` is also supported if you prefer that variable name.

For quick local development without PostgreSQL, you can use:

```env
SQLALCHEMY_DATABASE_URL=sqlite:///./jaljira.db
```

Install dependencies and run the app:

```bash
uv sync
uv run uvicorn main:app --reload
```

Users now store a single `role` directly on the `users` table.
The default role is `developer`, but you can also use values like `admin` or `project_manager`.
