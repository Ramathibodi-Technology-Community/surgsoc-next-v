import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$
  BEGIN
      BEGIN
          ALTER TABLE "forms" ADD COLUMN "accept_responses" boolean DEFAULT true;
      EXCEPTION
          WHEN duplicate_column THEN null;
      END;
      BEGIN
          ALTER TABLE "forms" ADD COLUMN "response_deadline" timestamp(3) with time zone;
      EXCEPTION
          WHEN duplicate_column THEN null;
      END;
      BEGIN
          ALTER TABLE "forms" ADD COLUMN "response_limit" numeric;
      EXCEPTION
          WHEN duplicate_column THEN null;
      END;
      BEGIN
          ALTER TABLE "forms" ADD COLUMN "closed_message" jsonb;
      EXCEPTION
          WHEN duplicate_column THEN null;
      END;
  END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DO $$
  BEGIN
      BEGIN
          ALTER TABLE "forms" DROP COLUMN "accept_responses";
      EXCEPTION
          WHEN undefined_column THEN null;
      END;
      BEGIN
          ALTER TABLE "forms" DROP COLUMN "response_deadline";
      EXCEPTION
          WHEN undefined_column THEN null;
      END;
      BEGIN
          ALTER TABLE "forms" DROP COLUMN "response_limit";
      EXCEPTION
          WHEN undefined_column THEN null;
      END;
      BEGIN
          ALTER TABLE "forms" DROP COLUMN "closed_message";
      EXCEPTION
          WHEN undefined_column THEN null;
      END;
  END $$;
  `)
}
