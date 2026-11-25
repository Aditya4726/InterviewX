"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import LoaderUI from "@/components/LoaderUI";
import MeetingRoom from "@/components/MeetingRoom";
import MeetingSetup from "@/components/MeetingSetup";
import useGetCallById from "@/hooks/useGetCallById";
import { api } from "../../../../../convex/_generated/api";

export default function MeetingPageClient({ id }: { id: string }) {
  const { isLoaded } = useUser();
  const router = useRouter();
  const { call, isCallLoading, lookupError, isRoomNotFound, retry } =
    useGetCallById(id);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const registerParticipant = useMutation(api.interviews.registerParticipant);

  const handleSetupComplete = async () => {
    if (!call) return;
    await registerParticipant({ streamCallId: call.id });
    setIsSetupComplete(true);
  };

  if (!isLoaded || isCallLoading) return <LoaderUI />;

  if (!call) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-xl font-semibold">
          {isRoomNotFound
            ? "We could not find this meeting room."
            : lookupError ?? "Meeting room not found."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button type="button" variant="outline" onClick={retry}>
            Try again
          </Button>
          <Button type="button" onClick={() => router.push("/dashboard")}>
            Go to main page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <StreamCall call={call}>
      <StreamTheme>
        {!isSetupComplete ? (
          <MeetingSetup onSetupComplete={handleSetupComplete} />
        ) : (
          <MeetingRoom callId={call.id} />
        )}
      </StreamTheme>
    </StreamCall>
  );
}
