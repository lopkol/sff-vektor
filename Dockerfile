ARG DENO_VERSION=2.2.6

#
# Base stage
#
FROM denoland/deno:alpine-${DENO_VERSION} AS base
WORKDIR /app
COPY deno.json .
COPY deno.lock .
COPY lib lib
COPY slonik-pg-driver slonik-pg-driver
COPY .env .env
# Change ownership of the files to the deno user
RUN chown -R deno:deno /app
# Switch to the non-root user
USER deno
# Remove the int-tests from the deno.json file
RUN sed -i 's/, "int-tests"//g' deno.json

#
# API image stage
#
FROM base AS api
EXPOSE 3030
COPY api api
COPY api/.env api/.env
# Remove the scheduler from the deno.json file so it doesn't get compiled
RUN sed -i 's/, "scheduler"//g' deno.json
# Compile the apps so that it doesn't need to be compiled each startup/entry.
RUN deno task --recursive all:cache
CMD ["task", "api:prod"]

#
# Scheduler image stage
#
FROM base AS scheduler
COPY scheduler scheduler
# COPY scheduler/.env scheduler/.env
# Remove the api from the deno.json file so it doesn't get compiled
RUN sed -i 's/, "api"//g' deno.json
# Compile the apps so that it doesn't need to be compiled each startup/entry.
RUN deno task --recursive all:cache
CMD ["task", "scheduler:prod"]
