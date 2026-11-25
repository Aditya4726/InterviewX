"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

export default function SignOutPage() {
  const { signOut } = useClerk();
  const signOutStarted = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (signOutStarted.current) return;

    signOutStarted.current = true;
    void signOut({ redirectUrl: "/" }).catch((signOutError: unknown) => {
      console.error("Unable to sign out:", signOutError);
      setError("Sign out failed. Please try again.");
    });
  }, [signOut]);

  return (
    <p className="m-10" role={error ? "alert" : "status"}>
      {error || "Signing out..."}
    </p>
  );
}
