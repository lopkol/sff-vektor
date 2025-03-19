import { OAuth2Client, type TokenPayload } from "google-auth-library";

let client: OAuth2Client | undefined;

function getOrCreateClient() {
  if (!client) {
    client = new OAuth2Client(
      Deno.env.get("GOOGLE_CLIENT_ID"),
      Deno.env.get("GOOGLE_CLIENT_SECRET")
    );
  }
  return client;
}

export type GoogleUserTokenInfo = Pick<
  TokenPayload,
  "email" | "email_verified" | "name" | "picture" | "given_name" | "family_name"
>;

export async function verifyGoogleToken(
  token: string
): Promise<GoogleUserTokenInfo | undefined> {
  const verifiedToken = await getOrCreateClient().verifyIdToken({
    idToken: token,
  });
  return verifiedToken.getPayload();
}
