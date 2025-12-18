#!/usr/bin/env bash
set -euo pipefail

# Configuration - modify these values for your setup
ENV_SLUG="demo15"
ENV_NAME="demo15"
SITE_ID="RefArch"
TENANT_ID="zzpq_013"
ORGANIZATION_ID="f_ecom_zzsa_009"
SHORT_CODE="kv7kzm78"
BUILD_PATH="${BUILD_PATH:-$HOME/code/SFCC-Odyssey/packages/template-retail-rsc-app/build}"

export SFCC_MRT_PROJECT="${SFCC_MRT_PROJECT:-cli}"

echo "=== Step 1: Creating MRT environment ==="
ENV_JSON=$(b2c mrt env create "$ENV_SLUG" --name "$ENV_NAME" --json)
echo "Environment created."

# Extract the external hostname for the callback URL
SSR_EXTERNAL_HOSTNAME=$(echo "$ENV_JSON" | jq -r '.ssr_external_hostname // empty')
if [[ -z "$SSR_EXTERNAL_HOSTNAME" ]]; then
  # Fall back to hostname if external hostname not set
  SSR_EXTERNAL_HOSTNAME=$(echo "$ENV_JSON" | jq -r '.hostname // empty')
fi

if [[ -z "$SSR_EXTERNAL_HOSTNAME" ]]; then
  echo "Warning: Could not determine external hostname from environment. Using localhost."
  CALLBACK_URL="http://localhost:3000/callback"
else
  CALLBACK_URL="https://${SSR_EXTERNAL_HOSTNAME}/callback"
fi
echo "Callback URL: $CALLBACK_URL"

echo ""
echo "=== Step 2: Creating SLAS client ==="
SLAS_JSON=$(b2c slas client create --channels "$SITE_ID" \
  --redirect-uri "$CALLBACK_URL" \
  --default-scopes \
  --tenant-id "$TENANT_ID" \
  --json)
echo "SLAS client created."

# Extract client ID and secret from SLAS response
CLIENT_ID=$(echo "$SLAS_JSON" | jq -r '.clientId')
CLIENT_SECRET=$(echo "$SLAS_JSON" | jq -r '.secret // empty')

if [[ -z "$CLIENT_ID" ]]; then
  echo "Error: Failed to get client ID from SLAS response"
  exit 1
fi

echo "Client ID: $CLIENT_ID"
if [[ -n "$CLIENT_SECRET" ]]; then
  echo "Client Secret: $CLIENT_SECRET (save this - it won't be shown again)"
fi

echo ""
echo "=== Step 3: Setting environment variables ==="
b2c mrt env var set -e "$ENV_SLUG" \
  "PUBLIC__app__commerce__api__clientId=$CLIENT_ID" \
  "PUBLIC__app__commerce__api__organizationId=$ORGANIZATION_ID" \
  "PUBLIC__app__commerce__api__siteId=$SITE_ID" \
  "PUBLIC__app__commerce__api__shortCode=$SHORT_CODE" \
  "PUBLIC__app__commerce__api__proxy=/mobify/proxy/api" \
  "PUBLIC__app__commerce__api__callback=$CALLBACK_URL" \
  "PUBLIC__app__commerce__api__privateKeyEnabled=true" \
  ${CLIENT_SECRET:+"COMMERCE_API_SLAS_SECRET=$CLIENT_SECRET"}

echo ""
echo "=== Step 4: Deploying code ==="
b2c code deploy

echo ""
echo "=== Step 5: Importing job data ==="
b2c job import data/urls

echo ""
echo "=== Step 6: Pushing to MRT ==="
b2c mrt push -e "$ENV_SLUG" -b "$BUILD_PATH"

echo ""
echo "=== Setup Complete ==="
echo "Environment: $ENV_SLUG"
echo "Client ID: $CLIENT_ID"
echo "URL: https://${SSR_EXTERNAL_HOSTNAME:-localhost:3000}"
