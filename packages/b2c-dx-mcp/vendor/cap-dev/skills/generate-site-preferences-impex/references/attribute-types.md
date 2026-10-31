# Site Preference Attribute Types Reference

Complete reference for all supported SFCC site preference attribute types with examples.

## Boolean

```xml
<attribute-definition attribute-id="appEnabled">
    <display-name xml:lang="x-default">Enable Feature</display-name>
    <description xml:lang="x-default">Enable or disable this feature</description>
    <type>boolean</type>
    <mandatory-flag>false</mandatory-flag>
    <externally-managed-flag>false</externally-managed-flag>
    <default-value>false</default-value>
</attribute-definition>
```

## String

```xml
<attribute-definition attribute-id="appApiKey">
    <display-name xml:lang="x-default">API Key</display-name>
    <type>string</type>
    <mandatory-flag>false</mandatory-flag>
    <externally-managed-flag>false</externally-managed-flag>
    <min-length>0</min-length>
    <max-length>255</max-length>
    <default-value></default-value>
</attribute-definition>
```

## Text (long)

```xml
<attribute-definition attribute-id="appCustomConfig">
    <display-name xml:lang="x-default">Custom Configuration</display-name>
    <type>text</type>
    <mandatory-flag>false</mandatory-flag>
    <externally-managed-flag>false</externally-managed-flag>
    <default-value>{}</default-value>
</attribute-definition>
```

## Integer

```xml
<attribute-definition attribute-id="appMaxItems">
    <display-name xml:lang="x-default">Maximum Items</display-name>
    <type>integer</type>
    <mandatory-flag>false</mandatory-flag>
    <externally-managed-flag>false</externally-managed-flag>
    <min-value>1</min-value>
    <max-value>100</max-value>
    <default-value>10</default-value>
</attribute-definition>
```

## Decimal

```xml
<attribute-definition attribute-id="appThreshold">
    <display-name xml:lang="x-default">Threshold</display-name>
    <type>decimal</type>
    <mandatory-flag>false</mandatory-flag>
    <externally-managed-flag>false</externally-managed-flag>
    <min-value>0.0</min-value>
    <max-value>5.0</max-value>
    <default-value>0.0</default-value>
    <scale>1</scale>
</attribute-definition>
```

## Enum (dropdown)

```xml
<attribute-definition attribute-id="appEnvironment">
    <display-name xml:lang="x-default">Environment</display-name>
    <type>enum-of-string</type>
    <mandatory-flag>false</mandatory-flag>
    <externally-managed-flag>false</externally-managed-flag>
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
```

## Set of String (multiple selection)

```xml
<attribute-definition attribute-id="appEnabledFeatures">
    <display-name xml:lang="x-default">Enabled Features</display-name>
    <type>set-of-string</type>
    <mandatory-flag>false</mandatory-flag>
    <externally-managed-flag>false</externally-managed-flag>
    <value-definitions>
        <value-definition>
            <display xml:lang="x-default">Feature 1</display>
            <value>feature1</value>
        </value-definition>
        <value-definition>
            <display xml:lang="x-default">Feature 2</display>
            <value>feature2</value>
        </value-definition>
    </value-definitions>
</attribute-definition>
```

## Email

```xml
<attribute-definition attribute-id="appNotificationEmail">
    <display-name xml:lang="x-default">Notification Email</display-name>
    <type>email</type>
    <mandatory-flag>false</mandatory-flag>
    <externally-managed-flag>false</externally-managed-flag>
    <default-value></default-value>
</attribute-definition>
```

## Password (encrypted)

```xml
<attribute-definition attribute-id="appApiSecret">
    <display-name xml:lang="x-default">API Secret</display-name>
    <type>password</type>
    <mandatory-flag>false</mandatory-flag>
    <externally-managed-flag>false</externally-managed-flag>
    <min-length>0</min-length>
</attribute-definition>
```

## Localization

Add multi-language support:

```xml
<attribute-definition attribute-id="appEnabled">
    <display-name xml:lang="x-default">Enable Feature</display-name>
    <display-name xml:lang="de">Funktion aktivieren</display-name>
    <display-name xml:lang="fr">Activer la fonctionnalité</display-name>
    <display-name xml:lang="es">Habilitar función</display-name>

    <description xml:lang="x-default">Enable or disable this feature</description>
    <description xml:lang="de">Aktivieren oder deaktivieren Sie diese Funktion</description>
    <description xml:lang="fr">Activer ou désactiver cette fonctionnalité</description>
    <description xml:lang="es">Habilitar o deshabilitar esta función</description>

    <type>boolean</type>
    <default-value>false</default-value>
</attribute-definition>
```

**Supported language codes:**
`x-default`, `de`, `fr`, `es`, `it`, `ja`, `zh`, `pt`, `nl`
