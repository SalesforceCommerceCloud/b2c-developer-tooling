# Multi-stage Dockerfile for B2C Commerce Metrics Grafana plugin
# Builds both frontend (React/TypeScript) and backend (Go) in one image

# ============================================================================
# Stage 1: Build frontend (module.js + plugin.json + logo)
# ============================================================================
FROM node:22-alpine AS frontend-builder

WORKDIR /build

# Copy package files first for layer caching
COPY b2c-grafana-datasource/package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm install

# Copy frontend source files
COPY b2c-grafana-datasource/.config/ ./.config/
COPY b2c-grafana-datasource/src/ ./src/
COPY b2c-grafana-datasource/tsconfig.json ./
COPY b2c-grafana-datasource/.eslintrc.json ./

# Build frontend (outputs to dist/)
RUN npm run build

# ============================================================================
# Stage 2: Build Go backend for multiple architectures
# ============================================================================
FROM golang:1.26-alpine AS backend-builder

# Install build dependencies
RUN apk add --no-cache git

WORKDIR /go/src/github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages

# Copy both Go modules (plugin + SDK)
COPY b2c-tooling-sdk-go/ ./b2c-tooling-sdk-go/
COPY b2c-grafana-datasource/go.mod b2c-grafana-datasource/go.sum ./b2c-grafana-datasource/
COPY b2c-grafana-datasource/pkg/ ./b2c-grafana-datasource/pkg/

# Download Go dependencies
WORKDIR /go/src/github.com/SalesforceCommerceCloud/b2c-developer-tooling/packages/b2c-grafana-datasource
RUN go mod download

# Build Metrics backend (linux amd64 + arm64)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /gpx_b2c_metrics_linux_amd64 ./pkg
RUN CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o /gpx_b2c_metrics_linux_arm64 ./pkg

# Build CIP backend (linux amd64 + arm64)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /gpx_b2c_cip_linux_amd64 ./pkg/cip
RUN CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o /gpx_b2c_cip_linux_arm64 ./pkg/cip

# ============================================================================
# Stage 3: Assemble final Grafana image with BOTH datasource plugins
# ============================================================================
FROM grafana/grafana:11.2.0

# Allow both unsigned plugins to load
ENV GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=salesforce-b2c-metrics-datasource,salesforce-b2c-cip-datasource

# Anonymous admin for demo (disable in production)
ENV GF_AUTH_ANONYMOUS_ENABLED=true \
    GF_AUTH_ANONYMOUS_ORG_ROLE=Admin \
    GF_SECURITY_ADMIN_USER=admin \
    GF_SECURITY_ADMIN_PASSWORD=admin

USER root

# --- Metrics plugin dir ---
RUN mkdir -p /var/lib/grafana/plugins/salesforce-b2c-metrics-datasource
COPY --from=frontend-builder /build/dist/module.js /var/lib/grafana/plugins/salesforce-b2c-metrics-datasource/
COPY --from=frontend-builder /build/dist/plugin.json /var/lib/grafana/plugins/salesforce-b2c-metrics-datasource/
COPY --from=frontend-builder /build/dist/img/ /var/lib/grafana/plugins/salesforce-b2c-metrics-datasource/img/
COPY --from=backend-builder /gpx_b2c_metrics_linux_amd64 /var/lib/grafana/plugins/salesforce-b2c-metrics-datasource/
COPY --from=backend-builder /gpx_b2c_metrics_linux_arm64 /var/lib/grafana/plugins/salesforce-b2c-metrics-datasource/

# --- CIP plugin dir ---
RUN mkdir -p /var/lib/grafana/plugins/salesforce-b2c-cip-datasource
COPY --from=frontend-builder /build/dist/cip/module.js /var/lib/grafana/plugins/salesforce-b2c-cip-datasource/
COPY --from=frontend-builder /build/dist/cip/plugin.json /var/lib/grafana/plugins/salesforce-b2c-cip-datasource/
COPY --from=frontend-builder /build/dist/cip/img/ /var/lib/grafana/plugins/salesforce-b2c-cip-datasource/img/
COPY --from=backend-builder /gpx_b2c_cip_linux_amd64 /var/lib/grafana/plugins/salesforce-b2c-cip-datasource/
COPY --from=backend-builder /gpx_b2c_cip_linux_arm64 /var/lib/grafana/plugins/salesforce-b2c-cip-datasource/

RUN chmod +x /var/lib/grafana/plugins/salesforce-b2c-metrics-datasource/gpx_b2c_metrics_linux_* \
    && chmod +x /var/lib/grafana/plugins/salesforce-b2c-cip-datasource/gpx_b2c_cip_linux_*

USER grafana

EXPOSE 3000
CMD ["/run.sh"]
