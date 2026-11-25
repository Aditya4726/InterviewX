"use client";

import { format } from "date-fns";
import {
  CalendarClockIcon,
  LoaderCircleIcon,
  VideoIcon,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import useMeetingActions from "@/hooks/useMeetingActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

export default function ActiveInterviewsSection() {
  const activeInterviews = useQuery(api.interviews.getActiveInterviews);
  const { joinMeeting } = useMeetingActions();

  return (
    <section className="mb-8">
      <header className="mb-4">
        <h2 className="text-2xl font-bold">Interviews in progress</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Rejoin a running interview after a connection drop. Only the End
          Meeting button ends it for everyone.
        </p>
      </header>

      {activeInterviews === undefined ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border py-8 text-sm text-muted-foreground">
          <LoaderCircleIcon className="size-4 animate-spin" />
          Checking for running interviews
        </div>
      ) : activeInterviews.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
            <VideoIcon className="size-5 shrink-0" />
            No interviews are running right now.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeInterviews.map((interview) => (
            <Card key={interview._id}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{interview.title}</CardTitle>
                    <Badge className="gap-1">
                      <span className="size-1.5 rounded-full bg-current" />
                      Running
                    </Badge>
                  </div>
                  <CardDescription className="mt-2 flex items-center gap-2">
                    <CalendarClockIcon className="size-4" />
                    Started{" "}
                    {format(new Date(interview.startTime), "MMM d, yyyy · h:mm a")}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => joinMeeting(interview.streamCallId)}
                  >
                    Join interview
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
