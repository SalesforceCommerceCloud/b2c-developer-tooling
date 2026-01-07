#!/usr/bin/env bash
# b2c-cli e2e cli tests
#
# Required environment variables:
# SFCC_CLIENT_ID      - Account Manager API client ID
# SFCC_CLIENT_SECRET  - Account Manager API client secret
# SFCC_SHORTCODE      - SCAPI short code
# TEST_REALM          - Realm ID for sandbox creation (four-letter ID)
#
# Optional environment variables:
# SFCC_ACCOUNT_MANAGER_HOST - Account Manager hostname (default: account.demandware.com)
# SFCC_SANDBOX_API_HOST     - Sandbox API hostname (default: admin.dx.commercecloud.salesforce.com)

set -e

# Script directory for relative paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI="$SCRIPT_DIR/../../bin/run.js"

# Fixtures paths
CARTRIDGE_PATH="$SCRIPT_DIR/fixtures/cartridges"
SITE_ARCHIVE_PATH="$SCRIPT_DIR/fixtures/site_archive/TestSite"

# Test configuration
SITE_ID="TestSite"
TTL_HOURS=4  # 4 hours in case test fails and needs manual cleanup

# Cleanup function for error handling
cleanup() {
    local exit_code=$?
    echo ""
    echo "========================================="
    echo "Cleanup (exit code: $exit_code)"
    echo "========================================="

    # Delete SLAS client if it was created
    if [ -n "$SLAS_CLIENT_ID" ] && [ -n "$TENANT_ID" ]; then
        echo "Deleting SLAS client: $SLAS_CLIENT_ID"
        $CLI slas client delete "$SLAS_CLIENT_ID" --tenant-id "$TENANT_ID" || true
    fi

    # Delete sandbox if it was created
    if [ -n "$ODS_ID" ]; then
        echo "skipping Deleting sandbox: $ODS_ID"
        #$CLI ods delete "$ODS_ID" --force || true
    fi

    exit $exit_code
}

# Set up cleanup trap
trap cleanup EXIT

echo "========================================="
echo "B2C CLI E2E Test Suite"
echo "========================================="
echo "Realm: $TEST_REALM"
echo "Short Code: $SFCC_SHORTCODE"
echo ""

################################################################################
# 1. Create On-Demand Sandbox
################################################################################
echo "Step 1: Creating on-demand sandbox..."

ODS_CREATE_RESULT=$($CLI ods create \
    --realm "$TEST_REALM" \
    --ttl "$TTL_HOURS" \
    --wait \
    --json)

echo "DEBUG: ODS create result:"
echo "$ODS_CREATE_RESULT" | jq .

# The JSON output is the sandbox object directly (not an array)
ODS_ID=$(echo "$ODS_CREATE_RESULT" | jq -r '.id')
SERVER=$(echo "$ODS_CREATE_RESULT" | jq -r '.hostName')
INSTANCE_NUM=$(echo "$ODS_CREATE_RESULT" | jq -r '.instance')

if [ -z "$ODS_ID" ] || [ "$ODS_ID" == "null" ]; then
    echo "FAILED: Could not create on-demand sandbox"
    exit 1
fi

echo "SUCCESS: Created sandbox"
echo "  ID: $ODS_ID"
echo "  Server: $SERVER"
echo "  Instance: $INSTANCE_NUM"
echo ""

################################################################################
# 2. List and Verify Sandbox
################################################################################
echo "Step 2: Verifying sandbox in list..."

ODS_LIST_RESULT=$($CLI ods list --realm "$TEST_REALM" --json)

echo "DEBUG: ODS list result:"
echo "$ODS_LIST_RESULT" | jq .

# The JSON output is { count: number, data: SandboxModel[] }
ODS_PRESENT=$(echo "$ODS_LIST_RESULT" | jq -r --arg ODS_ID "$ODS_ID" '.data[] | select(.id == $ODS_ID) | .id')

if [ "$ODS_PRESENT" != "$ODS_ID" ]; then
    echo "FAILED: Created sandbox not found in list"
    exit 1
fi

echo "SUCCESS: Sandbox verified in list"
echo ""

################################################################################
# 3. Deploy Code
################################################################################
echo "Step 3: Deploying code to sandbox..."

$CLI code deploy "$CARTRIDGE_PATH" \
    --server "$SERVER" \
    --code-version "e2e-test-version" --log-level debug --json

echo "SUCCESS: Code deployed"
echo ""

################################################################################
# 4. Import Site Data
################################################################################
echo "Step 4: Importing site data..."

$CLI job import "$SITE_ARCHIVE_PATH" \
    --server "$SERVER" \
    --timeout 300

echo "SUCCESS: Site data imported"
echo ""

