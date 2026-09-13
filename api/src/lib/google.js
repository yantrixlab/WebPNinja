import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google Identity Services ID token and returns the profile.
 * Throws if the token is invalid, expired, or issued for a different client.
 */
export async function verifyGoogleIdToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return {
    googleSub: payload.sub,
    email: payload.email,
    name: payload.name ?? null,
    avatarUrl: payload.picture ?? null,
  };
}
