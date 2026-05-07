# Avalara Tax Integration for Commerce Cloud

This cartridge integrates Avalara AvaTax with Salesforce Commerce Cloud to provide real-time tax calculation, address validation, and tax reporting capabilities.

## Package manifest

This package includes a root-level **`commerce-app.json`** manifest: app identity, domain, version, capabilities, cartridge and Storefront Next extension paths, and other extensible metadata. Post-install checklist tasks remain in **`app-configuration/tasksList.json`**. Tools and registries can read `commerce-app.json` for package-level metadata without relying on an external registry manifest alone.

## Overview

The Avalara Tax App provides:

- Real-time tax calculation for orders
- Address validation for US and Canadian addresses
- Tax breakdown details (federal, state, etc.)
- Transaction management and commitment to AvaTax
- Support for both SFRA and SiteGenesis architectures

## Cartridge Structure

### Business Manager Cartridges

- **bm_avatax**: Business Manager extensions for AvaTax configuration and management

### Site Cartridges

- **int_avatax**: Core AvaTax integration cartridge with controllers and scripts
- **int_avatax_sfra**: SFRA-specific extensions for AvaTax integration

### Storefront Next

- **storefront-next/src/extensions/avatax-tax-breakdown**: Tax breakdown component for Storefront Next

## Installation

### Prerequisites

- Avalara AvaTax account with API credentials
- Company Code configured in AvaTax

### Steps

1. **Import Metadata and Services**

   ```
   impex/install/meta/system-objecttype-extensions.xml
   impex/install/services.xml
   impex/install/sites/SITEID/preferences.xml
   ```

2. **Configure AvaTax Service Credentials**
   - Navigate to Administration > Operations > Services
   - Update `credentials.avatax.rest` with your AvaTax credentials:
     - URL: Use sandbox URL for testing or production URL for live transactions
     - User ID: Your AvaTax account ID
     - Password: Your AvaTax license key

3. **Configure Site Preferences**
   - Navigate to Merchant Tools > Site Preferences > Custom Preferences > AvaTax
   - Configure the following:
     - **Enable Avatax**: Set to Yes to enable tax calculation
     - **Enable Address Validation**: Enable address validation for US/Canada
     - **Company Code**: Your AvaTax company code
     - **Ship From Address**: Configure your origin address
     - **Document Commit Settings**: Configure transaction commitment behavior

4. **Upload Cartridges**
   - Upload cartridges to your instance
   - Add to cartridge path in site settings:
     - For SFRA sites: `int_avatax_sfra:int_avatax:[other_cartridges]`
     - For SiteGenesis sites: `int_avatax:[other_cartridges]`
   - Add to Business Manager cartridge path: `bm_avatax:[other_bm_cartridges]`

## Configuration

### Site Preferences (AvaTax Group)

| Preference                         | Description                                        | Default         |
| ---------------------------------- | -------------------------------------------------- | --------------- |
| **ATEnable**                       | Enable/disable AvaTax integration                  | true            |
| **ATEnableAddressValidation**      | Enable address validation for US/Canada            | true            |
| **ATEnableTesting**                | Enable test controllers for transaction management | true            |
| **AtDocumentCommitAllowed**        | Save transactions to AvaTax                        | true            |
| **AtCommitTransaction**            | Auto-commit transactions on successful payment     | false           |
| **AtCompanyCode**                  | Your AvaTax company code                           | (required)      |
| **ATCustomerCode**                 | Customer identifier to send to AvaTax              | customer_number |
| **AtDefaultShippingMethodTaxCode** | Tax code for shipping                              | FR              |
| **AtShipFromLocationCode**         | AvaTax location code                               | (optional)      |
| **AtShipFrom[Address Fields]**     | Origin address for tax calculation                 | (required)      |

### Service Configuration

The integration uses the following service:

- **Service ID**: `avatax.rest.all`
- **Credential ID**: `credentials.avatax.rest`
- **Profile ID**: `profile.avatax.rest`

## Features

### Tax Calculation

- Real-time tax calculation during checkout
- Line-item level tax breakdown
- Shipping tax calculation
- Promotion and adjustment handling

### Address Validation

- Validates US and Canadian addresses using AvaTax API
- Returns normalized addresses
- Provides address suggestions

### Transaction Management

- Create tax documents in AvaTax
- Commit transactions on order creation
- Void/cancel transactions for order cancellations
- Test controllers for transaction management (when enabled)

### Custom Attributes

The following custom attributes are added to the Basket object:

- **commerceTaxApp_TaxDetails**: Complete tax breakdown information
- **commerceTaxApp_federal_tax_amount**: Federal tax amount
- **commerceTaxApp_state_tax_amount**: State tax amount

## Testing

When **ATEnableTesting** is enabled, test controllers/pipelines are available for:

- Voiding transactions
- Modifying transactions
- Testing address validation
- Reviewing tax calculations

## Uninstallation

To uninstall the integration:

1. Remove cartridges from cartridge paths
2. Import uninstall metadata: `impex/uninstall/`
3. Disable the AvaTax service

## Support

For AvaTax API documentation, visit: https://developer.avalara.com/

## Version History

### v1.0.0

- Initial release
- Tax calculation for orders
- Address validation
- SFRA and SiteGenesis support
- Transaction commitment
