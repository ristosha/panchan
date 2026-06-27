# panchan

Telegram мем-бот (демотиваторы, текст/лобстер, aware-scale/seam-carving, balloon/fisheye/stretch, boom).
Генерация на ImageMagick (`-liquid-rescale`, собирается с liblqr) + ffmpeg + `@napi-rs/canvas`.

## Стек

- **Bun** — рантайм, TS выполняется напрямую (без сборки)
- **grammY** (+ runner, conversations v2, menu, i18n, files, hydrate, parse-mode, ratelimiter, throttler)
- **Drizzle ORM** + PostgreSQL 18 (драйвер `bun-sql`)
- **Biome** (lint + format), **lefthook** (git-хуки)
- **zod** — валидация конфига, **pino** — логи

## Архитектура

```
src/
  platform/        инфраструктура: config, database (drizzle), logger
  repositories/    доступ к данным (Drizzle), вся БД-логика здесь
  services/        движок генерации (чистые трансформации) + очередь
  bot/             транспорт: index (composition root), plugins, middlewares,
                   commands, conversations, layouts (меню), core, helpers
  scripts/         healthcheck, prune (ретеншен)
migrations/        drizzle-kit миграции
resources/         шрифты, шаблоны, локали (i18n)
```

## Запуск (dev)

```bash
bun install
cp .env.example .env   # заполнить BOT_TOKEN, DATABASE_URL, ...
bun run db:migrate
bun run dev
```

## Скрипты

- `bun run dev` / `bun run start` — бот
- `bun run types` — `tsc --noEmit`
- `bun run check` — biome (lint+format, autofix)
- `bun run db:generate` / `db:migrate` / `db:studio` — Drizzle
- `bun run prune` — чистка старых сессий / media_uses (по TTL из env)

## Деплой

`docker-compose.prod.yml` — три сервиса: `postgres` (pg18), `migrator` (one-shot
`drizzle-kit migrate`), `bot`. Образ multi-stage: отдельный стейдж компилирует
ImageMagick+liblqr, рантайм — slim `oven/bun:1-alpine` (non-root, healthcheck).
Секреты — только через `.env` (не запекаются в слой).

```bash
cp .env.example .env   # заполнить
docker compose -f docker-compose.prod.yml up -d --build
```
