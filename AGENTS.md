Must-follow constraints
Statistics engine must be a standalone Python module with no FastAPI, SQLAlchemy, or HTTP imports. API routes only call into it.
Must not reimplement statistical tests. Use SciPy/statsmodels; wrap them, don’t replace them.
Must not load datasets into PostgreSQL tables. Dataset files live in the storage layer; PostgreSQL holds only metadata, access info, users, projects, and analysis history.
Must access file storage through a storage abstraction (local in MVP, S3-compatible later). Must not hardcode local paths in routes or the stats engine.
Must not change the DB schema without an Alembic migration.
Must not add AG Grid or any paid/enterprise dependency. Data View and Variable View use ReactGrid only.
Validation before finishing
Backend: pytest, plus the project’s configured lint/typecheck commands.
Frontend: tsc --noEmit, lint, and vite build.
Any new or changed analysis must have a test comparing output against known reference values (SPSS or R results).
Repo-specific conventions
The user interface, menus, dialogs, statistical output tables, charts, status bars, warnings, and generated PDF reports support both Turkish (Türkçe) and English (en) via the localization system. Standard academic statistical nomenclature must be preserved in both languages.
ReactGrid is the display/interaction layer only. Filtering, computation, variable metadata, and analysis history belong in app logic or the backend, not in grid components.
Zustand holds UI state only (active dataset, cell selection). Server data goes through TanStack Query; must not duplicate it in Zustand.
Forms use React Hook Form + Zod. Mirror validation rules in Pydantic models; keep the two in sync.
Use shadcn/ui components for menus, dialogs, dropdowns, and toolbars. Must not add another UI library.
Charts use Plotly.js only.
Variable metadata (type, measurement level, labels, missing-value codes) must be preserved on .sav import via pyreadstat and on export.
Change safety rules
Preserve API contracts (Pydantic schemas) unless a breaking change is explicitly requested; update frontend types in the same change.
Must not silently drop or coerce missing values. Follow explicit missing-value handling per analysis.
PDF reports (WeasyPrint) are rendered from HTML; change the HTML templates, not the PDF output logic.
