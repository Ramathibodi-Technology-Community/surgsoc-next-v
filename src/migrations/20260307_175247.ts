import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_feature_requests_type" AS ENUM('bug', 'feature');
  CREATE TYPE "public"."enum_feature_requests_status" AS ENUM('open', 'planned', 'in_progress', 'done', 'closed');
  ALTER TYPE "public"."enum_users_roles" ADD VALUE 'deputy_vp' BEFORE 'vp';
  CREATE TABLE "feature_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_feature_requests_type" DEFAULT 'feature' NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"status" "enum_feature_requests_status" DEFAULT 'open',
  	"admin_notes" varchar,
  	"submitted_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "home_content_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar,
  	"heading" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"image_url" varchar
  );

  CREATE TABLE "home_content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  CREATE TABLE "terms_content_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"content" varchar NOT NULL
  );

  CREATE TABLE "terms_content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"intro" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  ALTER TABLE IF EXISTS "pages" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "pages" CASCADE;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_complete" boolean;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "feature_requests_id" integer;
  ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_content_sections" ADD CONSTRAINT "home_content_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "terms_content_sections" ADD CONSTRAINT "terms_content_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."terms_content"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "feature_requests_submitted_by_idx" ON "feature_requests" USING btree ("submitted_by_id");
  CREATE INDEX "feature_requests_updated_at_idx" ON "feature_requests" USING btree ("updated_at");
  CREATE INDEX "feature_requests_created_at_idx" ON "feature_requests" USING btree ("created_at");
  CREATE INDEX "home_content_sections_order_idx" ON "home_content_sections" USING btree ("_order");
  CREATE INDEX "home_content_sections_parent_id_idx" ON "home_content_sections" USING btree ("_parent_id");
  CREATE INDEX "terms_content_sections_order_idx" ON "terms_content_sections" USING btree ("_order");
  CREATE INDEX "terms_content_sections_parent_id_idx" ON "terms_content_sections" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_feature_requests_fk" FOREIGN KEY ("feature_requests_id") REFERENCES "public"."feature_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_feature_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("feature_requests_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "pages_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"content" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "feature_requests" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "terms_content_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "terms_content" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "feature_requests" CASCADE;
  DROP TABLE "home_content_sections" CASCADE;
  DROP TABLE "home_content" CASCADE;
  DROP TABLE "terms_content_sections" CASCADE;
  DROP TABLE "terms_content" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_feature_requests_fk";

  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_roles";
  CREATE TYPE "public"."enum_users_roles" AS ENUM('visitor', 'member', 'staff_probation', 'staff', 'vp', 'admin', 'superadmin');
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_roles" USING "value"::"public"."enum_users_roles";
  DROP INDEX "payload_locked_documents_rels_feature_requests_id_idx";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  ALTER TABLE "users" DROP COLUMN "profile_complete";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "feature_requests_id";
  DROP TYPE "public"."enum_feature_requests_type";
  DROP TYPE "public"."enum_feature_requests_status";`)
}
