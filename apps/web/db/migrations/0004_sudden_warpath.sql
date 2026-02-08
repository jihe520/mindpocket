CREATE TABLE "embedding" (
	"id" text PRIMARY KEY NOT NULL,
	"bookmark_id" text NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1024) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "embedding" ADD CONSTRAINT "embedding_bookmark_id_bookmark_id_fk" FOREIGN KEY ("bookmark_id") REFERENCES "public"."bookmark"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "embedding_bookmarkId_idx" ON "embedding" USING btree ("bookmark_id");--> statement-breakpoint
CREATE INDEX "embeddingIndex" ON "embedding" USING hnsw ("embedding" vector_cosine_ops);