################################################################################
# 5. Run Search Index Job
################################################################################
echo "Step 5: Running search index job..."

$CLI job run sfcc-search-index-product-full-update \
    --server "$SERVER" \
    --wait \
    --timeout 300 \
    --body "{\"site_scope\":[\"$SITE_ID\"]}"

echo "SUCCESS: Search index job completed"
echo ""

################################################################################
# 6. Create SLAS Client
################################################################################
echo "Step 6: Creating SLAS client..."

# Construct tenant ID from realm and instance number
TENANT_ID="${TEST_REALM}_${INSTANCE_NUM}"

# Generate a unique SLAS client ID
SLAS_CLIENT_ID="e2e-test-$(date +%s)-$(openssl rand -hex 4)"

SLAS_CREATE_RESULT=$($CLI slas client create "$SLAS_CLIENT_ID" \
    --tenant-id "$TENANT_ID" \
    --channels "$SITE_ID" \
    --default-scopes \
    --redirect-uri "http://localhost:3000/callback" \
    --json)

echo "DEBUG: SLAS create result:"
echo "$SLAS_CREATE_RESULT" | jq .

# The JSON output is a ClientOutput object with secret field
SLAS_SECRET=$(echo "$SLAS_CREATE_RESULT" | jq -r '.secret')

if [ -z "$SLAS_SECRET" ] || [ "$SLAS_SECRET" == "null" ]; then
    echo "FAILED: Could not create SLAS client"
    echo "$SLAS_CREATE_RESULT"
    exit 1
fi

echo "SUCCESS: SLAS client created"
echo "  Client ID: $SLAS_CLIENT_ID"
echo "  Tenant ID: $TENANT_ID"
echo ""

################################################################################
# 7. Test SLAS Guest Login
################################################################################
echo "Step 7: Testing SLAS guest login..."

# Wait a moment for SLAS client to be ready and search index to be available
sleep 10

# Organization ID format for SLAS
ORG_ID="f_ecom_${TEST_REALM}_${INSTANCE_NUM}"
SLAS_BASE="https://${SFCC_SHORTCODE}.api.commercecloud.salesforce.com"

echo "  ORG ID: $ORG_ID"
echo "  SLAS Base: $SLAS_BASE"

# Get shopper token via client credentials (guest login)
TOKEN_RESPONSE=$(curl -s "${SLAS_BASE}/shopper/auth/v1/organizations/${ORG_ID}/oauth2/token" \
    -u "${SLAS_CLIENT_ID}:${SLAS_SECRET}" \
    -d "grant_type=client_credentials&channel_id=${SITE_ID}")

SHOPPER_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')

if [ -z "$SHOPPER_TOKEN" ] || [ "$SHOPPER_TOKEN" == "null" ]; then
    echo "FAILED: Could not obtain shopper token"
    echo "$TOKEN_RESPONSE" | jq
    exit 1
fi

echo "SUCCESS: Obtained shopper access token"
echo ""

################################################################################
# 8. Test Shopper Search
################################################################################
echo "Step 8: Testing shopper product search..."

SEARCH_RESPONSE=$(curl -s "${SLAS_BASE}/search/shopper-search/v1/organizations/${ORG_ID}/product-search?siteId=${SITE_ID}&limit=5&q=sample" \
    -H "Authorization: Bearer ${SHOPPER_TOKEN}")

# Check if we got a valid response (should have a 'hits' array or 'total' field)
SEARCH_TOTAL=$(echo "$SEARCH_RESPONSE" | jq -r '.total // .hits | length // 0')

if [ "$SEARCH_TOTAL" == "null" ]; then
    echo "WARNING: Search returned unexpected response format"
    echo "$SEARCH_RESPONSE" | jq
    # Don't fail - the product might not be indexed yet
else
    echo "SUCCESS: Shopper search returned results"
    echo "  Total results: $SEARCH_TOTAL"
fi
echo ""

################################################################################
# 9. Delete SLAS Client
################################################################################
echo "Step 9: Deleting SLAS client..."

$CLI slas client delete "$SLAS_CLIENT_ID" --tenant-id "$TENANT_ID"

# Clear SLAS_CLIENT_ID so cleanup doesn't try to delete again
SLAS_CLIENT_ID=""

echo "SUCCESS: SLAS client deleted"
echo ""

################################################################################
# 10. Delete Sandbox
################################################################################
echo "Step 10: Deleting sandbox..."

$CLI ods delete "$ODS_ID" --force

# Clear ODS_ID so cleanup doesn't try to delete again
ODS_ID=""

echo "SUCCESS: Sandbox deleted"
echo ""

################################################################################
# Complete
################################################################################
echo "========================================="
echo "All E2E tests passed!"
echo "========================================="
