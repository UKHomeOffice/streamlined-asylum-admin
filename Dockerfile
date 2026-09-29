# -----------------------------
# Stage 1: Builder
# -----------------------------
FROM quay.io/ukhomeofficedigital/hof-nodejs:24.21.0-alpine3.24@sha256:80b294ce5027fdc87c58cc990f4d9804323a1734c1e8a1ae9d6bbe569fa8b01e AS builder

USER root
WORKDIR /app

COPY . /app

RUN yarn install --frozen-lockfile --production && \
    yarn run postinstall

# -----------------------------
# Stage 2: Runtime
# -----------------------------
FROM quay.io/ukhomeofficedigital/hof-nodejs:24.21.0-alpine3.24@sha256:80b294ce5027fdc87c58cc990f4d9804323a1734c1e8a1ae9d6bbe569fa8b01e

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
