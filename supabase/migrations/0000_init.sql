CREATE TABLE "appalti" (
	"id" text PRIMARY KEY NOT NULL,
	"kpis" jsonb NOT NULL,
	"operatori" jsonb NOT NULL,
	"uffici" jsonb NOT NULL,
	"contratti" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bilancio" (
	"id" text PRIMARY KEY NOT NULL,
	"kpis" jsonb NOT NULL,
	"missioni" jsonb NOT NULL,
	"trend" jsonb NOT NULL,
	"capitoli" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doc_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"count" text NOT NULL,
	"kind" text NOT NULL,
	"ord" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"tipo" text NOT NULL,
	"n" text NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"uff" text NOT NULL,
	"sez" text NOT NULL,
	"tags" jsonb NOT NULL,
	"hash" text,
	"source_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain_cards" (
	"slug" text PRIMARY KEY NOT NULL,
	"icon" text NOT NULL,
	"name" text NOT NULL,
	"value" text NOT NULL,
	"sub" text NOT NULL,
	"source_id" text NOT NULL,
	"src_val" text NOT NULL,
	"src_tag" text NOT NULL,
	"status" text NOT NULL,
	"full" boolean DEFAULT false NOT NULL,
	"ord" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain_details" (
	"slug" text PRIMARY KEY NOT NULL,
	"icon" text NOT NULL,
	"title" text NOT NULL,
	"sub" text NOT NULL,
	"kind" text NOT NULL,
	"kpis" jsonb NOT NULL,
	"chart" jsonb,
	"sources" jsonb NOT NULL,
	"cta" jsonb
);
--> statement-breakpoint
CREATE TABLE "elezione" (
	"id" text PRIMARY KEY NOT NULL,
	"data" text NOT NULL,
	"affluenza" text NOT NULL,
	"tipo" text NOT NULL,
	"candidati" jsonb NOT NULL,
	"liste" jsonb NOT NULL,
	"consiglieri" jsonb NOT NULL,
	"presidente" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_type" text NOT NULL,
	"owner_id" text NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" text PRIMARY KEY NOT NULL,
	"type_label" text NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"sources" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "graph_model" (
	"id" text PRIMARY KEY NOT NULL,
	"center" jsonb NOT NULL,
	"clusters" jsonb NOT NULL,
	"cross" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "graph_types" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"count" text NOT NULL,
	"color" text NOT NULL,
	"ord" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "map_layers" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"count" text NOT NULL,
	"color" text NOT NULL,
	"color_hex" text NOT NULL,
	"icon" text NOT NULL,
	"ord" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "map_markers" (
	"id" text PRIMARY KEY NOT NULL,
	"layer" text NOT NULL,
	"lat" double precision NOT NULL,
	"lon" double precision NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"entity_id" text,
	"source_id" text
);
--> statement-breakpoint
CREATE TABLE "nav_items" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"icon" text NOT NULL,
	"count" text NOT NULL,
	"ord" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organigramma" (
	"id" text PRIMARY KEY NOT NULL,
	"sindaco" jsonb NOT NULL,
	"assessori" jsonb NOT NULL,
	"settori" jsonb NOT NULL,
	"presidente" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qa" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"entity_ids" jsonb NOT NULL,
	"source_ids" jsonb NOT NULL,
	"sql" text NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"nome" text NOT NULL,
	"icona" text NOT NULL,
	"ufficio" text NOT NULL,
	"sintesi" text NOT NULL,
	"come_fare" jsonb NOT NULL,
	"cosa_serve" jsonb NOT NULL,
	"dove" text NOT NULL,
	"quando" text NOT NULL,
	"costo" text NOT NULL,
	"tempi" text NOT NULL,
	"online" jsonb NOT NULL,
	"source_id" text NOT NULL,
	"fonte_val" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"short" text NOT NULL,
	"full" text NOT NULL,
	"icon" text NOT NULL,
	"what" text NOT NULL,
	"url" text NOT NULL,
	"license" text NOT NULL,
	"format" text NOT NULL,
	"retrieved" text NOT NULL,
	"observed" text NOT NULL,
	"rows" text NOT NULL,
	"hash" text,
	"status" text NOT NULL,
	"refresh" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suggested" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"icon" text NOT NULL,
	"q" text NOT NULL,
	"ord" integer NOT NULL
);
