"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { ArrowRightIcon, LoaderCircleIcon, VideoIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

export default function TestInterviewSection() {
  const router = useRouter();
  const client = useStreamVideoClient();
  const { isInterviewer } = useUserRole();
  const [roomValue, setRoomValue] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const createTestRoom = async () => {
    if (!client || isCreating) return;

    setIsCreating(true);
    try {
      const call = client.call("default", `test-${crypto.randomUUID()}`);
      await call.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),
          custom: { description: "InterviewX test interview" },
        },
      });

      const roomUrl = `${window.location.origin}/test-interview/${encodeURIComponent(call.id)}`;
      let copied = false;
      try {
        await navigator.clipboard.writeText(roomUrl);
        copied = true;
      } catch (clipboardError) {
        console.warn("Unable to copy the test room link:", clipboardError);
      }

      router.push(`/test-interview/${encodeURIComponent(call.id)}`);
      toast.success(
        copied
          ? "Test room created. Invite link copied."
          : "Test room created. Share its URL from your browser."
      );
    } catch (createError) {
      console.error("Unable to create a test interview room:", createError);
      toast.error("Could not create a test interview room.");
    } finally {
      setIsCreating(false);
    }
  };

  const joinTestRoom = () => {
    const id = getTestRoomId(roomValue);
    if (!id) {
      setError("Enter a test interview ID or a /test-interview/{id} link.");
      return;
    }

    setError("");
    router.push(`/test-interview/${encodeURIComponent(id)}`);
  };

  return (
    <Card className="mb-8 overflow-hidden border-primary/20 bg-primary/[0.03]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <VideoIcon className="size-5" />
          </div>
          <div>
            <CardTitle>Test interview</CardTitle>
            <CardDescription className="mt-1">
              Practice in the video and coding room. Test sessions are not added
              to your InterviewX history.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {isInterviewer && (
          <Button
            type="button"
            className="shrink-0"
            onClick={() => void createTestRoom()}
            disabled={!client || isCreating}
          >
            {isCreating ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <VideoIcon className="size-4" />
            )}
            {isCreating ? "Creating room..." : "Create test room"}
          </Button>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
          <div className="min-w-0 flex-1">
            <Input
              value={roomValue}
              onChange={(event) => {
                setRoomValue(event.target.value);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") joinTestRoom();
              }}
              placeholder="Paste test room link or ID"
              aria-label="Test interview link or ID"
              aria-invalid={Boolean(error)}
            />
            {error && (
              <p role="alert" className="mt-1 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={joinTestRoom}
            disabled={!roomValue.trim()}
          >
            Join test room
            <ArrowRightIcon className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function getTestRoomId(value: string) {
  const input = value.trim();
  if (!input) return "";
  if (!input.includes("/") && !input.includes(":")) return input;

  try {
    const url = new URL(input, window.location.origin);
    const segments = url.pathname.split("/").filter(Boolean);
    const testRoomIndex = segments.lastIndexOf("test-interview");
    if (testRoomIndex < 0 || !segments[testRoomIndex + 1]) return "";
    return decodeURIComponent(segments[testRoomIndex + 1]);
  } catch {
    return "";
  }
}
