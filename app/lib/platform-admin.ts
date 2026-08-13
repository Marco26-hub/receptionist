import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "../../db";
import { auditLogs, customers, integrations, members, organizations, subscriptions, voiceAgents } from "../../db/schema";
import { ValidationError } from "./validation";

export function isPlatformAdminEmail(email: string) {
  const allowed = (process.env.PLATFORM_ADMIN_EMAILS || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

export function platformProvisioningReady() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function listUserOrganizations(email: string) {
  if (!isDatabaseConfigured()) return [];
  return getDb().select({
    organizationId: organizations.id,
    organizationName: organizations.name,
    city: organizations.city,
    memberId: members.id,
    role: members.role,
  }).from(members).innerJoin(organizations, eq(members.organizationId, organizations.id))
    .where(and(eq(members.email, email.toLowerCase()), eq(members.active, true)))
    .orderBy(organizations.name);
}

export async function membershipForOrganization(email: string, organizationId: string) {
  if (!isDatabaseConfigured()) return null;
  const [row] = await getDb().select({ memberId: members.id, organizationId: members.organizationId, role: members.role })
    .from(members)
    .where(and(eq(members.email, email.toLowerCase()), eq(members.organizationId, organizationId), eq(members.active, true)))
    .limit(1);
  return row || null;
}

export async function getPlatformOrganizations() {
  if (!isDatabaseConfigured()) return [];
  const rows = await getDb().select({
    id: organizations.id,
    name: organizations.name,
    slug: organizations.slug,
    city: organizations.city,
    createdAt: organizations.createdAt,
    members: sql<number>`(select count(*) from ${members} where ${members.organizationId} = ${organizations.id} and ${members.active} = true)`,
    customers: sql<number>`(select count(*) from ${customers} where ${customers.organizationId} = ${organizations.id})`,
    subscriptionStatus: sql<string | null>`(select ${subscriptions.status} from ${subscriptions} where ${subscriptions.organizationId} = ${organizations.id} order by ${subscriptions.updatedAt} desc limit 1)`,
    voiceStatus: sql<string | null>`(select ${voiceAgents.status} from ${voiceAgents} where ${voiceAgents.organizationId} = ${organizations.id} limit 1)`,
    calendarConnected: sql<boolean>`exists(select 1 from ${integrations} where ${integrations.organizationId} = ${organizations.id} and ${integrations.provider} = 'calcom' and ${integrations.status} = 'connected')`,
    whatsappConnected: sql<boolean>`exists(select 1 from ${integrations} where ${integrations.organizationId} = ${organizations.id} and ${integrations.provider} = 'whatsapp' and ${integrations.status} = 'connected')`,
  }).from(organizations).orderBy(desc(organizations.createdAt)).limit(250);
  return rows.map((row) => ({ ...row, members: Number(row.members), customers: Number(row.customers), createdAt: row.createdAt.toISOString() }));
}

export async function createPlatformOrganization(input: { name: string; city: string | null; ownerName: string; ownerEmail: string; actorEmail: string }) {
  if (!isDatabaseConfigured()) throw new ValidationError("Database non configurato");
  const db = getDb();
  const baseSlug = slugify(input.name);
  let slug = baseSlug;
  for (let suffix = 2; suffix < 100; suffix += 1) {
    const existing = await db.query.organizations.findFirst({ where: eq(organizations.slug, slug), columns: { id: true } });
    if (!existing) break;
    slug = `${baseSlug}-${suffix}`;
  }
  return db.transaction(async (transaction) => {
    const [organization] = await transaction.insert(organizations).values({ name: input.name, slug, city: input.city }).returning();
    const [owner] = await transaction.insert(members).values({ organizationId: organization.id, email: input.ownerEmail, name: input.ownerName, role: "owner" }).returning();
    await transaction.insert(auditLogs).values({ organizationId: organization.id, actorEmail: input.actorEmail, action: "platform.organization.created", entityType: "organization", entityId: organization.id, metadata: { ownerEmail: input.ownerEmail } });
    return { organization, owner };
  });
}

function slugify(value: string) {
  const slug = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
  return slug || `azienda-${Date.now()}`;
}
