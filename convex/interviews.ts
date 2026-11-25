import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAllInterviews = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const interviews = await ctx.db.query("interviews").collect();

    return interviews;
  },
});

export const getMyInterviews = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const interviews = await ctx.db.query("interviews").collect();
    return interviews.filter(
      (interview) =>
        interview.candidateId === identity.subject ||
        interview.candidateIds?.includes(identity.subject)
    );
  },
});

export const getMyInterviewHistory = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const interviews = await ctx.db.query("interviews").collect();
    const myInterviews = interviews.filter(
      (interview) =>
        !interview.hiddenFrom?.includes(identity.subject) &&
        (interview.candidateId === identity.subject ||
          interview.candidateIds?.includes(identity.subject) ||
          interview.interviewerIds.includes(identity.subject) ||
          interview.participantIds?.includes(identity.subject))
    );

    return await Promise.all(
      myInterviews.map(async (interview) => {
        const candidateIds = [
          ...new Set([
            ...(interview.candidateId ? [interview.candidateId] : []),
            ...(interview.candidateIds ?? []),
          ]),
        ];
        const candidates = (
          await Promise.all(
            candidateIds.map((candidateId) =>
              ctx.db
              .query("users")
              .withIndex("by_clerk_id", (q) =>
                q.eq("clerkId", candidateId)
              )
                .first()
            )
          )
        ).filter((candidate) => candidate !== null);

        return {
          ...interview,
          outcome: interview.outcome ?? "pending",
          canUpdateOutcome: interview.interviewerIds.includes(identity.subject),
          candidates: candidates.map(({ name, email, image }) => ({
            name,
            email,
            image,
          })),
          candidateName: candidates[0]?.name ?? null,
          candidateEmail: candidates[0]?.email ?? null,
        };
      })
    );
  },
});

export const getActiveInterviews = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const interviews = await ctx.db.query("interviews").collect();
    return interviews
      .filter(
        (interview) =>
          interview.status === "in_progress" &&
          (interview.candidateId === identity.subject ||
            interview.candidateIds?.includes(identity.subject) ||
            interview.interviewerIds.includes(identity.subject) ||
            interview.participantIds?.includes(identity.subject))
      )
      .map(({ _id, title, startTime, streamCallId }) => ({
        _id,
        title,
        startTime,
        streamCallId,
      }));
  },
});

export const getInterviewByStreamCallId = query({
  args: { streamCallId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const interview = await ctx.db
      .query("interviews")
      .withIndex("by_stream_call_id", (q) =>
        q.eq("streamCallId", args.streamCallId)
      )
      .first();
    if (
      interview &&
      interview.candidateId !== identity.subject &&
      !interview.candidateIds?.includes(identity.subject) &&
      !interview.interviewerIds.includes(identity.subject) &&
      !interview.participantIds?.includes(identity.subject)
    ) {
      throw new Error("You are not a participant in this interview");
    }

    return interview;
  },
});

export const createInstantInterview = mutation({
  args: { streamCallId: v.string(), title: v.string() },
  handler: async (ctx, { streamCallId, title }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const interviewTitle = title.trim();
    if (!interviewTitle || interviewTitle.length > 120) {
      throw new Error("Interview name must be between 1 and 120 characters");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user || user.role !== "interviewer") {
      throw new Error("Only interviewers can start an interview");
    }

    const existing = await ctx.db
      .query("interviews")
      .withIndex("by_stream_call_id", (q) =>
        q.eq("streamCallId", streamCallId)
      )
      .first();
    if (existing) {
      if (!existing.interviewerIds.includes(identity.subject)) {
        throw new Error("This meeting is already registered to another interviewer");
      }
      return existing._id;
    }

    return await ctx.db.insert("interviews", {
      title: interviewTitle,
      startTime: Date.now(),
      status: "in_progress",
      outcome: "pending",
      streamCallId,
      candidateId: "",
      interviewerIds: [identity.subject],
      participantIds: [identity.subject],
    });
  },
});

