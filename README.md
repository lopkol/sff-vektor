# SFFVektor

## Getting started

### Requirements:

- Linux distribution recommended
- You need Docker installed (or PostgreSQL installed if you're that kind of
  person)
- Deno installed locally:
  https://docs.deno.com/runtime/getting_started/installation/

### To run the project locally:

At the root of the repository:
1. Run `docker compose up -d` to start local backend services
2. Run `deno install` to resolve Deno dependencies
3. Run `deno task api:dev` to serve the API in watch mode
4. Run `deno task scheduler:dev` to run the scheduler in watch mode
5. Run `deno task all:test` to run all the tests
6. Run `deno task cleanup` to format and lint the code
7. Run `deno task migration [OPTIONS] [COMMAND]` to run migrations
  - `deno task migration new [label]`: create a new timestamped migration file under `api/migrations/`
  - `deno task migration up`: run the migration (API also runs migration automatically on startup if `DATABASE_RUN_MIGRATIONS=true`, enabled by default)
  - `deno task migration down`: revert the last migration

For the frontend, you have to go in the `frontend/` folder:
1. Run `npm i` to install dependencies
2. Run `npm run dev` to start dev environment


### Env files explained:

There are 2 levels of environment files:

- The root `.env` file: variables shared accross all projects (api & scheduler)
- Project level `.env` file: variables only available for the related project

The `.env` files are versionned so no sensible information should be put there
(only default values). You can create a `.env.local` next to any `.env` file to
customize the environment variables for your local (files not ignored by git).

Variables in a `.env.local` always takes precedence over sibling `.env` file.
Project level env files always take precedence over root level env files.


## Libraries used in this project

### Backend
* Hono (web framework): https://hono.dev/docs/getting-started/basic
* Slonik (PostgreSQL typed native queries): https://github.com/gajus/slonik?tab=readme-ov-file#documentation
* Zod (validation): https://zod.dev/
* dbmate (database migrations): https://github.com/amacneil/dbmate

Hono and Slonik are both using Zod, respectfully for validation and typing.

### Frontend
* NextJS (React fullstack framework): https://nextjs.org/docs/app/getting-started/layouts-and-pages
* Radix UI (UI components library): https://www.radix-ui.com/themes/docs/overview/getting-started
  * For extra components, you can use ShadCN website to get ready to go components: https://ui.shadcn.com/ (it uses Radix UI)

<!-- Sylvain's tasks:
// TODO: build infra with Pulumi
-->
