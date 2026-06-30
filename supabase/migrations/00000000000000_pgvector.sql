-- Enable pgvector for embeddings (semantic retrieval). Sorts before drizzle migrations.
create extension if not exists vector;
