import { assertEquals } from "@std/assert";
import { decrypt, encrypt, hashEmail } from "@/helpers/crypto.ts";
import { beforeAll, describe, it } from "@std/testing/bdd";

function randomString(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

describe("crypto functions", () => {
  beforeAll(() => {
    Deno.env.set("DATA_ENCRYPTION_KEY", "super-amazing-dev-secret");
    Deno.env.set(
      "EMAIL_SALT",
      "kbGBDGpjjCsgCoCMDzs8yrZRdkykT4NivZMqla5Wa7htHJFHkohtU7OhZhinwKesb8HcAAskEfSNg4zg1iL3iUmJgkjaJ95jjACNwdR1ipaL39rk8pUpQS6M",
    );
  });

  for (let i = 1; i < 50; i++) {
    it(`hashEmail is deterministic for string of length ${i}`, async () => {
      const email = randomString(i);
      const encryptedData = await hashEmail(email);
      const encryptedData2 = await hashEmail(email);

      assertEquals(encryptedData, encryptedData2);
    });
  }

  for (let i = 1; i < 50; i++) {
    it(`decrypt decrypts string of length ${i}`, async () => {
      const email = randomString(i);
      const encryptedData = await encrypt(email);
      const decryptedData = await decrypt(encryptedData);

      assertEquals(email, decryptedData);
    });
  }
});
