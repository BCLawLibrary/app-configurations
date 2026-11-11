import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "./firebaseAuth.js";

// Returns a function that signs out and forgets every loaded result, so the
// next person on a shared computer never sees the last person's data.
export function useSignOut(): () => Promise<void> {
  const queryClient = useQueryClient();

  async function signOutAndForget() {
    await signOut(firebaseAuth());
    queryClient.clear();
  }

  return signOutAndForget;
}
