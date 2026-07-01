CREATE TABLE "fact_budget" (
	"id" text PRIMARY KEY NOT NULL,
	"missione_code" text NOT NULL,
	"missione_label" text NOT NULL,
	"importo" double precision NOT NULL,
	"anno" integer NOT NULL,
	"source_id" text DEFAULT 'bdap' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fact_coesione" (
	"stato" text PRIMARY KEY NOT NULL,
	"progetti" integer NOT NULL,
	"source_id" text DEFAULT 'opencoesione' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fact_contracts" (
	"cig" text PRIMARY KEY NOT NULL,
	"oggetto" text NOT NULL,
	"importo" double precision NOT NULL,
	"tipologia" text NOT NULL,
	"ufficio" text NOT NULL,
	"anno" integer,
	"data" text,
	"source_id" text DEFAULT 'anac' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fact_pnrr" (
	"missione_code" text PRIMARY KEY NOT NULL,
	"missione_label" text NOT NULL,
	"progetti" integer NOT NULL,
	"source_id" text DEFAULT 'openpnrr' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingest_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"ran_at" text NOT NULL,
	"status" text NOT NULL,
	"rows" integer NOT NULL,
	"prev_rows" integer,
	"delta" integer,
	"guard" text NOT NULL,
	"note" text
);
