#!/usr/bin/env bash

export SFCC_MRT_PROJECT=cli
export REALM="zzpq"
export SFCC_CLIENT_ID="a0a4deb0-5e03-477b-bfdc-e42ccfae6161"

b2c ods create -r $REALM --wait --ttl 0

# create mrt env called chuck in the cli project
b2c mrt env create chuck --name chuck \
  --allow-cookies \
  --proxy api=kv7kzm78.api.commercecloud.salesforce.com \
  --proxy einstein=api.cquotient.com

# construct redirect-uri from ssr_external_hostname above and don't use localhost:3000
b2c slas client create \
  --channels MarketStreet \
  --tenant-id zzpq_014 \
  --short-code kv7kzm78 \
  --redirect-uri https://myproject-chuck.sfdc-8tgtt5-ecom1.exp-delivery.com/callback,http://localhost:3000/callback \
  --default-scopes

# get clientId and COMMERCE_API_SLAS_SECRET from the output of the previous command and callback from the redirect-uri above
b2c mrt env var set -e chuck \
  PUBLIC__app__commerce__api__clientId=5810be72-3b2f-49bc-8ca1-eb88119de2fa \
  PUBLIC__app__commerce__api__organizationId=f_ecom_zzpq_014 \
  PUBLIC__app__commerce__api__siteId=RefArch \
  PUBLIC__app__commerce__api__shortCode= \
  PUBLIC__app__commerce__api__callback=https://myproject-chuck.sfdc-8tgtt5-ecom1.exp-delivery.com/callback \
  PUBLIC__app__commerce__api__privateKeyEnabled=true \
  COMMERCE_API_SLAS_SECRET=sk_kasdjlkjsalkjasd

# import market street data from storefront-datasets repo
b2c job import --server zzpq-014.dx.commercecloud.salesforce.com ~/code/storefront-datasets/demo_data_marketstreet

b2c code deploy
b2c mrt push -e headertest -p cli -b ~/code/SFCC-Odyssey/packages/template-retail-rsc-app/build --ssr-only='ssr.js,ssr.mjs,chunk.mjs,server/**/*'


