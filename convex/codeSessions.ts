import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const language = v.union(
  v.literal("javascript"),
  v.literal("python"),
  v.literal("java")
);

export const getByStreamCallId = query({
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

    return await ctx.db
      .query("codeSessions")
      .withIndex("by_stream_call_id", (q) =>
        q.eq("streamCallId", args.streamCallId)
      )
      .first();
  },
});

export const updateSession = mutation({
  args: {
    streamCallId: v.string(),
    questionId: v.optional(v.string()),
    language: v.optional(language),
    code: v.optional(v.string()),
  },
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

    if (!interview) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

      if (!user) {
        throw new Error("You must have a Convex profile to use the code editor");
      }
    }

    const existing = await ctx.db
      .query("codeSessions")
      .withIndex("by_stream_call_id", (q) =>
        q.eq("streamCallId", args.streamCallId)
      )
      .first();

    if (!existing) {
      if (args.questionId === undefined ||
          args.language === undefined ||
          args.code === undefined) {
        throw new Error("Initial code session values are required");
      }

      return await ctx.db.insert("codeSessions", {
        streamCallId: args.streamCallId,
        questionId: args.questionId,
        language: args.language,
        code: args.code,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(existing._id, {
      ...(args.questionId !== undefined && { questionId: args.questionId }),
      ...(args.language !== undefined && { language: args.language }),
      ...(args.code !== undefined && { code: args.code }),
      updatedAt: Date.now(),
    });

    return existing._id;
  },
});
