# -----------------------------
# Stage 1: Builder
# -----------------------------
FROM quay.io/ukhomeofficedigital/hof-nodejs:24.22.0-alpine3.24-v3@sha256:d3cbb9169fabac2cdf2a640df03d15560696c43d77e3483011b74255502b913a AS builder

USER root
WORKDIR /app

COPY . /app

RUN yarn install --frozen-lockfile --production

# -----------------------------
# Stage 2: Runtime
# -----------------------------
FROM quay.io/ukhomeofficedigital/hof-nodejs:24.22.0-alpine3.24-v3@sha256:d3cbb9169fabac2cdf2a640df03d15560696c43d77e3483011b74255502b913a

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
