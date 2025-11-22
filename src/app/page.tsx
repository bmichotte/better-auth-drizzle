"use client";

import { authClient } from "@/lib/auth-client";

export default function Home() {
  const session = authClient.useSession();

  console.log(session);

  async function signout() {
    authClient.signOut();
  }

  async function signin() {
    await authClient.signIn.social({
      provider: "github",
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {session.data?.user ? (
        <button type="button" onClick={signout}>
          signout
        </button>
      ) : (
        <button type="button" onClick={signin}>
          signin
        </button>
      )}
    </div>
  );
}
