import crypto from "node:crypto";
import { Buffer } from "node:buffer"

const dataEncryptionAlgorithm = 'aes256';
const keyLengthInBytes = 16;
const dataEncryptionSalt = '7m1xTkRGV9zBF';
const initializationVectorLength = 16;
const emailHashLength = 64;

let dataEncryptionKey: string;

function scrypt(val: string, salt:string, length: number): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(val, salt, length, {}, (error, result) => {
    if (error) {
      return reject(error);
    }
    resolve(result.toString('hex'));
    });
  });
}

async function getDataEncryptionKey(): Promise<string> {
  if (!dataEncryptionKey) {
    dataEncryptionKey = await scrypt(
      Deno.env.get('DATA_ENCRYPTION_KEY') || '',
      dataEncryptionSalt,
      keyLengthInBytes
    );
  }

  return dataEncryptionKey;
}

export function hashEmail(email: string): Promise<string> {
  return scrypt(email, Deno.env.get('EMAIL_SALT') || '', emailHashLength);
}

export async function encrypt(data: string): Promise<string> {
  const initializationVector = await crypto.randomBytes(initializationVectorLength);
  const encryptionKey = await getDataEncryptionKey();
  const cipher = crypto.createCipheriv(
    dataEncryptionAlgorithm,
    encryptionKey,
    initializationVector
  );

  let encryptedData = cipher.update(data, 'utf8', 'hex');
  encryptedData += cipher.final('hex');

  return `${encryptedData}_${initializationVector.toString('hex')}`;
}

export async function decrypt(encryptedData: string): Promise<string> {
  const [cypherText, initializationVectorAsString] = encryptedData.split('_');
  const initializationVector = Buffer.from(initializationVectorAsString, 'hex');
  const encryptionKey = await getDataEncryptionKey();
  const decipher = crypto.createDecipheriv(
    dataEncryptionAlgorithm,
    encryptionKey,
    initializationVector
  );

  let data = decipher.update(cypherText, 'hex', 'utf8');
  data += decipher.final('utf8');

  return data;
}
