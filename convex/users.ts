import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const syncCurrentUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be signed in to sync your Convex user.");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (existingUser) return existingUser._id;

    return await ctx.db.insert("users", {
      ...args,
      clerkId: identity.subject,
      role: "candidate",
    });
  },
});

export const syncUser = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) return;

    return await ctx.db.insert("users", {
      ...args,
      role: "candidate",
    });
  },
});

export const getUsers = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User is not authenticated");

    const users = await ctx.db.query("users").collect();

    return users;
  },
});

export const getCandidatesForScheduling = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User is not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!currentUser || currentUser.role !== "interviewer") {
      throw new Error("Only interviewers can view candidates for scheduling");
    }

    const users = await ctx.db.query("users").collect();
    return users
      .filter((user) => user.role === "candidate")
      .map(({ _id, clerkId, name, email, image }) => ({
        _id,
        clerkId,
        name,
        email,
        image,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    return user;
  },
});