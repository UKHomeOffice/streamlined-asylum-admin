# -----------------------------
# Stage 1: Builder
# -----------------------------
FROM quay.io/ukhomeofficedigital/hof-nodejs:24.22.1_2-alpine@sha256:089ed401d1a218130a703b504b05763eee45f3bf9732e237757534578c4e59b0 AS builder

USER root
WORKDIR /app

COPY . /app

RUN yarn install --frozen-lockfile --production

# -----------------------------
# Stage 2: Runtime
# -----------------------------
FROM quay.io/ukhomeofficedigital/hof-nodejs:24.22.1_2-alpine@sha256:089ed401d1a218130a703b504b05763eee45f3bf9732e237757534578c4e59b0

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
