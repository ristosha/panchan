FROM node:19.6-alpine3.17 as base
RUN apk update && apk add --no-cache dumb-init libc6-compat ffmpeg

RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories \
    && apk add --no-cache gcc  curl tar file  g++ libstdc++ bash git glib glib-dev build-base zlib-dev libpng-dev libjpeg-turbo-dev freetype-dev fontconfig-dev perl-dev ghostscript-dev libtool tiff-dev lcms2-dev libwebp-dev libxml2-dev libx11-dev libxext-dev chrpath libheif-dev librsvg-dev freetype fontconfig ghostscript ghostscript-fonts lcms2 graphviz

RUN git clone https://github.com/carlobaldassi/liblqr && \
    cd liblqr && \
    ./configure && \
    make && \
    make install 
    

RUN curl https://codeload.github.com/ImageMagick/ImageMagick/tar.gz/7.0.10-51 | tar -xz && \
    cd ImageMagick-7.0.10-51 && \
    ./configure --with-lqr && \
    make && \
    make install && \
    cd .. && \
    rm -R ImageMagick-7.0.10-51 && \
    cd .. && \
    rm -R liblqr
    
ENV MAGICK_HOME=/usr
WORKDIR /usr/src

FROM base as builder
COPY package*.json ./
COPY prisma ./prisma
COPY ./.docker.env ./
RUN npm ci && npx prisma generate
COPY . .
RUN npm run build && npm prune --omit=dev

FROM builder as runner
COPY --from=builder /usr/src/node_modules ./node_modules
COPY --from=builder /usr/src/dist ./dist
COPY --from=builder /usr/src/package*.json ./
COPY resources ./resources
COPY prisma ./prisma

USER root
CMD ["dumb-init", "npm", "run", "start:prod"]
