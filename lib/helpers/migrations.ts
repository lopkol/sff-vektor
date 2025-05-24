import { resolveBinary } from "dbmate";
import * as path from "jsr:@std/path";
import { logger } from "@sffvektor/lib";

const migrationDirectory = getMigrationDir();

function getMigrationDir() {
  const MIGRATION_DIR = "migrations";
  const currentWorkingDir = Deno.cwd();
  if (currentWorkingDir.endsWith("/api")) {
    return path.join(".", MIGRATION_DIR);
  }
  return path.join("..", "api", MIGRATION_DIR);
}

export async function runDbmate(cmd: string, args: string[] = []) {
  const command = new Deno.Command(resolveBinary(), {
    args: [
      "--url",
      Deno.env.get("DATABASE_URL")!,
      "--migrations-dir",
      migrationDirectory,
      "--schema-file",
      path.join(migrationDirectory, "schema.sql"),
      ...args,
      cmd,
    ],
    stdin: "piped",
    stdout: "piped",
  });
  const process = command.spawn();
  await process.stdin.close();
  const result = await process.output();
  // TODO: improve log so it can be disabled if needed
  const stdout = new TextDecoder().decode(result.stdout).replace(
    /^\s+|\s+$/g,
    "",
  );
  if (stdout) {
    logger.debug(
      stdout,
    );
  }
}
