-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "chat_member_role" AS ENUM ('MEMBER', 'ADMIN', 'CREATOR');

-- CreateEnum
CREATE TYPE "generated_media_type" AS ENUM ('TEXT', 'BOOM', 'BALLOON', 'STRETCH', 'FISHEYE', 'DEMOTIVATOR', 'AWARE_SCALE');

-- CreateEnum
CREATE TYPE "media_mime" AS ENUM ('PHOTO', 'VIDEO', 'STICKER', 'ANIMATION', 'VIDEO_NOTE');

-- CreateEnum
CREATE TYPE "pack_type" AS ENUM ('TITLES', 'MEDIA');

-- CreateEnum
CREATE TYPE "pack_element_type" AS ENUM ('TEXT', 'PHOTO', 'VIDEO', 'STICKER', 'ANIMATION');

-- CreateTable
CREATE TABLE "sessions" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "username" VARCHAR(32),
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "role" "user_role" NOT NULL DEFAULT 'USER',
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "searchIncluded" BOOLEAN NOT NULL DEFAULT true,
    "lastGroupContactedAt" TIMESTAMP,
    "lastPrivateContactedAt" TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_commands_preferences" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_commands_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" SERIAL NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "title" VARCHAR(256),
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "disabled_commands" VARCHAR(32)[],
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_members" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "role" "chat_member_role" NOT NULL DEFAULT 'MEMBER',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel" (
    "id" SERIAL NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "creatorTelegramId" BIGINT,
    "adminsTelegramIds" BIGINT[] DEFAULT ARRAY[]::BIGINT[],
    "title" TEXT,
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packs" (
    "id" SERIAL NOT NULL,
    "type" "pack_type" NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "description" VARCHAR(300),
    "tags" VARCHAR(10)[],
    "banner_file_id" VARCHAR(300),
    "default" BOOLEAN NOT NULL DEFAULT false,
    "private" BOOLEAN NOT NULL DEFAULT true,
    "everyone_can_insert" BOOLEAN NOT NULL DEFAULT false,
    "show_author" BOOLEAN NOT NULL DEFAULT true,
    "author_id" INTEGER,

    CONSTRAINT "packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pack_elements" (
    "id" SERIAL NOT NULL,
    "type" "pack_element_type" NOT NULL,
    "content" VARCHAR(300) NOT NULL,
    "pack_id" INTEGER NOT NULL,
    "author_id" INTEGER,

    CONSTRAINT "pack_elements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_media" (
    "id" SERIAL NOT NULL,
    "publicId" VARCHAR(24) NOT NULL,
    "type" "generated_media_type" NOT NULL,
    "mime" "media_mime" NOT NULL,
    "source_file_id" VARCHAR(300) NOT NULL,
    "result_file_id" VARCHAR(300) NOT NULL,
    "result_file_unique_id" VARCHAR(300) NOT NULL,
    "content" VARCHAR(2048),
    "author_id" INTEGER,
    "chat_id" INTEGER,
    "meta" JSON NOT NULL DEFAULT '{}',
    "created_at" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_media_uses" (
    "id" SERIAL NOT NULL,
    "generated_media_id" INTEGER NOT NULL,
    "chat_id" INTEGER,
    "used_by_telegram_id" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_media_uses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_chat_enabled_packs" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_pack_editing_by_user" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_linked_pack_elements" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "chats_telegram_id_key" ON "chats"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_members_user_id_chat_id_key" ON "chat_members"("user_id", "chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "channel_telegram_id_key" ON "channel"("telegram_id");

-- CreateIndex
CREATE INDEX "packs_type_idx" ON "packs"("type");

-- CreateIndex
CREATE UNIQUE INDEX "generated_media_publicId_key" ON "generated_media"("publicId");

-- CreateIndex
CREATE INDEX "idx_generated_media_source_file_id" ON "generated_media"("source_file_id");

-- CreateIndex
CREATE INDEX "idx_generated_media_result_file_id" ON "generated_media"("result_file_id");

-- CreateIndex
CREATE UNIQUE INDEX "_chat_enabled_packs_AB_unique" ON "_chat_enabled_packs"("A", "B");

-- CreateIndex
CREATE INDEX "_chat_enabled_packs_B_index" ON "_chat_enabled_packs"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_pack_editing_by_user_AB_unique" ON "_pack_editing_by_user"("A", "B");

-- CreateIndex
CREATE INDEX "_pack_editing_by_user_B_index" ON "_pack_editing_by_user"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_linked_pack_elements_AB_unique" ON "_linked_pack_elements"("A", "B");

-- CreateIndex
CREATE INDEX "_linked_pack_elements_B_index" ON "_linked_pack_elements"("B");

-- AddForeignKey
ALTER TABLE "user_commands_preferences" ADD CONSTRAINT "user_commands_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packs" ADD CONSTRAINT "packs_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_elements" ADD CONSTRAINT "pack_elements_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_elements" ADD CONSTRAINT "pack_elements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_media" ADD CONSTRAINT "generated_media_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_media" ADD CONSTRAINT "generated_media_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_media_uses" ADD CONSTRAINT "generated_media_uses_generated_media_id_fkey" FOREIGN KEY ("generated_media_id") REFERENCES "generated_media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_media_uses" ADD CONSTRAINT "generated_media_uses_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_chat_enabled_packs" ADD CONSTRAINT "_chat_enabled_packs_A_fkey" FOREIGN KEY ("A") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_chat_enabled_packs" ADD CONSTRAINT "_chat_enabled_packs_B_fkey" FOREIGN KEY ("B") REFERENCES "packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_pack_editing_by_user" ADD CONSTRAINT "_pack_editing_by_user_A_fkey" FOREIGN KEY ("A") REFERENCES "packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_pack_editing_by_user" ADD CONSTRAINT "_pack_editing_by_user_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_linked_pack_elements" ADD CONSTRAINT "_linked_pack_elements_A_fkey" FOREIGN KEY ("A") REFERENCES "generated_media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_linked_pack_elements" ADD CONSTRAINT "_linked_pack_elements_B_fkey" FOREIGN KEY ("B") REFERENCES "pack_elements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
