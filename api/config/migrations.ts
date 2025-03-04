import { resolveBinary } from "dbmate";

export async function runDbmate(comand: string, args: string[] = []) {
  const command = new Deno.Command(resolveBinary(), {
    args: [
      "--url",
      Deno.env.get("DATABASE_URL")!,
      "--migrations-dir",
      "./migrations",
      "--schema-file",
      "./migrations/schema.sql",
      comand,
      ...args,
    ],
    stdin: "piped",
    stdout: "piped",
  });
  const process = command.spawn();
  await process.stdin.close();
  const result = await process.output();
  console.log(new TextDecoder().decode(result.stdout));
}
