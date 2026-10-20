// Схема базы — PRD, раздел 9. Таблицы фазы 2 (`requests`, `request_items`, `notifications`)
// появятся вместе с фазой 2.
//
// Закрытые поля участника: `email`, `contact`, `provider`, `provider_user_id`.
// Они не попадают ни в один публичный ответ — см. src/server/books.ts и src/server/users.ts.

import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({ dataType: () => "tsvector" });

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const userRole = pgEnum("user_role", ["member", "admin"]);
export const userStatus = pgEnum("user_status", ["active", "blocked"]);
export const bookMode = pgEnum("book_mode", ["gift", "lend"]);
export const bookStatus = pgEnum("book_status", [
  "available",
  "reserved",
  "on_loan",
  "gone",
  "hidden",
  "removed",
]);
export const reportTarget = pgEnum("report_target", ["book", "user", "request"]);
export const reportStatus = pgEnum("report_status", ["open", "resolved", "dismissed"]);

export const districts = pgTable("districts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const zones = pgTable("zones", {
  id: serial("id").primaryKey(),
  districtId: integer("district_id")
    .notNull()
    .references(() => districts.id),
  name: text("name").notNull(),
  sort: integer("sort").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Пусто до экрана знакомства.
    displayName: text("display_name"),
    zoneId: integer("zone_id").references(() => zones.id),
    role: userRole("role").notNull().default("member"),
    status: userStatus("status").notNull().default("active"),
    provider: text("provider").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    email: text("email"),
    contact: text("contact"),
    adultConfirmedAt: timestamp("adult_confirmed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_provider_uid").on(t.provider, t.providerUserId)],
);

export const sessions = pgTable(
  "sessions",
  {
    // SHA-256 от токена из cookie: утечка таблицы не даёт войти.
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user").on(t.userId)],
);

export const consents = pgTable("consents", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  doc: text("doc").notNull(),
  docVersion: text("doc_version").notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const books = pgTable(
  "books",
  {
    id: serial("id").primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    zoneId: integer("zone_id")
      .notNull()
      .references(() => zones.id),
    title: text("title").notNull(),
    author: text("author"),
    ageGroups: text("age_groups").array().notNull(),
    category: text("category"),
    themes: text("themes").array().notNull().default(sql`'{}'::text[]`),
    condition: text("condition").notNull(),
    mode: bookMode("mode").notNull().default("gift"),
    lendDays: integer("lend_days"),
    note: text("note"),
    status: bookStatus("status").notNull().default("available"),
    loanDueAt: timestamp("loan_due_at", { withTimezone: true }),
    // Обновляется при любом действии владельца с книгой (PRD, раздел 9).
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }).notNull().defaultNow(),
    // Причина, по которой модератор снял книгу; её видит владелец.
    moderationReason: text("moderation_reason"),
    createdAt: createdAt(),
    search: tsvector("search").generatedAlwaysAs(
      sql`to_tsvector('russian', title || ' ' || coalesce(author, ''))`,
    ),
  },
  (t) => [
    index("books_status_created").on(t.status, t.createdAt),
    index("books_owner").on(t.ownerId),
    index("books_search").using("gin", t.search),
    index("books_trgm").using("gin", sql`(title || ' ' || coalesce(author, '')) gin_trgm_ops`),
  ],
);

export const bookPhotos = pgTable(
  "book_photos",
  {
    id: serial("id").primaryKey(),
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    // Ключ в хранилище без размера и расширения: `books/12/ab3f` → `books/12/ab3f-800.webp`.
    path: text("path").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("book_photos_book").on(t.bookId)],
);

// Только фаза 1: нажатия «Хочу эту книгу» до появления запросов.
export const interests = pgTable(
  "interests",
  {
    id: serial("id").primaryKey(),
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("interests_book_user").on(t.bookId, t.userId)],
);

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  targetType: reportTarget("target_type").notNull(),
  targetId: text("target_id").notNull(),
  reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
  reason: text("reason").notNull(),
  status: reportStatus("status").notNull().default("open"),
  createdAt: createdAt(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

// Журнал для счётчиков и гейтов. Без личных данных в `payload`.
export const events = pgTable(
  "events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [index("events_type_created").on(t.type, t.createdAt)],
);
