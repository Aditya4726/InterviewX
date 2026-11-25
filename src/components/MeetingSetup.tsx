import { DeviceSettings, useCall, VideoPreview } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { Card } from "./ui/Card";
import {
  AlertCircleIcon,
  CameraIcon,
  Loader2Icon,
  MicIcon,
  SettingsIcon,
  VideoIcon,
} from "lucide-react";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";

function MeetingSetup({
  onSetupComplete,
}: {
  onSetupComplete: () => Promise<void>;
}) {
  const [isCameraDisabled, setIsCameraDisabled] = useState(true);
  const [isMicDisabled, setIsMicDisabled] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string>();
  const [deviceError, setDeviceError] = useState<string>();

  const call = useCall();

  const toggleCamera = async (enabled: boolean) => {
    if (!call) return;

    setDeviceError(undefined);
    try {
      if (enabled) await call.camera.enable();
      else await call.camera.disable();
      setIsCameraDisabled(!enabled);
    } catch (error) {
      console.error("Unable to update the camera:", error);
      setDeviceError(getDeviceErrorMessage("camera", error));
    }
  };

  const toggleMicrophone = async (enabled: boolean) => {
    if (!call) return;

    setDeviceError(undefined);
    try {
      if (enabled) await call.microphone.enable();
      else await call.microphone.disable();
      setIsMicDisabled(!enabled);
    } catch (error) {
      console.error("Unable to update the microphone:", error);
      setDeviceError(getDeviceErrorMessage("microphone", error));
    }
  };

  const handleJoin = async () => {
    if (!call || isJoining) return;

    setIsJoining(true);
    setJoinError(undefined);
    try {
      await call.join();
      await onSetupComplete();
    } catch (error) {
      console.error("Unable to join the interview call:", error);
      try {
        await call.leave();
      } catch (leaveError) {
        console.error("Unable to leave after a failed interview join:", leaveError);
      }
      setJoinError("We couldn't join the meeting. Check your connection and try again.");
    } finally {
      setIsJoining(false);
    }
  };

  if (!call) return null;

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-muted/20 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">InterviewX meeting room</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Get ready to join
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Check your camera and microphone before entering the interview.
          </p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">Camera preview</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your video is private until you join.
                </p>
              </div>
              <VideoIcon className="size-5 text-muted-foreground" />
            </div>

            <div className="relative aspect-video min-h-56 bg-slate-950 sm:min-h-80">
              <VideoPreview className="absolute inset-0 h-full w-full" />
              {isCameraDisabled && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center bg-slate-950/90 text-sm text-white/80">
                  Camera is off
                </div>
              )}
              <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                You
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <SettingsIcon className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">Audio & video</h2>
                <p className="text-sm text-muted-foreground">Choose your devices</p>
              </div>
            </div>

            <div className="divide-y">
              <div className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <CameraIcon className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Camera</p>
                    <p className="text-xs text-muted-foreground">
                      {isCameraDisabled ? "Off" : "On"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={!isCameraDisabled}
                  aria-label="Toggle camera"
                  onCheckedChange={(checked: boolean) => void toggleCamera(checked)}
                />
              </div>

              <div className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <MicIcon className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Microphone</p>
                    <p className="text-xs text-muted-foreground">
                      {isMicDisabled ? "Off" : "On"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={!isMicDisabled}
                  aria-label="Toggle microphone"
                  onCheckedChange={(checked: boolean) =>
                    void toggleMicrophone(checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <SettingsIcon className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Devices</p>
                    <p className="text-xs text-muted-foreground">
                      Camera, microphone and speaker
                    </p>
                  </div>
                </div>
                <DeviceSettings />
              </div>
            </div>

            {joinError && (
              <div
                role="alert"
                className="mt-2 flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}
            {deviceError && (
              <div
                role="alert"
                className="mt-2 flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                <span>{deviceError}</span>
              </div>
            )}

            <Button
              className="mt-5 w-full"
              size="lg"
              onClick={handleJoin}
              disabled={isJoining}
            >
              {isJoining && <Loader2Icon className="size-4 animate-spin" />}
              {isJoining ? "Joining..." : "Join meeting"}
            </Button>
          </Card>
        </div>
      </div>
    </main>
  );
}

function getDeviceErrorMessage(device: "camera" | "microphone", error: unknown) {
  const errorName =
    typeof error === "object" && error !== null && "name" in error
      ? String(error.name)
      : "";

  if (
    errorName === "NotAllowedError" ||
    errorName === "PermissionDeniedError" ||
    (error instanceof Error && error.message.toLowerCase().includes("permission"))
  ) {
    return `Browser access to your ${device} is blocked. Allow it in this site's browser permissions, then try again.`;
  }

  return `We couldn't access your ${device}. Check that it's connected and not being used by another app.`;
}

export default MeetingSetup;