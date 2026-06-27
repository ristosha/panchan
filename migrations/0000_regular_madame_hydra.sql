CREATE TYPE "public"."chat_member_role" AS ENUM('MEMBER', 'ADMIN', 'CREATOR');--> statement-breakpoint
CREATE TYPE "public"."generated_media_type" AS ENUM('TEXT', 'BOOM', 'BALLOON', 'STRETCH', 'FISHEYE', 'DEMOTIVATOR', 'AWARE_SCALE');--> statement-breakpoint
CREATE TYPE "public"."media_mime" AS ENUM('PHOTO', 'VIDEO', 'STICKER', 'ANIMATION', 'VIDEO_NOTE');--> statement-breakpoint
CREATE TYPE "public"."pack_element_type" AS ENUM('TEXT', 'PHOTO', 'VIDEO', 'STICKER', 'ANIMATION');--> statement-breakpoint
CREATE TYPE "public"."pack_type" AS ENUM('TITLES', 'MEDIA');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'MODERATOR', 'ADMIN');--> statement-breakpoint
CREATE TABLE "channel" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_id" bigint NOT NULL,
	"creatorTelegramId" bigint,
	"adminsTelegramIds" bigint[] DEFAULT '{}',
	"title" text,
	"member_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_chat_enabled_packs" (
	"A" integer NOT NULL,
	"B" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"chat_id" integer NOT NULL,
	"role" "chat_member_role" DEFAULT 'MEMBER' NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_id" bigint NOT NULL,
	"title" varchar(256),
	"member_count" integer DEFAULT 0 NOT NULL,
	"disabled_commands" varchar(32)[],
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"publicId" varchar(24) NOT NULL,
	"type" "generated_media_type" NOT NULL,
	"mime" "media_mime" NOT NULL,
	"source_file_id" varchar(300) NOT NULL,
	"result_file_id" varchar(300) NOT NULL,
	"result_file_unique_id" varchar(300) NOT NULL,
	"content" varchar(2048),
	"author_id" integer,
	"chat_id" integer,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_media_uses" (
	"id" serial PRIMARY KEY NOT NULL,
	"generated_media_id" integer NOT NULL,
	"chat_id" integer,
	"used_by_telegram_id" bigint NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_linked_pack_elements" (
	"A" integer NOT NULL,
	"B" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_pack_editing_by_user" (
	"A" integer NOT NULL,
	"B" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pack_elements" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "pack_element_type" NOT NULL,
	"content" varchar(300) NOT NULL,
	"pack_id" integer NOT NULL,
	"author_id" integer
);
--> statement-breakpoint
CREATE TABLE "packs" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "pack_type" NOT NULL,
	"name" varchar(32) NOT NULL,
	"description" varchar(300),
	"tags" varchar(10)[],
	"banner_file_id" varchar(300),
	"default" boolean DEFAULT false NOT NULL,
	"private" boolean DEFAULT true NOT NULL,
	"everyone_can_insert" boolean DEFAULT false NOT NULL,
	"show_author" boolean DEFAULT true NOT NULL,
	"author_id" integer
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_commands_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(32) NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_id" bigint NOT NULL,
	"username" varchar(32),
	"premium" boolean DEFAULT false NOT NULL,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"anonymous" boolean DEFAULT false NOT NULL,
	"searchIncluded" boolean DEFAULT true NOT NULL,
	"lastGroupContactedAt" timestamp,
	"lastPrivateContactedAt" timestamp,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "_chat_enabled_packs" ADD CONSTRAINT "_chat_enabled_packs_A_chats_id_fk" FOREIGN KEY ("A") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_chat_enabled_packs" ADD CONSTRAINT "_chat_enabled_packs_B_packs_id_fk" FOREIGN KEY ("B") REFERENCES "public"."packs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "generated_media" ADD CONSTRAINT "generated_media_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "generated_media" ADD CONSTRAINT "generated_media_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "generated_media_uses" ADD CONSTRAINT "generated_media_uses_generated_media_id_generated_media_id_fk" FOREIGN KEY ("generated_media_id") REFERENCES "public"."generated_media"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "generated_media_uses" ADD CONSTRAINT "generated_media_uses_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_linked_pack_elements" ADD CONSTRAINT "_linked_pack_elements_A_generated_media_id_fk" FOREIGN KEY ("A") REFERENCES "public"."generated_media"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_linked_pack_elements" ADD CONSTRAINT "_linked_pack_elements_B_pack_elements_id_fk" FOREIGN KEY ("B") REFERENCES "public"."pack_elements"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_pack_editing_by_user" ADD CONSTRAINT "_pack_editing_by_user_A_packs_id_fk" FOREIGN KEY ("A") REFERENCES "public"."packs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_pack_editing_by_user" ADD CONSTRAINT "_pack_editing_by_user_B_users_id_fk" FOREIGN KEY ("B") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pack_elements" ADD CONSTRAINT "pack_elements_pack_id_packs_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."packs"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pack_elements" ADD CONSTRAINT "pack_elements_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "packs" ADD CONSTRAINT "packs_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_commands_preferences" ADD CONSTRAINT "user_commands_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "channel_telegram_id_key" ON "channel" USING btree ("telegram_id");--> statement-breakpoint
