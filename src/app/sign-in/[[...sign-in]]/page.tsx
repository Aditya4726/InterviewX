import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground" role="status">
            Loading sign-in form...
          </p>
        }
      >
        <SignIn />
      </Suspense>
    </div>
  );
}
