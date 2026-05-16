## 🗄️ Prisma Database Commands

This project uses [Prisma](https://www.prisma.io/) as the ORM and `pnpm` for package management. Below are the common commands you will need during development.

### Setup & Installation

_Run these if you are setting up the project for the first time._

| Command                   | Description                                                       |
| :------------------------ | :---------------------------------------------------------------- |
| `pnpm add -D prisma`      | Installs the Prisma CLI as a dev dependency.                      |
| `pnpm add @prisma/client` | Installs the Prisma Client.                                       |
| `pnpm prisma init`        | Initializes Prisma, creating the `prisma` folder and `.env` file. |

### Daily Development Workflow

_Commands you will use regularly while coding._

| Command                | Description                                                                                               |
| :--------------------- | :-------------------------------------------------------------------------------------------------------- |
| `pnpm prisma generate` | **Crucial:** Updates the Prisma Client in `node_modules`. Run this every time you modify `schema.prisma`. |
| `pnpm prisma format`   | Auto-formats your `schema.prisma` file (fixes indentation and aligns relation fields).                    |
| `pnpm prisma studio`   | Opens the visual database editor in your browser at `http://localhost:5555`.                              |

### Database Migrations

_Commands to sync your Prisma schema with your actual database._

**Prototyping (Rapid Development)**
Use this when you are rapidly changing the schema and don't need a migration history.

```bash
# Syncs schema with database directly without creating migration files
pnpm prisma db push
```
