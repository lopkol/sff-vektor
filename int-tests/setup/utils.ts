export function clearEnv() {
  // Delete loaded env variables
  Object.keys(Deno.env.toObject()).forEach((key) => {
    Deno.env.delete(key);
  });
}
