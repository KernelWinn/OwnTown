ALTER TABLE "products" ADD COLUMN "cost_price" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "cost_price" integer DEFAULT 0 NOT NULL;