import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const memberRole = pgEnum("member_role", ["owner", "manager", "staff"]);
export const opportunityType = pgEnum("opportunity_type", ["inactive_client", "empty_slot", "unfinished_plan", "follow_up"]);
export const opportunityStatus = pgEnum("opportunity_status", ["new", "drafted", "approved", "sent", "converted", "dismissed"]);
export const messageStatus = pgEnum("message_status", ["draft", "approved", "sending", "sent", "delivered", "read", "replied", "received", "failed"]);

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  city: text("city"),
  timezone: text("timezone").default("Europe/Rome").notNull(),
  toneOfVoice: text("tone_of_voice").default("Caldo, professionale e mai insistente").notNull(),
  averageTicketCents: integer("average_ticket_cents").default(12000).notNull(),
  settings: jsonb("settings").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("organizations_slug_idx").on(table.slug)]);

export const members = pgTable("members", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: memberRole("role").default("staff").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("members_org_email_idx").on(table.organizationId, table.email)]);

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  externalId: text("external_id"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  phone: text("phone").notNull(),
  email: text("email"),
  lastVisitAt: timestamp("last_visit_at", { withTimezone: true }),
  lifetimeValueCents: integer("lifetime_value_cents").default(0).notNull(),
  preferredServices: text("preferred_services").array().default([]).notNull(),
  marketingConsent: boolean("marketing_consent").default(false).notNull(),
  consentRecordedAt: timestamp("consent_recorded_at", { withTimezone: true }),
  doNotContact: boolean("do_not_contact").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("customers_org_last_visit_idx").on(table.organizationId, table.lastVisitAt), uniqueIndex("customers_org_phone_idx").on(table.organizationId, table.phone)]);

export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  externalId: text("external_id"),
  serviceName: text("service_name").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  valueCents: integer("value_cents").default(0).notNull(),
  status: text("status").default("confirmed").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("appointments_org_starts_idx").on(table.organizationId, table.startsAt)]);

export const opportunities = pgTable("opportunities", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  type: opportunityType("type").notNull(),
  status: opportunityStatus("status").default("new").notNull(),
  title: text("title").notNull(),
  reason: text("reason").notNull(),
  score: integer("score").notNull(),
  estimatedValueCents: integer("estimated_value_cents").default(0).notNull(),
  recommendedAt: timestamp("recommended_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("opportunities_org_status_score_idx").on(table.organizationId, table.status, table.score)]);

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id, { onDelete: "set null" }),
  channel: text("channel").default("whatsapp").notNull(),
  direction: text("direction").default("outbound").notNull(),
  body: text("body").notNull(),
  status: messageStatus("status").default("draft").notNull(),
  externalMessageId: text("external_message_id"),
  approvedBy: uuid("approved_by").references(() => members.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("messages_org_status_idx").on(table.organizationId, table.status)]);

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  centerName: text("center_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  city: text("city"),
  monthlyAppointments: text("monthly_appointments"),
  status: text("status").default("new").notNull(),
  source: text("source").default("website").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("leads_status_created_idx").on(table.status, table.createdAt)]);

export const integrations = pgTable("integrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  provider: text("provider").notNull(),
  status: text("status").default("disconnected").notNull(),
  encryptedConfig: text("encrypted_config"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("integrations_org_provider_idx").on(table.organizationId, table.provider)]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").default("trialing").notNull(),
  plan: text("plan").default("atelier").notNull(),
  monthlyAmountCents: integer("monthly_amount_cents").default(39000).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  actorEmail: text("actor_email"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("audit_org_created_idx").on(table.organizationId, table.createdAt)]);
