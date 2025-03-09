import { assertEquals } from "@std/assert";
import { decrypt, encrypt, hashEmail } from "@/helpers/crypto.ts";
import { beforeAll } from "@std/testing/bdd";

beforeAll(() => {
  Deno.env.set("DATA_ENCRYPTION_KEY", "super-amazing-dev-secret");
  Deno.env.set(
    "EMAIL_SALT",
    "kbGBDGpjjCsgCoCMDzs8yrZRdkykT4NivZMqla5Wa7htHJFHkohtU7OhZhinwKesb8HcAAskEfSNg4zg1iL3iUmJgkjaJ95jjACNwdR1ipaL39rk8pUpQS6M",
  );
});

Deno.test("hashEmail is deterministic", async () => {
  const email = "unicorn@magic.com";
  const encryptedData = await hashEmail(email);
  const encryptedData2 = await hashEmail(email);

  assertEquals(encryptedData, encryptedData2);
});

Deno.test("decrypt reverses encrypt", async () => {
  const data = "I like rainbows";
  const encryptedData = await encrypt(data);
  const decryptedData = await decrypt(encryptedData);

  assertEquals(data, decryptedData);
});
