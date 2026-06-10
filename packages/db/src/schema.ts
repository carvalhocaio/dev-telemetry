import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Field-length caps enforced by the ingestion writer (not by the DB).
 * Documented here so the writer and the schema stay in sync.
 */
export const COMMIT_MESSAGE_MAX_BYTES = 4 * 1024; // ~4 KB
export const PR_BODY_MAX_BYTES = 16 * 1024; // ~16 KB

// ---------------------------------------------------------------------------
// Auth tables — shapes mirror Better-Auth 1.6.15 (@better-auth/core getAuthTables).
// Column names are camelCase to match the Better-Auth Drizzle adapter defaults,
// so the adapter works without custom field mapping. Do NOT rename these columns.
// `githubId` / `githubLogin` are registered as Better-Auth `user.additionalFields`
// in the auth runtime config (next chunk) — keep names aligned there.
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  // GitHub identity (Better-Auth additionalFields on `user`).
  githubId: bigint("githubId", { mode: "number" }),
  githubLogin: text("githubLogin"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_userId_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("account_userId_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// ---------------------------------------------------------------------------
// Domain tables — multi-tenant, every row scoped by userId.
// Ciphertext only: *_enc columns never hold plaintext.
// ---------------------------------------------------------------------------

export const userSecret = pgTable("user_secret", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  // AES-256-GCM ciphertext only — never the plaintext PAT.
  githubPatEnc: text("githubPatEnc"),
  // `gemini` | `openai` | `anthropic`
  llmProvider: text("llmProvider"),
  // AES-256-GCM ciphertext only — never the plaintext API key.
  llmApiKeyEnc: text("llmApiKeyEnc"),
  llmModel: text("llmModel"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userProfile = pgTable("user_profile", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  // Built-in rubric key (e.g. `data_engineer_pleno`) or `custom`.
  profileKey: text("profileKey").notNull(),
  // Free-form rubric markdown — only populated when profileKey is `custom`.
  customContent: text("customContent"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userUsage = pgTable("user_usage", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  // Estimated stored bytes attributed to this user (quota accounting).
  bytesUsed: bigint("bytesUsed", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const repository = pgTable(
  "repository",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    githubId: bigint("githubId", { mode: "number" }).notNull(),
    name: text("name").notNull(),
    fullName: text("fullName").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("repository_userId_githubId_uq").on(t.userId, t.githubId),
  ],
);

export const commit = pgTable(
  "commit",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    repoId: text("repoId")
      .notNull()
      .references(() => repository.id, { onDelete: "cascade" }),
    sha: text("sha").notNull(),
    // Truncated to <= COMMIT_MESSAGE_MAX_BYTES (~4 KB) by the ingestion writer.
    message: text("message").notNull(),
    authoredAt: timestamp("authoredAt", { withTimezone: true }).notNull(),
    additions: integer("additions").notNull().default(0),
    deletions: integer("deletions").notNull().default(0),
    changedFiles: integer("changedFiles").notNull().default(0),
    htmlUrl: text("htmlUrl").notNull(),
    ingestedAt: timestamp("ingestedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // NOTE: intentionally no `patch` column — storage-lean (see plan §5a).
  },
  (t) => [
    uniqueIndex("commit_userId_sha_uq").on(t.userId, t.sha),
    index("commit_userId_authoredAt_idx").on(t.userId, t.authoredAt),
  ],
);

export const pullRequest = pgTable(
  "pull_request",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    repoId: text("repoId")
      .notNull()
      .references(() => repository.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    // Truncated to <= PR_BODY_MAX_BYTES (~16 KB) by the ingestion writer.
    body: text("body"),
    state: text("state").notNull(),
    ghCreatedAt: timestamp("ghCreatedAt", { withTimezone: true }).notNull(),
    ghMergedAt: timestamp("ghMergedAt", { withTimezone: true }),
    additions: integer("additions").notNull().default(0),
    deletions: integer("deletions").notNull().default(0),
    changedFiles: integer("changedFiles").notNull().default(0),
    htmlUrl: text("htmlUrl").notNull(),
    ingestedAt: timestamp("ingestedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("pull_request_userId_repoId_number_uq").on(
      t.userId,
      t.repoId,
      t.number,
    ),
    index("pull_request_userId_ghCreatedAt_idx").on(t.userId, t.ghCreatedAt),
  ],
);

export const syncJob = pgTable(
  "sync_job",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // `full` | `incremental`
    mode: text("mode").notNull(),
    // `queued` | `running` | `done` | `error` | `limit_reached`
    status: text("status").notNull(),
    // descovering repos | commits | prs (nullable while queued)
    phase: text("phase"),
    reposTotal: integer("reposTotal").notNull().default(0),
    reposDone: integer("reposDone").notNull().default(0),
    commits: integer("commits").notNull().default(0),
    prs: integer("prs").notNull().default(0),
    // Resumability cursor (per-repo / per-page state) for the durable job.
    cursor: jsonb("cursor"),
    error: text("error"),
    startedAt: timestamp("startedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sync_job_userId_startedAt_idx").on(t.userId, t.startedAt)],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  secret: one(userSecret, {
    fields: [user.id],
    references: [userSecret.userId],
  }),
  profile: one(userProfile, {
    fields: [user.id],
    references: [userProfile.userId],
  }),
  usage: one(userUsage, {
    fields: [user.id],
    references: [userUsage.userId],
  }),
  repositories: many(repository),
  commits: many(commit),
  pullRequests: many(pullRequest),
  syncJobs: many(syncJob),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const userSecretRelations = relations(userSecret, ({ one }) => ({
  user: one(user, { fields: [userSecret.userId], references: [user.id] }),
}));

export const userProfileRelations = relations(userProfile, ({ one }) => ({
  user: one(user, { fields: [userProfile.userId], references: [user.id] }),
}));

export const userUsageRelations = relations(userUsage, ({ one }) => ({
  user: one(user, { fields: [userUsage.userId], references: [user.id] }),
}));

export const repositoryRelations = relations(repository, ({ one, many }) => ({
  user: one(user, { fields: [repository.userId], references: [user.id] }),
  commits: many(commit),
  pullRequests: many(pullRequest),
}));

export const commitRelations = relations(commit, ({ one }) => ({
  user: one(user, { fields: [commit.userId], references: [user.id] }),
  repository: one(repository, {
    fields: [commit.repoId],
    references: [repository.id],
  }),
}));

export const pullRequestRelations = relations(pullRequest, ({ one }) => ({
  user: one(user, { fields: [pullRequest.userId], references: [user.id] }),
  repository: one(repository, {
    fields: [pullRequest.repoId],
    references: [repository.id],
  }),
}));

export const syncJobRelations = relations(syncJob, ({ one }) => ({
  user: one(user, { fields: [syncJob.userId], references: [user.id] }),
}));

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type UserSecret = typeof userSecret.$inferSelect;
export type NewUserSecret = typeof userSecret.$inferInsert;
export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;
export type UserUsage = typeof userUsage.$inferSelect;
export type Repository = typeof repository.$inferSelect;
export type NewRepository = typeof repository.$inferInsert;
export type Commit = typeof commit.$inferSelect;
export type NewCommit = typeof commit.$inferInsert;
export type PullRequest = typeof pullRequest.$inferSelect;
export type NewPullRequest = typeof pullRequest.$inferInsert;
export type SyncJob = typeof syncJob.$inferSelect;
export type NewSyncJob = typeof syncJob.$inferInsert;
