import { Buffer } from "node:buffer";

const dataEncryptionAlgorithm = "AES-GCM";
const dataEncryptionSalt = "7m1xTkRGV9zBF";
const initializationVectorLength = 12; // GCM mode uses 12 bytes IV

let dataEncryptionKey: CryptoKey;

async function getKeyMaterial(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"],
  );
  return keyMaterial;
}

async function deriveKey(
  keyMaterial: CryptoKey,
  salt: string,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: dataEncryptionAlgorithm, length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function getDataEncryptionKey(): Promise<CryptoKey> {
  if (!dataEncryptionKey) {
    const keyMaterial = await getKeyMaterial(
      Deno.env.get("DATA_ENCRYPTION_KEY") || "",
    );
    dataEncryptionKey = await deriveKey(keyMaterial, dataEncryptionSalt);
  }
  return dataEncryptionKey;
}

export async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email + (Deno.env.get("EMAIL_SALT") || ""));
  const hashBuffer = await crypto.subtle.digest("SHA-512", data);
  return Array.from(new Uint8Array(hashBuffer))
    .reduce((acc, b) => acc + b.toString(16).padStart(2, "0"), "");
}

export async function encrypt(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(initializationVectorLength));
  const key = await getDataEncryptionKey();

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: dataEncryptionAlgorithm,
      iv: iv,
    },
    key,
    encoder.encode(data),
  );

  const encryptedArray = new Uint8Array(encryptedBuffer);
  const encryptedHex = Array.from(encryptedArray)
    .reduce((acc, b) => acc + b.toString(16).padStart(2, "0"), "");
  const ivHex = Array.from(iv)
    .reduce((acc, b) => acc + b.toString(16).padStart(2, "0"), "");

  return `${encryptedHex}_${ivHex}`;
}

export async function decrypt(encryptedData: string): Promise<string> {
  const [encryptedHex, ivHex] = encryptedData.split("_");

  const encryptedArray = Uint8Array.from(Buffer.from(encryptedHex, "hex"));
  const iv = Uint8Array.from(Buffer.from(ivHex, "hex"));

  const key = await getDataEncryptionKey();
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: dataEncryptionAlgorithm,
      iv: iv,
    },
    key,
    encryptedArray,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
