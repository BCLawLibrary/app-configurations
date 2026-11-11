// The signed-in person a route is acting for. Firebase doesn't promise a name,
// so code that shows one must decide what to show without it (usually the email).
export type CurrentUser = {
  email: string;
  name?: string;
};
