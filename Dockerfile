ARG NODE_IMAGE=quay.io/ukhomeofficedigital/hof-nodejs:24.22.2_4-alpine@sha256:2e3cebc9ed064487226c4b713b28bdd78b4d8bb0a840dfad4c3d17d41c339bb6
# -----------------------------
# Stage 1: Builder
# -----------------------------
FROM ${NODE_IMAGE} AS builder

USER root
WORKDIR /app

COPY . /app

RUN yarn install --frozen-lockfile --production

# -----------------------------
# Stage 2: Runtime
# -----------------------------
FROM ${NODE_IMAGE}

USER root

RUN addgroup --system nodejs --gid 998 && \
    adduser --system nodejs --uid 999 --home /app/ && \
    chown -R 999:998 /app/

WORKDIR /app

COPY --from=builder --chown=999:998 /app/node_modules /app/node_modules
COPY --from=builder --chown=999:998 /app/. /app

USER 999

HEALTHCHECK --interval=5m --timeout=3s \
 CMD curl --fail http://localhost:8080 || exit 1

CMD ["sh", "/app/run.sh"]

EXPOSE 8080
