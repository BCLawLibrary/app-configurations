import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { BC_DOMAIN } from "../../bcDomain.js";
import { firebaseAuth } from "./firebaseAuth.js";

// Opens Google sign-in, showing BC accounts first. This only narrows the
// account picker; the server is what actually turns away non-BC accounts.
export async function signIn(): Promise<void> {
  const google = new GoogleAuthProvider();
  google.setCustomParameters({ hd: BC_DOMAIN });
  await signInWithPopup(firebaseAuth(), google);
}
