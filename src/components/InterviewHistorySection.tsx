"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../convex/_generated/dataModel";
import { format } from "date-fns";
import {
  CalendarClockIcon,
  LoaderCircleIcon,
  Trash2Icon,
  UserRoundIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../convex/_generated/api";
import { useUserRole } from "@/hooks/useUserRole";
import useMeetingActions from "@/hooks/useMeetingActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import LoaderUI from "@/components/LoaderUI";
import { getMeetingStatus } from "@/lib/utils";

type InterviewOutcome = "pending" | "rejected" | "selected";

const OUTCOME_LABELS: Record<InterviewOutcome, string> = {
  pending: "Pending",
  rejected: "Rejected",
  selected: "Selected",
};

export default function InterviewHistorySection({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { isCandidate, isInterviewer, isLoading: isRoleLoading } = useUserRole();
  const interviews = useQuery(api.interviews.getMyInterviewHistory);
  const updateOutcome = useMutation(api.interviews.updateInterviewOutcome);
  const hideFromHistory = useMutation(api.interviews.hideInterviewFromMyHistory);
  const { joinMeeting } = useMeetingActions();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOutcomeChange = async (
    id: Id<"interviews">,
    outcome: InterviewOutcome
  ) => {
    setUpdatingId(String(id));
    try {
      await updateOutcome({ id, outcome });
      toast.success(`Candidate status updated to ${OUTCOME_LABELS[outcome]}.`);
    } catch (error) {
      console.error("Unable to update interview outcome:", error);
      toast.error("Could not update the candidate status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: Id<"interviews">, title: string) => {
    if (
      !window.confirm(
        `Remove "${title}" from your history? The other participant will still see it.`
      )
    ) {
      return;
    }

    setDeletingId(String(id));
    try {
      await hideFromHistory({ id });
      toast.success("Interview removed from your history.");
    } catch (error) {
      console.error("Unable to remove interview from history:", error);
      toast.error("Could not remove this interview from your history.");
    } finally {
      setDeletingId(null);
    }
  };

  if (isRoleLoading) return <LoaderUI />;

  const sectionClassName = embedded
    ? "mt-10 border-t pt-8"
    : "mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12";

  return (
    <section className={sectionClassName}>
      <header className="mb-8">
        <p className="text-sm font-semibold text-primary">InterviewX</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">
          Interview history
        </h2>
        <p className="mt-2 text-muted-foreground">
          {isInterviewer
            ? "Review your interviews and record candidate outcomes."
            : "Review your interviews and see the latest outcome from your interviewer."}
        </p>
      </header>

      {interviews === undefined ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <LoaderCircleIcon className="size-4 animate-spin" />
          Loading interview history
        </div>
      ) : interviews.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <CalendarClockIcon className="size-10 text-muted-foreground" />
            <h3 className="font-semibold">No interview history yet</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Interviews you join or host will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => {
            const outcome: InterviewOutcome = interview.outcome ?? "pending";
            const meetingStatus = getMeetingStatus(interview);
            const canDelete =
              ["completed", "failed", "succeeded"].includes(interview.status) ||
              outcome !== "pending";

            return (
              <Card key={interview._id}>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle>{interview.title}</CardTitle>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarClockIcon className="size-4" />
                      {format(
                        new Date(interview.startTime),
                        "EEE, MMM d, yyyy · h:mm a"
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        meetingStatus === "completed" ? "outline" : "secondary"
                      }
                    >
                      {meetingStatus === "live"
                        ? "Live now"
                        : meetingStatus === "upcoming"
                          ? "Upcoming"
                          : "Completed"}
                    </Badge>
                    <Badge
                      variant={
                        outcome === "selected"
                          ? "default"
                          : outcome === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {isCandidate
                        ? `Your status: ${OUTCOME_LABELS[outcome]}`
                        : OUTCOME_LABELS[outcome]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  {interview.canUpdateOutcome ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserRoundIcon className="size-4" />
                      {interview.candidates.length > 0
                        ? interview.candidates.map((candidate) => candidate.name).join(", ")
                        : "Waiting for candidate"}
                      {interview.candidates.length > 0 && (
                        <span className="hidden sm:inline">
                          · {interview.candidates
                            .map((candidate) => candidate.email)
                            .join(", ")}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Your interview status: {OUTCOME_LABELS[outcome]}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {isCandidate && meetingStatus === "live" && (
                      <Button
                        variant="outline"
                        onClick={() => joinMeeting(interview.streamCallId)}
                      >
                        Join interview
                      </Button>
                    )}
                    {interview.canUpdateOutcome && (
                      <Select
                        value={outcome}
                        onValueChange={(value) =>
                          void handleOutcomeChange(
                            interview._id,
                            value as InterviewOutcome
                          )
                        }
                        disabled={updatingId === String(interview._id)}
                      >
                        <SelectTrigger
                          className="w-40"
                          aria-label={`Set candidate outcome for ${interview.title}`}
                        >
                          {updatingId === String(interview._id) ? (
                            <span className="flex items-center gap-2">
                              <LoaderCircleIcon className="size-4 animate-spin" />
                              Saving
                            </span>
                          ) : (
                            <SelectValue placeholder="Set outcome" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="selected">Selected</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={
                        !canDelete ||
                        deletingId === String(interview._id)
                      }
                      title={
                        canDelete
                          ? "Remove from your history"
                          : "Only completed interviews can be removed from history"
                      }
                      aria-label={`Remove ${interview.title} from your history`}
                      onClick={() =>
                        void handleDelete(interview._id, interview.title)
                      }
                    >
                      {deletingId === String(interview._id) ? (
                        <LoaderCircleIcon className="size-4 animate-spin" />
                      ) : (
                        <Trash2Icon className="size-4" />
                      )}
                      <span className="sr-only sm:not-sr-only sm:ml-1">
                        Delete
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