export const registerParticipant = mutation({
  args: { streamCallId: v.string() },
  handler: async (ctx, { streamCallId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    const interview = await ctx.db
      .query("interviews")
      .withIndex("by_stream_call_id", (q) =>
        q.eq("streamCallId", streamCallId)
      )
      .first();
    if (!interview) throw new Error("This meeting link is not registered");
    if (["completed", "failed", "succeeded"].includes(interview.status)) {
      throw new Error("This interview has already ended");
    }

    const participantIds = interview.participantIds ?? [
      ...interview.interviewerIds,
      ...(interview.candidateId ? [interview.candidateId] : []),
      ...(interview.candidateIds ?? []),
    ];
    const isKnownParticipant =
      interview.candidateId === identity.subject ||
      interview.candidateIds?.includes(identity.subject) ||
      interview.interviewerIds.includes(identity.subject) ||
      participantIds.includes(identity.subject);
    const canJoinAsCandidate =
      user?.role === "candidate" &&
      !interview.candidateId &&
      !interview.candidateIds?.length;
    if (!isKnownParticipant && !canJoinAsCandidate) {
      throw new Error("This room is only available to its host and invited candidate");
    }

    const updatedParticipantIds = participantIds.includes(identity.subject)
      ? participantIds
      : [...participantIds, identity.subject];

    await ctx.db.patch(interview._id, {
      status: "in_progress",
      participantIds: updatedParticipantIds,
      ...(user?.role === "candidate" && !interview.candidateId
        ? { candidateId: identity.subject }
        : {}),
    });

    return interview._id;
  },
});

export const scheduleInterview = mutation({
  args: {
    title: v.string(),
    startTime: v.number(),
    streamCallId: v.string(),
    candidateIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const interviewer = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!interviewer || interviewer.role !== "interviewer") {
      throw new Error("Only interviewers can schedule interviews");
    }

    const title = args.title.trim();
    if (!title || title.length > 120) {
      throw new Error("Interview name must be between 1 and 120 characters");
    }
    if (args.startTime <= Date.now()) {
      throw new Error("Choose a future date and time");
    }

    const candidateIds = [...new Set(args.candidateIds)];
    if (candidateIds.length === 0) {
      throw new Error("Choose at least one candidate");
    }

    const users = await ctx.db.query("users").collect();
    const availableCandidates = new Set(
      users
        .filter((user) => user.role === "candidate")
        .map((user) => user.clerkId)
    );
    if (candidateIds.some((candidateId) => !availableCandidates.has(candidateId))) {
      throw new Error("One or more selected candidates are unavailable");
    }

    return await ctx.db.insert("interviews", {
      title,
      startTime: args.startTime,
      status: "upcoming",
      outcome: "pending",
      streamCallId: args.streamCallId,
      candidateId: candidateIds[0],
      candidateIds,
      interviewerIds: [identity.subject],
      participantIds: [identity.subject, ...candidateIds],
    });
  },
});

export const createInterview = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    status: v.string(),
    streamCallId: v.string(),
    candidateId: v.string(),
    interviewerIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    if (!args.interviewerIds.includes(identity.subject)) {
      throw new Error("The creating interviewer must be assigned to the interview");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user || user.role !== "interviewer") {
      throw new Error("Only interviewers can schedule interviews");
    }

    return await ctx.db.insert("interviews", {
      ...args,
      outcome: "pending",
      participantIds: [
        ...new Set([
          ...args.interviewerIds,
          ...(args.candidateId ? [args.candidateId] : []),
        ]),
      ],
    });
  },
});

export const updateInterviewStatus = mutation({
  args: {
    id: v.id("interviews"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const interview = await ctx.db.get(args.id);
    if (!interview || !interview.interviewerIds.includes(identity.subject)) {
      throw new Error("Only an interviewer for this interview can update its status");
    }

    return await ctx.db.patch(args.id, {
      status: args.status,
      ...(args.status === "completed" ? { endTime: Date.now() } : {}),
    });
  },
});

export const updateInterviewOutcome = mutation({
  args: {
    id: v.id("interviews"),
    outcome: v.union(
      v.literal("pending"),
      v.literal("rejected"),
      v.literal("selected")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const interview = await ctx.db.get(args.id);
    if (!interview || !interview.interviewerIds.includes(identity.subject)) {
      throw new Error("Only an interviewer for this interview can set its outcome");
    }

    await ctx.db.patch(args.id, { outcome: args.outcome });
  },
});

export const hideInterviewFromMyHistory = mutation({
  args: { id: v.id("interviews") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const interview = await ctx.db.get(id);
    if (!interview) throw new Error("Interview not found");
    const isFinished = ["completed", "failed", "succeeded"].includes(
      interview.status
    );
    if (!isFinished && (interview.outcome === "pending" || !interview.outcome)) {
      throw new Error("Only completed interviews can be removed from history");
    }

    const isCandidate = interview.candidateId === identity.subject;
    const isSelectedCandidate = interview.candidateIds?.includes(identity.subject);
    const isInterviewer = interview.interviewerIds.includes(identity.subject);
    const isParticipant = interview.participantIds?.includes(identity.subject);
    if (!isCandidate && !isSelectedCandidate && !isInterviewer && !isParticipant) {
      throw new Error("You are not a participant in this interview");
    }

    const hiddenFrom = interview.hiddenFrom ?? [];
    if (!hiddenFrom.includes(identity.subject)) {
      await ctx.db.patch(id, {
        hiddenFrom: [...hiddenFrom, identity.subject],
      });
    }
  },
});