"use client";

import { useMemo, useState } from "react";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import {
  CalendarClockIcon,
  CheckIcon,
  LoaderCircleIcon,
  Trash2Icon,
  UserRoundIcon,
  VideoIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import LoaderUI from "@/components/LoaderUI";
import useMeetingActions from "@/hooks/useMeetingActions";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";

export default function SchedulePage() {
  const client = useStreamVideoClient();
  const { isCandidate, isInterviewer, isLoading: isRoleLoading } = useUserRole();
  const candidates = useQuery(
    api.users.getCandidatesForScheduling,
    isInterviewer ? undefined : "skip"
  );
  const interviews = useQuery(api.interviews.getMyInterviewHistory);
  const createSchedule = useMutation(api.interviews.scheduleInterview);
  const hideFromHistory = useMutation(api.interviews.hideInterviewFromMyHistory);
  const { joinMeeting } = useMeetingActions();

  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const visibleCandidates = useMemo(
    () =>
      (candidates ?? []).filter((candidate) => {
        const search = candidateSearch.trim().toLowerCase();
        return (
          !search ||
          candidate.name.toLowerCase().includes(search) ||
          candidate.email.toLowerCase().includes(search)
        );
      }),
    [candidateSearch, candidates]
  );

  const scheduledInterviews = (interviews ?? [])
    .filter(
      (interview) =>
        ["upcoming", "in_progress", "completed"].includes(interview.status)
    )
    .sort((a, b) => a.startTime - b.startTime);

  const handleDelete = async (id: Id<"interviews">, interviewTitle: string) => {
    if (!window.confirm(`Remove "${interviewTitle}" from your history?`)) return;

    setDeletingId(String(id));
    try {
      await hideFromHistory({ id });
      toast.success("Interview removed from your history.");
    } catch (error) {
      console.error("Unable to remove scheduled interview:", error);
      toast.error("Could not remove this interview from your history.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleCandidate = (clerkId: string) => {
    setSelectedCandidateIds((current) =>
      current.includes(clerkId)
        ? current.filter((id) => id !== clerkId)
        : [...current, clerkId]
    );
    setFormError("");
  };

  const handleSchedule = async () => {
    const startTime = new Date(scheduledAt).getTime();
    if (!title.trim()) {
      setFormError("Enter an interview name.");
      return;
    }
    if (!Number.isFinite(startTime) || startTime <= Date.now()) {
      setFormError("Choose a future date and time.");
      return;
    }
    if (selectedCandidateIds.length === 0) {
      setFormError("Select at least one candidate.");
      return;
    }
    if (!client) {
      setFormError("Video service is still connecting. Try again shortly.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      const call = client.call("default", crypto.randomUUID());
      await call.getOrCreate({
        data: {
          starts_at: new Date(startTime).toISOString(),
          custom: { description: title.trim() },
        },
      });

      await createSchedule({
        title: title.trim(),
        startTime,
        streamCallId: call.id,
        candidateIds: selectedCandidateIds,
      });
      toast.success(
        `Interview scheduled for ${selectedCandidateIds.length} candidate${
          selectedCandidateIds.length === 1 ? "" : "s"
        }.`
      );
      setTitle("");
      setScheduledAt("");
      setCandidateSearch("");
      setSelectedCandidateIds([]);
    } catch (error) {
      console.error("Unable to schedule the interview:", error);
      setFormError(
        error instanceof Error ? error.message : "Could not schedule the interview."
      );
      toast.error("Could not schedule the interview.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isRoleLoading) return <LoaderUI />;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="mb-8">
        <p className="text-sm font-semibold text-primary">InterviewX</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Interview schedule
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isInterviewer
            ? "Schedule an interview and select the candidates who should see it."
            : "Your scheduled interviews and reminders are listed here."}
        </p>
      </header>

      {isInterviewer && (
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClockIcon className="size-5 text-primary" />
              Schedule an interview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                Interview name
                <Input
                  value={title}
                  maxLength={120}
                  placeholder="e.g. Frontend Engineer Interview"
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setFormError("");
                  }}
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Date and time
                <Input
                  type="datetime-local"
                  min={getMinimumDateTime()}
                  value={scheduledAt}
                  onChange={(event) => {
                    setScheduledAt(event.target.value);
                    setFormError("");
                  }}
                />
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Choose candidates</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Selected candidates will see this reminder in their schedule.
                  </p>
                </div>
                <Badge variant="secondary">
                  {selectedCandidateIds.length} selected
                </Badge>
              </div>
              <Input
                value={candidateSearch}
                placeholder="Search candidates by name or email"
                aria-label="Search candidates"
                onChange={(event) => setCandidateSearch(event.target.value)}
              />
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">
                {candidates === undefined ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    Loading candidate profiles
                  </div>
                ) : visibleCandidates.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {candidates.length === 0
                      ? "No candidate profiles are available yet."
                      : "No candidates match your search."}
                  </p>
                ) : (
                  visibleCandidates.map((candidate) => {
                    const checked = selectedCandidateIds.includes(candidate.clerkId);
                    return (
                      <label
                        key={candidate._id}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCandidate(candidate.clerkId)}
                          className="size-4 accent-primary"
                        />
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {getInitials(candidate.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {candidate.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {candidate.email}
                          </span>
                        </span>
                        {checked && <CheckIcon className="size-4 text-primary" />}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => void handleSchedule()}
                disabled={
                  isSaving ||
                  !client ||
                  candidates === undefined ||
                  selectedCandidateIds.length === 0
                }
              >
                {isSaving ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <CalendarClockIcon className="size-4" />
                )}
                {isSaving ? "Scheduling..." : "Schedule interview"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold">
            {isCandidate ? "Your interview timeline" : "Scheduled interviews"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These schedules are reminders for the interviewer and selected candidates.
          </p>
        </div>

        {interviews === undefined ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border py-10 text-sm text-muted-foreground">
            <LoaderCircleIcon className="size-4 animate-spin" />
            Loading your schedule
          </div>
        ) : scheduledInterviews.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center text-muted-foreground">
              <CalendarClockIcon className="size-9" />
              <p>No upcoming interviews are scheduled for you.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {scheduledInterviews.map((interview) => (
              <Card key={interview._id}>
                <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{interview.title}</h3>
                      <Badge
                        variant={
                          interview.status === "completed"
                            ? "outline"
                            : interview.status === "in_progress"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {interview.status === "completed"
                          ? "Done"
                          : interview.status === "in_progress"
                            ? "In progress"
                            : "Upcoming"}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarClockIcon className="size-4" />
                      {format(
                        new Date(interview.startTime),
                        "EEEE, MMMM d, yyyy · h:mm a"
                      )}
                    </p>
                    {isInterviewer && (
                      <p className="flex items-start gap-2 text-sm text-muted-foreground">
                        <UserRoundIcon className="mt-0.5 size-4 shrink-0" />
                        <span>
                          {interview.candidates.length > 0
                            ? interview.candidates
                                .map((candidate) => candidate.name)
                                .join(", ")
                            : "No candidate assigned"}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {(isInterviewer || interview.status === "in_progress") && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => joinMeeting(interview.streamCallId)}
                      >
                        <VideoIcon className="size-4" />
                        {isInterviewer && interview.status === "upcoming"
                          ? "Start interview"
                          : "Join interview"}
                      </Button>
                    )}
                    {interview.status === "completed" && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        disabled={deletingId === String(interview._id)}
                        onClick={() =>
                          void handleDelete(interview._id, interview.title)
                        }
                      >
                        {deletingId === String(interview._id) ? (
                          <LoaderCircleIcon className="size-4 animate-spin" />
                        ) : (
                          <Trash2Icon className="size-4" />
                        )}
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function getMinimumDateTime() {
  const date = new Date(Date.now() + 60_000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