CREATE UNIQUE INDEX "_chat_enabled_packs_AB_unique" ON "_chat_enabled_packs" USING btree ("A","B");--> statement-breakpoint
CREATE INDEX "_chat_enabled_packs_B_index" ON "_chat_enabled_packs" USING btree ("B");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_members_user_id_chat_id_key" ON "chat_members" USING btree ("user_id","chat_id");--> statement-breakpoint
CREATE INDEX "chat_members_chat_id_idx" ON "chat_members" USING btree ("chat_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chats_telegram_id_key" ON "chats" USING btree ("telegram_id");--> statement-breakpoint
CREATE UNIQUE INDEX "generated_media_publicId_key" ON "generated_media" USING btree ("publicId");--> statement-breakpoint
CREATE INDEX "idx_generated_media_source_file_id" ON "generated_media" USING btree ("source_file_id");--> statement-breakpoint
CREATE INDEX "idx_generated_media_result_file_id" ON "generated_media" USING btree ("result_file_id");--> statement-breakpoint
CREATE INDEX "idx_generated_media_result_file_unique_id" ON "generated_media" USING btree ("result_file_unique_id");--> statement-breakpoint
CREATE INDEX "generated_media_type_idx" ON "generated_media" USING btree ("type");--> statement-breakpoint
CREATE INDEX "generated_media_author_id_idx" ON "generated_media" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "generated_media_chat_id_idx" ON "generated_media" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "generated_media_content_fts_idx" ON "generated_media" USING gin (to_tsvector('russian', coalesce("content", '')));--> statement-breakpoint
CREATE INDEX "generated_media_uses_generated_media_id_idx" ON "generated_media_uses" USING btree ("generated_media_id");--> statement-breakpoint
CREATE INDEX "generated_media_uses_used_by_telegram_id_idx" ON "generated_media_uses" USING btree ("used_by_telegram_id");--> statement-breakpoint
CREATE INDEX "generated_media_uses_chat_id_idx" ON "generated_media_uses" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "generated_media_uses_created_at_idx" ON "generated_media_uses" USING btree ("createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "_linked_pack_elements_AB_unique" ON "_linked_pack_elements" USING btree ("A","B");--> statement-breakpoint
CREATE INDEX "_linked_pack_elements_B_index" ON "_linked_pack_elements" USING btree ("B");--> statement-breakpoint
CREATE UNIQUE INDEX "_pack_editing_by_user_AB_unique" ON "_pack_editing_by_user" USING btree ("A","B");--> statement-breakpoint
CREATE INDEX "_pack_editing_by_user_B_index" ON "_pack_editing_by_user" USING btree ("B");--> statement-breakpoint
CREATE INDEX "pack_elements_pack_id_idx" ON "pack_elements" USING btree ("pack_id");--> statement-breakpoint
CREATE INDEX "pack_elements_author_id_idx" ON "pack_elements" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "packs_type_idx" ON "packs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "packs_author_id_idx" ON "packs" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "sessions_updated_at_idx" ON "sessions" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users" USING btree ("telegram_id");