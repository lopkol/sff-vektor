import { assertEquals } from "@std/assert";
import { hashEmail, encrypt, decrypt } from "./crypto.ts";

Deno.test(async function hashingIsDeterministic() {
  const email = 'unicorn@magic.com';
  const encryptedData = await hashEmail(email);
  const encryptedData2 = await hashEmail(email);

  assertEquals(encryptedData, encryptedData2);
});

Deno.test(async function encryptionIsReversible() {
  const data = 'I like rainbows';
  const encryptedData = await encrypt(data);
  const decryptedData = await decrypt(encryptedData);

  assertEquals(data, decryptedData);
});
