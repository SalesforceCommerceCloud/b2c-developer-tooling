#!/usr/bin/env bash
# b2c-cli e2e cli tests
# required env vars
# SFCC_CLIENT_ID
# SFCC_CLIENT_SECRET
# SFCC_SHORTCODE
# TEST_REALM

set -e


# 1. Create on demand sandbox

# Create ODS will automatically configure webdav and ocapi for the SFCC_CLIENT_ID we're using
# just like sfcc-ci
ODS_CREATE_RESULT=$(../../bin/run.js ods create --realm "$TEST_REALM" --wait --json)

ODS_ID=$(echo "$ODS_CREATE_RESULT" | jq -r '.[0].id')

if [ -z "$ODS_ID" ] || [ "$ODS_ID" == "null" ]; then
  echo "Failed to create on demand sandbox"
  exit 1
fi

echo "Created on demand sandbox with ID: $ODS_ID"

# 2. List on demand sandboxes and verify the created one is present
ODS_LIST_RESULT=$(../../bin/run.js ods list --realm "$TEST_REALM" --json)
ODS_PRESENT=$(echo "$ODS_LIST_RESULT" | jq -r --arg ODS_ID "$ODS_ID" '.[] | select(.id == $ODS_ID) | .id')

if [ "$ODS_PRESENT" != "$ODS_ID" ]; then
  echo "Created on demand sandbox not found in list"
  exit 1
fi

SERVER=$(echo "$ODS_CREATE_RESULT" | jq -r '.[0].server')

# 3. Import code into the created sandbox

IMPORT_RESULT=$(../../bin/run.js code deploy --server --sandbox "$ODS_ID" --source ./test/functional/sample_code --wait --json)
