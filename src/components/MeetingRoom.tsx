import {
  CallControls,
  CallingState,
  CallParticipantsList,
  PaginatedGridLayout,
  SpeakerLayout,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import {
  ArrowLeftIcon,
  Code2Icon,
  Columns2Icon,
  HistoryIcon,
  LayoutListIcon,
  LoaderIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUserRole } from "@/hooks/useUserRole";
import type { GroupImperativeHandle } from "react-resizable-panels";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import EndCallButton from "./EndCallButton";
import CodeEditor from "./CodeEditor";

function MeetingRoom({
  callId,
  testMode = false,
}: {
  callId: string;
  testMode?: boolean;
}) {
  const router = useRouter();
  const [layout, setLayout] = useState<"grid" | "speaker">("speaker");
  const [showParticipants, setShowParticipants] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [panelPreset, setPanelPreset] = useState<"video" | "balanced" | "code">(
    "balanced"
  );
  const panelGroupRef = useRef<GroupImperativeHandle | null>(null);
  const { useCallCallingState, useCallEndedAt } = useCallStateHooks();

  const callingState = useCallCallingState();
  const endedAt = useCallEndedAt();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);

    updateIsMobile();
    mediaQuery.addEventListener("change", updateIsMobile);
    return () => mediaQuery.removeEventListener("change", updateIsMobile);
  }, []);

  const resizePanels = (preset: "video" | "balanced" | "code") => {
    const videoSize = isMobile
      ? { video: 65, balanced: 50, code: 35 }[preset]
      : { video: 62, balanced: 45, code: 30 }[preset];

    panelGroupRef.current?.setLayout({
      "meeting-video": videoSize,
      "meeting-editor": 100 - videoSize,
    });
    setPanelPreset(preset);
  };

  if (endedAt) {
    return <InterviewEndedScreen testMode={testMode} />;
  }

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center">
        <LoaderIcon className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-4rem-1px)] min-h-0 flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-background px-3 py-2 sm:px-5">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold sm:text-base">
            {testMode ? "Test interview room" : "Interview room"}
          </h1>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {testMode
              ? "Practice together; this session is not added to interview history."
              : "Drag the divider or choose a panel size"}
          </p>
        </div>
        <div className="flex items-center gap-1.5" aria-label="Panel sizing">
          <Button
            type="button"
            size="sm"
            variant={panelPreset === "video" ? "default" : "outline"}
            aria-label="Give video more space"
            aria-pressed={panelPreset === "video"}
            title="Give video more space"
            onClick={() => resizePanels("video")}
          >
            <VideoIcon className="size-4" />
            <span className="hidden sm:inline">Video</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={panelPreset === "balanced" ? "default" : "outline"}
            aria-label="Use balanced panel sizes"
            aria-pressed={panelPreset === "balanced"}
            title="Use balanced panel sizes"
            onClick={() => resizePanels("balanced")}
          >
            <Columns2Icon className="size-4" />
            <span className="hidden sm:inline">Balanced</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={panelPreset === "code" ? "default" : "outline"}
            aria-label="Give code editor more space"
            aria-pressed={panelPreset === "code"}
            title="Give code editor more space"
            onClick={() => resizePanels("code")}
          >
            <Code2Icon className="size-4" />
            <span className="hidden sm:inline">Code</span>
          </Button>
        </div>
      </header>

      <ResizablePanelGroup
        groupRef={panelGroupRef}
        orientation={isMobile ? "vertical" : "horizontal"}
        className="h-auto min-h-0 flex-1"
      >
        <ResizablePanel
          id="meeting-video"
          defaultSize={isMobile ? "50" : "45"}
          minSize={isMobile ? "25" : "20"}
          maxSize="75"
          className="relative min-h-0"
        >
          {/* VIDEO LAYOUT */}
          <div className="absolute inset-0">
            {layout === "grid" ? <PaginatedGridLayout /> : <SpeakerLayout />}

            {/* PARTICIPANTS LIST OVERLAY */}
            {showParticipants && (
              <div className="absolute right-0 top-0 z-10 h-full w-full max-w-80 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <CallParticipantsList onClose={() => setShowParticipants(false)} />
              </div>
            )}
          </div>

          {/* VIDEO CONTROLS */}

          <div className="absolute bottom-4 left-0 right-0 z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 flex-wrap justify-center px-4">
                <CallControls onLeave={() => router.push("/dashboard")} />

                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-10"
                          aria-label="Change video layout"
                        >
                          <LayoutListIcon className="size-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setLayout("grid")}>
                        Grid View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLayout("speaker")}>
                        Speaker View
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="outline"
                    size="icon"
                    className="size-10"
                    aria-label="Toggle participant list"
                    aria-pressed={showParticipants}
                    onClick={() => setShowParticipants(!showParticipants)}
                  >
                    <UsersIcon className="size-4" />
                  </Button>

                  <EndCallButton testMode={testMode} />
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle
          withHandle
          aria-label="Resize video and code panels"
          className="z-10 w-2 cursor-col-resize touch-none bg-border/70 transition-colors hover:bg-primary/30 data-[group-direction=vertical]:h-2 data-[group-direction=vertical]:w-full data-[group-direction=vertical]:cursor-row-resize"
        />

        <ResizablePanel
          id="meeting-editor"
          defaultSize={isMobile ? "50" : "55"}
          minSize="25"
          className="min-h-0"
        >
          <CodeEditor callId={callId} testMode={testMode} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function InterviewEndedScreen({ testMode }: { testMode: boolean }) {
  const router = useRouter();
  const { isCandidate } = useUserRole();
  const call = useCall();
  const interview = useQuery(
    api.interviews.getInterviewByStreamCallId,
    call && !testMode ? { streamCallId: call.id } : "skip"
  );
  const outcome = interview?.outcome ?? "pending";
  const outcomeLabel =
    outcome === "selected"
      ? "Selected"
      : outcome === "rejected"
        ? "Rejected"
        : "Pending";

  return (
    <main className="grid min-h-[calc(100dvh-4rem)] place-items-center bg-muted/20 px-4 py-10">
      <section
        className="w-full max-w-xl rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-10"
        aria-live="polite"
      >
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
          <VideoIcon className="size-7" />
        </div>
        <p className="text-sm font-semibold text-primary">
          {testMode ? "Test interview" : "InterviewX"}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {testMode ? "Test interview ended" : "Interview ended"}
        </h1>

        {isCandidate ? (
          <>
            <p className="mt-4 text-muted-foreground">
              Thanks for joining the interview. We appreciate your time.
            </p>
            {testMode ? (
              <p className="mt-2 text-sm text-muted-foreground">
                This was a practice session, so it won&apos;t appear in your
                interview history.
              </p>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Your interviewer&apos;s decision will appear in your interview
                  history.
                </p>
                {interview && (
                  <Badge
                    variant={
                      outcome === "selected"
                        ? "default"
                        : outcome === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    Your status: {outcomeLabel}
                  </Badge>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="mt-4 text-muted-foreground">
            {testMode
              ? "The practice session has ended."
              : "The interview has ended. The candidate can see their outcome in interview history."}
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {!testMode && isCandidate && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/recordings")}
            >
              <HistoryIcon className="size-4" />
              View interview history
            </Button>
          )}
          <Button type="button" onClick={() => router.push("/dashboard")}>
            <ArrowLeftIcon className="size-4" />
            Main page
          </Button>
        </div>
      </section>
    </main>
  );
}

export default MeetingRoom;