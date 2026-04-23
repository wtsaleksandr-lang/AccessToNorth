# Status enum refactor — migration plan

**Status:** Deferred. Code change + DB migration + data cleanup. Execute only when you can take the admin dashboard offline for a few minutes and have a DB backup in hand.

## Why

Every status column is currently `text` with no CHECK constraint:

| Table | Column | Current values in use |
|---|---|---|
| `orders` | `status` | `Awaiting Payment`, `Pending Review`, `Pending Details`, `In Progress`, `Delivered`, `Completed`, `Cancelled` |
| `order_items` | `status` | `Pending Details`, `In Progress`, `Completed` |
| `registrations` | `status` | `pending`, `completed`, `cancelled` |

Magic strings are scattered across `server/**`, `shared/**`, `client/src/**`, and email templates. A typo in a status comparison becomes a silent no-op at runtime. Converting to PostgreSQL enums gives us:

- DB-level guarantee that only valid values go in
- TypeScript union types from Drizzle
- Faster comparisons (int-backed)

## Risks and why this is staged

- Existing rows must fit exactly one of the enum values — any historical rows with case/spacing drift (e.g. `"in progress"` vs `"In Progress"`) will break the migration.
- Three separate enum types → three migrations. A partial migration leaves the DB in a mixed state.
- Every status comparison in the code must be updated. Missed ones break at runtime after the migration commits.

## Plan

### Phase 1: Audit and normalize (no schema change)

1. Inventory all `status` write sites. Each insert/update must be an approved value.
2. Run data cleanup SQL to normalize existing rows:

```sql
-- orders
UPDATE orders SET status = INITCAP(TRIM(status))
WHERE status != INITCAP(TRIM(status));

-- order_items — same as orders
UPDATE order_items SET status = INITCAP(TRIM(status))
WHERE status != INITCAP(TRIM(status));

-- registrations — lowercase convention, different pattern
UPDATE registrations SET status = LOWER(TRIM(status))
WHERE status != LOWER(TRIM(status));
```

3. Verify the resulting distinct values against the expected enum:

```sql
SELECT DISTINCT status FROM orders;
SELECT DISTINCT status FROM order_items;
SELECT DISTINCT status FROM registrations;
```

If any unexpected values remain, fix them before continuing.

### Phase 2: Introduce enums in `shared/schema.ts`

```ts
import { pgEnum } from "drizzle-orm/pg-core";

export const orderStatus = pgEnum("order_status", [
  "Awaiting Payment",
  "Pending Review",
  "Pending Details",
  "In Progress",
  "Delivered",
  "Completed",
  "Cancelled",
]);

export const orderItemStatus = pgEnum("order_item_status", [
  "Pending Details",
  "In Progress",
  "Completed",
]);

export const registrationStatus = pgEnum("registration_status", [
  "pending",
  "completed",
  "cancelled",
]);
```

Then change each column:

```ts
status: orderStatus("status").notNull().default("In Progress"),
// ...
status: orderItemStatus("status").notNull().default("Pending Details"),
// ...
status: registrationStatus("status").notNull().default("pending"),
```

### Phase 3: Generate and review the migration

```bash
npx drizzle-kit generate
```

Review the generated SQL. It should:

1. `CREATE TYPE order_status AS ENUM (...)` — plus the other two
2. `ALTER TABLE orders ALTER COLUMN status TYPE order_status USING status::order_status` — plus the other two

If the USING cast fails for any row, the migration aborts and the transaction rolls back. That's why phase 1 normalization is mandatory.

### Phase 4: Apply during a deploy window

- Put the admin panel behind a "maintenance" banner (optional).
- Take a full DB backup (`pg_dump` or provider snapshot).
- Run `npm run db:push` or apply the generated migration file.
- Run Playwright smoke tests.

### Phase 5: Tighten type usage in code

After the enum is live, Drizzle emits a stricter union type for `order.status`. Replace any remaining magic-string comparisons with the enum values:

```ts
// Before
if (order.status === "In Progress") { ... }

// After (typed — compiler catches typos)
import { orderStatus } from "@shared/schema";
if (order.status === orderStatus.enumValues[3]) { ... }
```

## Rollback

If the migration partially applies:

1. `DROP TYPE IF EXISTS order_status CASCADE;` — and for each enum created.
2. The affected tables' columns revert to `text` if the migration hasn't committed the `ALTER TYPE`. If they did commit, restore from the pre-migration backup.

## Estimated effort

- Audit + normalize: 2 hours
- Schema change + migration: 1 hour
- Code cleanup: 3–4 hours
- QA + deploy: 2 hours

Total: about a day of focused work with a rollback plan.
