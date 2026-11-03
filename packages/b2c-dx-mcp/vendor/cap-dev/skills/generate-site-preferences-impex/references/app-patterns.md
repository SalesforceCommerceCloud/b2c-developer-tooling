# Common Site Preference Patterns by App Type

This reference contains pre-built site preference patterns for common commerce app domains. Use these as templates when generating site preferences for specific app types.

## Tax App Preferences

```xml
<custom-attribute-definitions>
    <attribute-definition attribute-id="taxCalculationEnabled">
        <display-name xml:lang="x-default">Enable Tax Calculation</display-name>
        <type>boolean</type>
        <default-value>false</default-value>
    </attribute-definition>

    <attribute-definition attribute-id="taxCompanyCode">
        <display-name xml:lang="x-default">Company Code</display-name>
        <type>string</type>
        <min-length>0</min-length>
    </attribute-definition>

    <attribute-definition attribute-id="taxEnvironment">
        <display-name xml:lang="x-default">Environment</display-name>
        <type>enum-of-string</type>
        <value-definitions>
            <value-definition>
                <display xml:lang="x-default">Sandbox</display>
                <value>sandbox</value>
            </value-definition>
            <value-definition>
                <display xml:lang="x-default">Production</display>
                <value>production</value>
            </value-definition>
        </value-definitions>
        <default-value>sandbox</default-value>
    </attribute-definition>

    <attribute-definition attribute-id="taxCommitOnInvoice">
        <display-name xml:lang="x-default">Commit Tax on Invoice</display-name>
        <description xml:lang="x-default">Automatically commit tax when invoice is created</description>
        <type>boolean</type>
        <default-value>true</default-value>
    </attribute-definition>
</custom-attribute-definitions>
```

## Payment App Preferences

```xml
<custom-attribute-definitions>
    <attribute-definition attribute-id="paymentEnabled">
        <display-name xml:lang="x-default">Enable Payment Gateway</display-name>
        <type>boolean</type>
        <default-value>false</default-value>
    </attribute-definition>

    <attribute-definition attribute-id="paymentMerchantId">
        <display-name xml:lang="x-default">Merchant ID</display-name>
        <type>string</type>
        <min-length>0</min-length>
    </attribute-definition>

    <attribute-definition attribute-id="paymentPublicKey">
        <display-name xml:lang="x-default">Public API Key</display-name>
        <type>string</type>
        <min-length>0</min-length>
    </attribute-definition>

    <attribute-definition attribute-id="paymentSecretKey">
        <display-name xml:lang="x-default">Secret API Key</display-name>
        <type>password</type>
        <min-length>0</min-length>
    </attribute-definition>

    <attribute-definition attribute-id="paymentTestMode">
        <display-name xml:lang="x-default">Test Mode</display-name>
        <type>boolean</type>
        <default-value>true</default-value>
    </attribute-definition>

    <attribute-definition attribute-id="paymentEnabledMethods">
        <display-name xml:lang="x-default">Enabled Payment Methods</display-name>
        <type>set-of-string</type>
        <value-definitions>
            <value-definition>
                <display xml:lang="x-default">Credit Card</display>
                <value>credit_card</value>
            </value-definition>
            <value-definition>
                <display xml:lang="x-default">Debit Card</display>
                <value>debit_card</value>
            </value-definition>
            <value-definition>
                <display xml:lang="x-default">PayPal</display>
                <value>paypal</value>
            </value-definition>
            <value-definition>
                <display xml:lang="x-default">Apple Pay</display>
                <value>apple_pay</value>
            </value-definition>
        </value-definitions>
    </attribute-definition>
</custom-attribute-definitions>
```

## Shipping App Preferences

```xml
<custom-attribute-definitions>
    <attribute-definition attribute-id="shippingEnabled">
        <display-name xml:lang="x-default">Enable Shipping Integration</display-name>
        <type>boolean</type>
        <default-value>false</default-value>
    </attribute-definition>

    <attribute-definition attribute-id="shippingAccountNumber">
        <display-name xml:lang="x-default">Carrier Account Number</display-name>
        <type>string</type>
        <min-length>0</min-length>
    </attribute-definition>

    <attribute-definition attribute-id="shippingOriginZip">
        <display-name xml:lang="x-default">Origin Zip Code</display-name>
        <type>string</type>
        <min-length>0</min-length>
    </attribute-definition>

    <attribute-definition attribute-id="shippingEnabledServices">
        <display-name xml:lang="x-default">Enabled Shipping Services</display-name>
        <type>set-of-string</type>
        <value-definitions>
            <value-definition>
                <display xml:lang="x-default">Ground</display>
                <value>ground</value>
            </value-definition>
            <value-definition>
                <display xml:lang="x-default">2-Day</display>
                <value>2day</value>
            </value-definition>
            <value-definition>
                <display xml:lang="x-default">Overnight</display>
                <value>overnight</value>
            </value-definition>
        </value-definitions>
    </attribute-definition>
</custom-attribute-definitions>
```

## Reviews/Ratings App Preferences

```xml
<custom-attribute-definitions>
    <attribute-definition attribute-id="reviewsEnabled">
        <display-name xml:lang="x-default">Enable Reviews</display-name>
        <type>boolean</type>
        <default-value>false</default-value>
    </attribute-definition>

    <attribute-definition attribute-id="reviewsClientId">
        <display-name xml:lang="x-default">Client ID</display-name>
        <type>string</type>
        <min-length>0</min-length>
    </attribute-definition>

    <attribute-definition attribute-id="reviewsAutoModeration">
        <display-name xml:lang="x-default">Auto Moderation</display-name>
        <description xml:lang="x-default">Automatically moderate reviews before publishing</description>
        <type>boolean</type>
        <default-value>true</default-value>
    </attribute-definition>

    <attribute-definition attribute-id="reviewsMaxPerPage">
        <display-name xml:lang="x-default">Reviews Per Page</display-name>
        <type>integer</type>
        <min-value>1</min-value>
        <max-value>100</max-value>
        <default-value>10</default-value>
    </attribute-definition>

    <attribute-definition attribute-id="reviewsMinimumRating">
        <display-name xml:lang="x-default">Minimum Rating to Display</display-name>
        <type>decimal</type>
        <min-value>0.0</min-value>
        <max-value>5.0</max-value>
        <default-value>0.0</default-value>
        <scale>1</scale>
    </attribute-definition>
</custom-attribute-definitions>
```

## When to use which pattern

- **Tax app:** Use when app handles tax calculation, compliance, or reporting
- **Payment app:** Use for payment gateways, processors, or alternative payment methods
- **Shipping app:** Use for carrier integrations, rate calculation, or fulfillment
- **Reviews/ratings app:** Use for review platforms, UGC, or product feedback systems

## Customization

These patterns are starting points. Adjust as needed:
1. Add app-specific attributes
2. Modify enum values based on provider options
3. Add localization for international markets
4. Adjust defaults based on common merchant configurations
