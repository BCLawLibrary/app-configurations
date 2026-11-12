// Signs in through the Auth emulator's fake Google sign-in and returns a real
// Firebase sign-in token, the same kind a browser gets. Leave out the name to
// test an account without one.
export async function signInTestUser(
  email: string,
  name?: string,
  options: { verified?: boolean; provider?: string } = {},
): Promise<string> {
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!host)
    throw new Error(
      "These tests need the Firebase emulators. Run them with: npm test",
    );

  const claims = {
    sub: `google-${email}`,
    email,
    email_verified: options.verified ?? true,
    name,
  };
  const provider = options.provider ?? "google.com";
  const postBody = `id_token=${encodeURIComponent(JSON.stringify(claims))}&providerId=${provider}`;
  const url = `http://${host}/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=fake-api-key`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      postBody,
      requestUri: "http://localhost",
      returnSecureToken: true,
    }),
  });
  const json: { idToken?: string } = await response.json();
  if (!json.idToken)
    throw new Error(`Could not sign in ${email} on the Auth emulator.`);
  return json.idToken;
}
