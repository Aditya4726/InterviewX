import { useRouter } from "next/navigation";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import toast from "react-hot-toast";

const useMeetingActions = () => {
  const router = useRouter();
  const client = useStreamVideoClient();
  const createInstantInterview = useMutation(api.interviews.createInstantInterview);

  const createInstantMeeting = async (title: string) => {
    if (!client) {
      toast.error("Video service is still connecting. Please try again.");
      return false;
    }

    const interviewTitle = title.trim();
    if (!interviewTitle || interviewTitle.length > 120) {
      toast.error("Enter an interview name of 1 to 120 characters.");
      return false;
    }

    try {
      const id = crypto.randomUUID();
      const call = client.call("default", id);

      await call.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),
          custom: {
            description: interviewTitle,
          },
        },
      });

      await createInstantInterview({
        streamCallId: call.id,
        title: interviewTitle,
      });
      router.push(`/meeting/${call.id}`);
      toast.success("Meeting Created");
      return true;
    } catch (error) {
      console.error("Unable to create the interview:", error);
      toast.error("Failed to create meeting");
      return false;
    }
  };

  const joinMeeting = (callId: string) => {
    if (!client) {
      toast.error("Video service is still connecting. Please try again.");
      return;
    }

    const meetingId = callId.trim();
    if (!meetingId) {
      toast.error("Enter a valid interview link or meeting ID.");
      return;
    }

    router.push(`/meeting/${encodeURIComponent(meetingId)}`);
  };

  return { createInstantMeeting, joinMeeting };
};

export default useMeetingActions;