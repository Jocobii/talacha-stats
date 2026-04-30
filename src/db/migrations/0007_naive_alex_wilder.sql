CREATE TABLE "import_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"imported_by" uuid,
	"import_type" text NOT NULL,
	"jornada" integer,
	"rows_processed" integer DEFAULT 0 NOT NULL,
	"rows_created" integer DEFAULT 0 NOT NULL,
	"anomaly_summary" jsonb,
	"warnings" text[],
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "import_audit_log" ADD CONSTRAINT "import_audit_log_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_audit_log" ADD CONSTRAINT "import_audit_log_imported_by_users_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ial_league_idx" ON "import_audit_log" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "ial_imported_at_idx" ON "import_audit_log" USING btree ("imported_at");--> statement-breakpoint
CREATE INDEX "ial_jornada_idx" ON "import_audit_log" USING btree ("league_id","jornada");