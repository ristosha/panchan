# syntax=docker/dockerfile:1

# ───────────────────────── ImageMagick + liblqr builder ─────────────────────────
# Alpine's packaged imagemagick is built WITHOUT the LQR delegate, so seam-carving
# (`-liquid-rescale`, used by aware-scale) is unavailable. We compile liblqr and
# ImageMagick from source here and copy only the installed artifacts into runtime.
# Same alpine base as the runtime => musl/shared-lib compatibility.
FROM oven/bun:1-alpine AS im-builder

ARG IM_VERSION=7.1.1-47
RUN apk add --no-cache \
	build-base git autoconf automake libtool pkgconf \
	glib-dev libpng-dev libjpeg-turbo-dev freetype-dev fontconfig-dev \
	libwebp-dev librsvg-dev tiff-dev lcms2-dev

# liblqr (seam carving) -> /usr/local
RUN git clone --depth 1 https://github.com/carlobaldassi/liblqr /tmp/liblqr \
	&& cd /tmp/liblqr \
	&& ./autogen.sh || true \
	&& ./configure --prefix=/usr/local \
	&& make -j"$(nproc)" \
	&& make install

ENV PKG_CONFIG_PATH=/usr/local/lib/pkgconfig

# ImageMagick with --with-lqr, single-threaded (no OpenMP) for predictable RAM/CPU
RUN git clone --depth 1 --branch "${IM_VERSION}" https://github.com/ImageMagick/ImageMagick /tmp/im \
	&& cd /tmp/im \
	&& ./configure \
		--prefix=/usr/local \
		--with-lqr \
		--with-rsvg \
		--with-webp \
		--disable-openmp \
		--disable-docs \
		--without-magick-plus-plus \
	&& make -j"$(nproc)" \
	&& make install \
	&& rm -rf /tmp/im /tmp/liblqr

# ───────────────────────── JS deps (dev, for migrator) ─────────────────────────
FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ───────────────────────── migrator (one-shot) ─────────────────────────
FROM deps AS migrator
COPY drizzle.config.ts tsconfig.json ./
COPY src/platform/database ./src/platform/database
COPY migrations ./migrations
CMD ["bun", "run", "db:migrate"]

# ───────────────────────── production base ─────────────────────────
FROM oven/bun:1-alpine AS base
WORKDIR /app

# runtime shared libs that the compiled ImageMagick links against, + ffmpeg + fonts
RUN apk add --no-cache \
	ffmpeg \
	glib libpng libjpeg-turbo freetype fontconfig \
	libwebp librsvg tiff lcms2 \
	ttf-dejavu

# compiled ImageMagick + liblqr
COPY --from=im-builder /usr/local /usr/local
# webp demux/mux runtime libs ship only in libwebp-dev on alpine — bring them from
# the builder so libMagickCore (built --with-webp, for stickers) resolves its symbols
COPY --from=im-builder /usr/lib/libwebpdemux.so.2 /usr/lib/libwebpmux.so.3 /usr/lib/
RUN ldconfig /usr/local/lib 2>/dev/null || true
ENV MAGICK_HOME=/usr/local \
	PATH=/usr/local/bin:$PATH \
	LD_LIBRARY_PATH=/usr/local/lib \
	MAGICK_THREAD_LIMIT=1

COPY package.json bun.lock tsconfig.json ./
RUN bun install --frozen-lockfile --production
COPY src ./src
COPY resources ./resources

# ───────────────────────── bot ─────────────────────────
FROM base AS bot
ENV NODE_ENV=production
# bun image ships a non-root `bun` user
RUN chown -R bun:bun /app
USER bun
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
	CMD ["bun", "run", "src/scripts/healthcheck.ts"]
CMD ["bun", "run", "src/index.ts"]
