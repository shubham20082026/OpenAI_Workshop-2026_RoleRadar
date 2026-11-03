import {integer,sqliteTable,text,index} from 'drizzle-orm/sqlite-core';
// Public source listings only. Private account data stays in Supabase under RLS.
export const publicJobCatalog=sqliteTable('public_job_catalog',{
  jobId:text('job_id').primaryKey(),
  payload:text('payload').notNull(),
  expiresAt:integer('expires_at').notNull(),
  closedUntil:integer('closed_until').notNull().default(0),
},table=>[index('public_job_catalog_expiry').on(table.expiresAt)]);
