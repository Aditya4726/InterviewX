import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import toast from "react-hot-toast";

function EndCallButton({ testMode = false }: { testMode?: boolean }) {
  const call = useCall();
  const router = useRouter();
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const updateInterviewStatus = useMutation(api.interviews.updateInterviewStatus);

  const interview = useQuery(
    api.interviews.getInterviewByStreamCallId,
    call && !testMode ? { streamCallId: call.id } : "skip"
  );

  if (!call || (!testMode && !interview)) return null;

  const isMeetingOwner = localParticipant?.userId === call.state.createdBy?.id;

  if (!isMeetingOwner) return null;

  const endCall = async () => {
    try {
      await call.endCall();

      if (!testMode && interview) {
        await updateInterviewStatus({
          id: interview._id,
          status: "completed",
        });
      }

      router.push("/dashboard");
      toast.success(
        testMode ? "Test interview ended for everyone" : "Meeting ended for everyone"
      );
    } catch (error) {
      console.log(error);
      toast.error("Failed to end meeting");
    }
  };

  return (
    <Button variant={"destructive"} onClick={endCall}>
      End Meeting
    </Button>
  );
}
export default EndCallButton;