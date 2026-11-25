"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { Button } from "@/components/ui/button";
import LoaderUI from "@/components/LoaderUI";
import MeetingRoom from "@/components/MeetingRoom";
import MeetingSetup from "@/components/MeetingSetup";
import useGetCallById from "@/hooks/useGetCallById";

export default function TestInterviewPageClient({ id }: { id: string }) {
  const { isLoaded } = useUser();
  const { call, isCallLoading, lookupError, retry } = useGetCallById(id);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  if (!isLoaded || isCallLoading) return <LoaderUI />;

  if (!call) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-xl font-semibold">
          {lookupError ?? "Test interview room not found"}
        </p>
        <Button type="button" variant="outline" onClick={retry}>
          Try to reconnect
        </Button>
      </div>
    );
  }

  return (
    <StreamCall call={call}>
      <StreamTheme>
        {!isSetupComplete ? (
          <MeetingSetup onSetupComplete={async () => setIsSetupComplete(true)} />
        ) : (
          <MeetingRoom callId={call.id} testMode />
        )}
      </StreamTheme>
    </StreamCall>
  );
}
