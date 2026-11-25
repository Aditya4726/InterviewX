import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import useMeetingActions from "@/hooks/useMeetingActions";
import { useState } from "react";
import { LoaderCircleIcon } from "lucide-react";

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isJoinMeeting: boolean;
}

function MeetingModal({ isOpen, onClose, title, isJoinMeeting }: MeetingModalProps) {
  const [meetingUrl, setMeetingUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [interviewName, setInterviewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { createInstantMeeting, joinMeeting } = useMeetingActions();

  const handleStart = async () => {
    if (isJoinMeeting) {
      const meetingId = getMeetingId(meetingUrl);
      if (!meetingId) {
        setLinkError("Enter a meeting ID or a link ending in /meeting/{id}.");
        return;
      }

      joinMeeting(meetingId);
      setMeetingUrl("");
      setLinkError("");
      onClose();
    } else {
      if (!interviewName.trim()) {
        setLinkError("Enter a name for this interview.");
        return;
      }

      setIsCreating(true);
      const created = await createInstantMeeting(interviewName);
      setIsCreating(false);
      if (!created) return;
      setInterviewName("");
      setLinkError("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {!isJoinMeeting && (
            <Input
              placeholder="Interview name, e.g. Frontend Engineer"
              value={interviewName}
              maxLength={120}
              onChange={(e) => {
                setInterviewName(e.target.value);
                setLinkError("");
              }}
              aria-label="Interview name"
            />
          )}
          {isJoinMeeting && (
            <Input
              placeholder="Paste meeting link here..."
              value={meetingUrl}
              onChange={(e) => {
                setMeetingUrl(e.target.value);
                setLinkError("");
              }}
            />
          )}
          {linkError && (
            <p role="alert" className="text-sm text-destructive">
              {linkError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleStart()}
              disabled={
                isCreating ||
                (isJoinMeeting
                  ? !meetingUrl.trim()
                  : !interviewName.trim())
              }
            >
              {isCreating && <LoaderCircleIcon className="size-4 animate-spin" />}
              {isCreating
                ? "Creating..."
                : isJoinMeeting
                  ? "Join Meeting"
                  : "Start Meeting"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getMeetingId(value: string) {
  const input = value.trim();
  if (!input) return "";

  try {
    const url = new URL(input, window.location.origin);
    const segments = url.pathname.split("/").filter(Boolean);
    const meetingIndex = segments.lastIndexOf("meeting");
    const id = meetingIndex >= 0 ? segments[meetingIndex + 1] : segments.at(-1);
    return id ? decodeURIComponent(id) : "";
  } catch {
    return input.includes("/") ? "" : input;
  }
}

export default MeetingModal;