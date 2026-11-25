import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    role: v.union(v.literal("candidate"), v.literal("interviewer")),
    clerkId: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

  interviews: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    status: v.string(),
    outcome: v.optional(
      v.union(v.literal("pending"), v.literal("rejected"), v.literal("selected"))
    ),
    hiddenFrom: v.optional(v.array(v.string())),
    streamCallId: v.string(),
    candidateId: v.string(),
    candidateIds: v.optional(v.array(v.string())),
    interviewerIds: v.array(v.string()),
    participantIds: v.optional(v.array(v.string())),
  })
    .index("by_candidate_id", ["candidateId"])
    .index("by_stream_call_id", ["streamCallId"]),

  codeSessions: defineTable({
    streamCallId: v.string(),
    questionId: v.string(),
    language: v.union(v.literal("javascript"), v.literal("python"), v.literal("java")),
    code: v.string(),
    updatedAt: v.number(),
  }).index("by_stream_call_id", ["streamCallId"]),

  comments: defineTable({
    content: v.string(),
    rating: v.number(),
    interviewerId: v.string(),
    interviewId: v.id("interviews"),
  }).index("by_interview_id", ["interviewId"]),
});