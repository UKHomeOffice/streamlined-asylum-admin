# -----------------------------
# Stage 1: Builder
# -----------------------------
FROM quay.io/ukhomeofficedigital/hof-nodejs:24.21.0-alpine3.24-v8@sha256:a0c438317862e595f45a51e7cb234a0c7e8c67aef2b886844d788dbe21c3b410 AS builder

USER root
WORKDIR /app

COPY . /app

RUN yarn install --frozen-lockfile --production

# -----------------------------
# Stage 2: Runtime
# -----------------------------
FROM quay.io/ukhomeofficedigital/hof-nodejs:24.21.0-alpine3.24-v8@sha256:a0c438317862e595f45a51e7cb234a0c7e8c67aef2b886844d788dbe21c3b410

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
