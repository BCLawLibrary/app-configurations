import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { firebaseAuth } from "./firebaseAuth.js";

type SignInState =
  | { status: "checking" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: User };

// Who is signed in, kept up to date as people sign in and out. Starts as
// "checking" while Firebase works out whether someone is already signed in.
export function useSignedInUser(): SignInState {
  const [state, setState] = useState<SignInState>({ status: "checking" });

  useEffect(() => {
    function update(user: User | null) {
      if (user) setState({ status: "signed-in", user });
      else setState({ status: "signed-out" });
    }
    const stopListening = onAuthStateChanged(firebaseAuth(), update);
    return stopListening;
  }, []);

  return state;
}
