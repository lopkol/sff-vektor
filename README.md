# SFFVektor

## Getting started

### Requirements

- Linux distribution recommended
- You need Docker installed (or PostgreSQL installed if you're that kind of
  person)
- Deno installed locally:
  https://docs.deno.com/runtime/getting_started/installation/

### To run the project locally

At the root of the repository:
1. Run `docker compose up -d` to start local backend services
2. Run `deno install` to resolve Deno dependencies
3. Create a new file `api/.env.local`
    - add required env variables: `DEFAULT_ADMIN_EMAIL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
4. Create a new file `frontend/.env.local`
    - add required env variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (same as the one in `api`)
5. Run `deno task api:dev` to serve the API in watch mode
6. Run `deno task scheduler:dev` to run the scheduler in watch mode
7. Run `deno task all:test` to run all the tests
8. Run `deno task cleanup` to format and lint the code
9. Run `deno task migration [OPTIONS] [COMMAND]` to run migrations
  - `deno task migration new [label]`: create a new timestamped migration file under `api/migrations/`
  - `deno task migration up`: run the migration (API also runs migration automatically on startup if `DATABASE_RUN_MIGRATIONS=true`, enabled by default)
  - `deno task migration down`: revert the last migration

For the frontend, you have to go in the `frontend/` folder:
1. Run `npm i` to install dependencies
2. Run `npm run dev` to start dev environment

## Contribute guide

### Libraries used in this project

#### Backend
* Hono (web framework): https://hono.dev/docs/getting-started/basic
* Slonik (PostgreSQL typed native queries): https://github.com/gajus/slonik?tab=readme-ov-file#documentation
* Zod (validation): https://zod.dev/
* dbmate (database migrations): https://github.com/amacneil/dbmate

Hono and Slonik are both using Zod, respectfully for validation and typing.

#### Frontend
* NextJS (React fullstack framework): https://nextjs.org/docs/app/getting-started/layouts-and-pages
* React Query (React async state management and data fetching): https://tanstack.com/query/latest/docs/framework/react/quick-start
* Radix UI (UI components library): https://www.radix-ui.com/themes/docs/overview/getting-started
  * For extra components, you can use ShadCN website to get ready to go components: https://ui.shadcn.com/ (it uses Radix UI)
* Next-intl for internationalization (without i18n routing): https://next-intl.dev/docs/usage

### Env files explained:
There are 2 levels of environment files:

- The root `.env` file: variables shared across all projects (api & scheduler)
- Project level `.env` file: variables only available for the related project

The `.env` files are versioned so no sensible information should be stored there
(only use it for local default and non-sensible values). You can create a `.env.local` next to any `.env` file to
customize the environment variables for your local (files not ignored by git).

Variables in a `.env.local` always takes precedence over sibling `.env` file.

Project level env files always take precedence over root level env files.

> [!NOTE]
> In the case of the `frontend` project and for security reasons, only the env files under the `frontend/` folder are used.

### Internationalization (i18n)

Internationalization (aka i18n) is only available in the `frontend/` project.

Translations are stored in JSON files under `frontend/locales/`.

As of now, english translations are used as fallback for missing Hungarian translations.

`Next-intl` library uses key-based translations and comes with useful features like:
* [Variable interpolation](https://next-intl.dev/docs/usage/messages#interpolation-of-dynamic-values)
* [Pluralization](https://next-intl.dev/docs/usage/messages#cardinal-pluralization)
* [Rich text](https://next-intl.dev/docs/usage/messages#rich-text) or [HTML markup](https://next-intl.dev/docs/usage/messages#html-markup)
Check out [Next-intl documentation](https://next-intl.dev/docs/usage/messages) to know more.

Example of how to translate a React component:
```tsx
// my-component.tsx
import { useTranslations } from "next-intl";

export default function MyComponent() {
  const t = useTranslations("MyComponent");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{t("content")}</p>
        <p>{t("NestedSection.someOtherKey")}</p>
      </CardContent>
    </Card>
  );
}

// locales/en.json
{
  "MyComponent": {
    "title": "My component title",
    "description": "My component description",
    "content": "My component content",
    "NestedSection": {
      "someOtherKey": "Some other key"
    }
  }
}
```
