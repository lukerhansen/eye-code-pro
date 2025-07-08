CREATE TABLE "billing_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"insurance_plan" varchar(100) NOT NULL,
	"doctor" varchar(100) NOT NULL,
	"patient_type" varchar(20) NOT NULL,
	"level" integer NOT NULL,
	"recommended_code" varchar(20) NOT NULL,
	"diagnosis" varchar(255),
	"is_emergency_visit" boolean DEFAULT false NOT NULL,
	"free_exam_billed_last_year" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing_entries" ADD CONSTRAINT "billing_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;