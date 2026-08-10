import postgres from "postgres";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL è obbligatoria");

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const organizationName = process.env.DEFAULT_ORGANIZATION_NAME || "Centro Demo AgendaPiena";
const organizationSlug = process.env.DEFAULT_ORGANIZATION_SLUG || "centro-demo";
const ownerEmail = process.env.ADMIN_EMAIL || "admin@example.com";

try {
  const [organization] = await sql`
    insert into organizations (name, slug, city)
    values (${organizationName}, ${organizationSlug}, ${process.env.DEFAULT_ORGANIZATION_CITY || "Milano"})
    on conflict (slug) do update set name = excluded.name
    returning id
  `;

  await sql`
    insert into members (organization_id, email, name, role)
    values (${organization.id}, ${ownerEmail}, ${process.env.DEFAULT_OWNER_NAME || "Titolare"}, 'owner')
    on conflict (organization_id, email) do nothing
  `;

  const demoCustomers = [
    ["Martina", "Rossi", "+393330000001", 94, 252000, ["Laser gambe"]],
    ["Giulia", "Bianchi", "+393330000002", 76, 108000, ["Trattamento viso"]],
    ["Elena", "Pellegrini", "+393330000003", 65, 72000, ["Massaggio"]],
  ];

  for (const [firstName, lastName, phone, inactiveDays, value, services] of demoCustomers) {
    await sql`
      insert into customers (organization_id, first_name, last_name, phone, last_visit_at, lifetime_value_cents, preferred_services, marketing_consent, consent_recorded_at)
      values (${organization.id}, ${firstName}, ${lastName}, ${phone}, now() - (${inactiveDays}::text || ' days')::interval, ${value}, ${services}, true, now())
      on conflict (organization_id, phone) do nothing
    `;
  }

  console.log(`Database inizializzato per ${organizationName}`);
} finally {
  await sql.end();
}

