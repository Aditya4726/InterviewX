"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Show, useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation } from "convex/react";
import { LinkIcon } from "lucide-react";

import ActiveInterviewsSection from "@/components/ActiveInterviewsSection";
import ActionCard from "@/components/ActionCard";
import InterviewHistorySection from "@/components/InterviewHistorySection";
import Landing from "@/components/Landing";
import LoaderUI from "@/components/LoaderUI";
import MeetingModal from "@/components/MeetingModal";
import TestInterviewSection from "@/components/TestInterviewSection";
import { Button } from "@/components/ui/button";
import { QUICK_ACTIONS } from "@/constants";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";

export default function Home() {
  return (
    <>
      <Show when="signed-out">
        <Landing />
      </Show>
      <Show when="signed-in">
        <Dashboard />
      </Show>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                               SIGNED-IN VIEW                               */
/* -------------------------------------------------------------------------- */

function Dashboard() {
  const router = useRouter();
  const { user } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const { isCandidate, isInterviewer, isLoading } = useUserRole();

  const syncCurrentUser = useMutation(api.users.syncCurrentUser);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"start" | "join">();
  const [syncFailed, setSyncFailed] = useState(false);

  const clerkId = user?.id;
  const email = user?.primaryEmailAddress?.emailAddress;
  const name = user?.fullName ?? user?.username ?? email ?? "";
  const image = user?.imageUrl;

  // Keep the Convex user record in sync with Clerk
  useEffect(() => {
    if (!isAuthenticated || !clerkId || !email) return;

    syncCurrentUser({ name, email, image })
      .then(() => setSyncFailed(false))
      .catch((error: unknown) => {
        console.error("Unable to sync the signed-in user to Convex:", error);
        setSyncFailed(true);
      });
  }, [isAuthenticated, clerkId, email, name, image, syncCurrentUser]);

  const handleQuickAction = (title: string) => {
    switch (title) {
      case "New Call":
        setModalType("start");
        setShowModal(true);
        break;
      case "Join Interview":
        setModalType("join");
        setShowModal(true);
        break;
      default:
        router.push(`/${title.toLowerCase()}`);
    }
  };

  if (isLoading) return <LoaderUI />;

  const firstName = user?.firstName ?? "";

  return (
    <div className="container max-w-7xl mx-auto p-6">
      {/* WELCOME SECTION */}
      <div className="animate-fade-up relative mb-10 overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
        <div className="animate-blob pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="gradient-text text-4xl font-bold">
              Welcome back{firstName ? `, ${firstName}` : ""}!
            </h1>
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                isInterviewer
                  ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-600"
                  : "border-teal-500/30 bg-teal-500/10 text-teal-500"
              )}
            >
              {isInterviewer ? "Interviewer" : "Candidate"}
            </span>
          </div>
          <p className="text-muted-foreground mt-2">
            {isInterviewer
              ? "Manage your interviews and review candidates effectively"
              : "Access your upcoming interviews and preparations"}
          </p>

          {syncFailed && (
            <p
              role="alert"
              className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              We couldn&apos;t save your profile. Some features may not work
              until you refresh.
            </p>
          )}
        </div>
      </div>

      <ActiveInterviewsSection />
      <TestInterviewSection />

      {isInterviewer ? (
        <InterviewerView
          onAction={handleQuickAction}
        />
      ) : (
        <CandidateView
          onJoinByLink={() => {
            setModalType("join");
            setShowModal(true);
          }}
        />
      )}
      {isCandidate && <InterviewHistorySection embedded />}
      <MeetingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalType === "join" ? "Join Interview" : "Start Interview"}
        isJoinMeeting={modalType === "join"}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                ROLE SECTIONS                               */
/* -------------------------------------------------------------------------- */

function InterviewerView({
  onAction,
}: {
  onAction: (title: string) => void;
}) {
  return (
    <>
      <div className="animate-fade-up mb-6" style={{ animationDelay: "100ms" }}>
        <h2 className="text-2xl font-bold">Quick actions</h2>
        <p className="text-muted-foreground mt-1">
          Start a call, join one, or jump to your tools
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {QUICK_ACTIONS.map((action, i) => (
          <div
            key={action.title}
            className="animate-fade-up transition-transform duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${150 + i * 80}ms` }}
          >
            <ActionCard action={action} onClick={() => onAction(action.title)} />
          </div>
        ))}
      </div>

    </>
  );
}

function CandidateView({
  onJoinByLink,
}: {
  onJoinByLink: () => void;
}) {
  return (
    <>
      <div
        className="animate-fade-up flex items-end justify-between"
        style={{ animationDelay: "100ms" }}
      >
        <div>
          <h2 className="text-3xl font-bold">Your interview dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Review your interview outcomes and join an interview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={onJoinByLink}>
            <LinkIcon className="size-4" />
            Join with link
          </Button>
        </div>
      </div>
    </>
  );
}