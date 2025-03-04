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
* Hono (web framework): https://hono.dev/docs/getting-started/basic
* Slonik (PostgreSQL typed native queries): https://github.com/gajus/slonik?tab=readme-ov-file#documentation
* Zod (validation): https://zod.dev/

Hono and Slonik are both using Zod, respectfully for validation and typing.

<!-- Sylvain's tasks:
// TODO: 1. add migrations
// TODO: 2. build infra with Pulumi
-->
