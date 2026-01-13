# Form XML Reference

Complete reference for B2C Commerce form definitions.

## XML Schema

```xml
<?xml version="1.0" encoding="UTF-8"?>
<form xmlns="http://www.demandware.com/xml/form/2008-04-19">
    <!-- Fields, groups, lists, and actions -->
</form>
```

## Field Element

### All Attributes

```xml
<field
    formid="fieldName"          <!-- Required: unique identifier -->
    label="resource.key"        <!-- Resource key for label -->
    type="string"               <!-- Required: string|integer|number|boolean|date -->
    mandatory="true"            <!-- Required field (default: false) -->
    default="value"             <!-- Default value -->
    max-length="100"            <!-- Max string length -->
    min-length="1"              <!-- Min string length -->
    max="1000"                  <!-- Max numeric value -->
    min="0"                     <!-- Min numeric value -->
    regexp="^pattern$"          <!-- Validation regex -->
    format="yyyy-MM-dd"         <!-- Date format -->
    binding="object.property"   <!-- Object binding path -->
    validation="${script}"      <!-- Custom validation script -->
    description="resource.key"  <!-- Field description resource -->
    missing-error="error.key"   <!-- Error when mandatory field empty -->
    parse-error="error.key"     <!-- Error when format/type invalid -->
    range-error="error.key"     <!-- Error when out of range -->
    value-error="error.key"     <!-- General validation error -->
    checked-value="yes"         <!-- Value when boolean checked -->
    unchecked-value="no"        <!-- Value when boolean unchecked -->
/>
```

## Field Types

### String Field

```xml
<field formid="firstName" type="string"
       label="form.firstname.label"
       mandatory="true"
       max-length="50"
       missing-error="form.firstname.required"/>

<field formid="email" type="string"
       label="form.email.label"
       mandatory="true"
       regexp="^[\w.%+-]+@[\w.-]+\.\w{2,6}$"
       parse-error="form.email.invalid"/>

<field formid="phone" type="string"
       label="form.phone.label"
       regexp="^\+?[\d\s-]{10,20}$"
       parse-error="form.phone.invalid"/>
```

### Integer Field

```xml
<field formid="quantity" type="integer"
       label="form.quantity.label"
       mandatory="true"
       min="1"
       max="99"
       default="1"
       range-error="form.quantity.range"/>
```

### Number Field (Decimal)

```xml
<field formid="amount" type="number"
       label="form.amount.label"
       min="0.01"
       max="10000.00"
       range-error="form.amount.range"/>
```

### Boolean Field

```xml
<field formid="subscribe" type="boolean"
       label="form.subscribe.label"
       checked-value="yes"
       unchecked-value="no"/>

<field formid="termsAccepted" type="boolean"
       label="form.terms.label"
       mandatory="true"
       missing-error="form.terms.required"/>
```

### Date Field

```xml
<field formid="birthDate" type="date"
       label="form.birthdate.label"
       format="MM/dd/yyyy"
       parse-error="form.birthdate.invalid"/>

<field formid="startDate" type="date"
       label="form.startdate.label"
       format="yyyy-MM-dd"
       mandatory="true"/>
```

## Validation Patterns

### Common Regular Expressions

```xml
<!-- Email -->
<field formid="email" regexp="^[\w.%+-]+@[\w.-]+\.\w{2,6}$"/>

<!-- US Phone -->
<field formid="phone" regexp="^\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$"/>

<!-- US Zip Code -->
<field formid="postalCode" regexp="^\d{5}(-\d{4})?$"/>

<!-- Credit Card (basic) -->
<field formid="cardNumber" regexp="^\d{13,19}$"/>

<!-- CVV -->
<field formid="cvv" regexp="^\d{3,4}$"/>

<!-- URL -->
<field formid="website" regexp="^https?://[\w.-]+\.\w{2,}"/>

<!-- Alpha only -->
<field formid="name" regexp="^[A-Za-z\s'-]+$"/>

<!-- Alphanumeric -->
<field formid="code" regexp="^[A-Za-z0-9]+$"/>
```

### Custom Validation Script

```xml
<field formid="password" type="string"
       validation="${require('*/cartridge/scripts/forms/validation').passwordStrength(formfield)}"
       range-error="form.password.weak"/>
```

**Validation script:**
```javascript
// scripts/forms/validation.js
exports.passwordStrength = function(formfield) {
    var password = formfield.value;
    if (!password || password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;  // Uppercase
    if (!/[a-z]/.test(password)) return false;  // Lowercase
    if (!/[0-9]/.test(password)) return false;  // Number
    return true;
};

exports.matchField = function(formfield, otherFieldId) {
    var form = formfield.parent;
    return formfield.value === form[otherFieldId].value;
};
```

## Groups

Group related fields:

```xml
<group formid="billingAddress">
    <field formid="firstName" type="string" mandatory="true"/>
    <field formid="lastName" type="string" mandatory="true"/>
    <field formid="address1" type="string" mandatory="true"/>
    <field formid="address2" type="string"/>
    <field formid="city" type="string" mandatory="true"/>
    <field formid="state" type="string" mandatory="true"/>
    <field formid="postalCode" type="string" mandatory="true"/>
    <field formid="country" type="string" mandatory="true"/>
</group>
```

**Access in controller:**
```javascript
var form = server.forms.getForm('checkout');
var firstName = form.billingAddress.firstName.value;
var city = form.billingAddress.city.value;
```

## Lists

Repeating field groups:

```xml
<list formid="lineItems" max="100">
    <field formid="productId" type="string" mandatory="true"/>
    <field formid="quantity" type="integer" min="1" default="1"/>
    <field formid="note" type="string" max-length="255"/>
</list>
```

**Access in controller:**
```javascript
var form = server.forms.getForm('order');
var items = form.lineItems;
for (var i = 0; i < items.length; i++) {
    var productId = items[i].productId.value;
    var quantity = items[i].quantity.value;
}
```

## Actions

```xml
<!-- Validates form before action -->
<action formid="submit" valid-form="true"/>
<action formid="save" valid-form="true"/>

<!-- Skips validation -->
<action formid="cancel" valid-form="false"/>
<action formid="back" valid-form="false"/>
<action formid="clear" valid-form="false"/>
```

**In template:**
```html
<button type="submit" name="submit">Submit</button>
<button type="submit" name="cancel">Cancel</button>
```

**In controller:**
```javascript
if (req.form.submit) {
    // Submit button clicked, form.valid reflects validation
}
if (req.form.cancel) {
    // Cancel clicked, no validation performed
    res.redirect(URLUtils.url('Account-Show'));
}
```

## Object Binding

Bind fields to B2C objects:

```xml
<field formid="firstName" type="string" binding="profile.firstName"/>
<field formid="email" type="string" binding="profile.email"/>
```

**Copy to object:**
```javascript
var form = server.forms.getForm('profile');
form.copyTo(customer.profile);
```

**Copy from object:**
```javascript
form.copyFrom(customer.profile);
```

## Complete Examples

### Login Form

```xml
<?xml version="1.0" encoding="UTF-8"?>
<form xmlns="http://www.demandware.com/xml/form/2008-04-19">
    <field formid="username" type="string"
           label="form.login.username"
           mandatory="true"
           regexp="^[\w.%+-]+@[\w.-]+\.\w{2,6}$"
           missing-error="form.login.username.missing"
           parse-error="form.login.username.invalid"/>

    <field formid="password" type="string"
           label="form.login.password"
           mandatory="true"
           missing-error="form.login.password.missing"/>

    <field formid="rememberMe" type="boolean"
           label="form.login.remember"/>

    <action formid="login" valid-form="true"/>
    <action formid="forgotPassword" valid-form="false"/>
</form>
```

### Address Form

```xml
<?xml version="1.0" encoding="UTF-8"?>
<form xmlns="http://www.demandware.com/xml/form/2008-04-19">
    <field formid="firstName" type="string"
           label="form.address.firstname"
           mandatory="true"
           max-length="50"
           binding="address.firstName"/>

    <field formid="lastName" type="string"
           label="form.address.lastname"
           mandatory="true"
           max-length="50"
           binding="address.lastName"/>

    <field formid="address1" type="string"
           label="form.address.line1"
           mandatory="true"
           max-length="100"
           binding="address.address1"/>

    <field formid="address2" type="string"
           label="form.address.line2"
           max-length="100"
           binding="address.address2"/>

    <field formid="city" type="string"
           label="form.address.city"
           mandatory="true"
           max-length="50"
           binding="address.city"/>

    <field formid="state" type="string"
           label="form.address.state"
           mandatory="true"
           binding="address.stateCode"/>

    <field formid="postalCode" type="string"
           label="form.address.postalcode"
           mandatory="true"
           regexp="^\d{5}(-\d{4})?$"
           parse-error="form.address.postalcode.invalid"
           binding="address.postalCode"/>

    <field formid="country" type="string"
           label="form.address.country"
           mandatory="true"
           default="US"
           binding="address.countryCode"/>

    <field formid="phone" type="string"
           label="form.address.phone"
           regexp="^\+?[\d\s.-]{10,20}$"
           parse-error="form.address.phone.invalid"
           binding="address.phone"/>

    <action formid="save" valid-form="true"/>
    <action formid="cancel" valid-form="false"/>
</form>
```

### Registration Form with Password Confirmation

```xml
<?xml version="1.0" encoding="UTF-8"?>
<form xmlns="http://www.demandware.com/xml/form/2008-04-19">
    <field formid="email" type="string"
           label="form.register.email"
           mandatory="true"
           regexp="^[\w.%+-]+@[\w.-]+\.\w{2,6}$"
           missing-error="form.register.email.missing"
           parse-error="form.register.email.invalid"/>

    <field formid="password" type="string"
           label="form.register.password"
           mandatory="true"
           min-length="8"
           validation="${require('*/cartridge/scripts/forms/validation').passwordStrength(formfield)}"
           missing-error="form.register.password.missing"
           range-error="form.register.password.weak"/>

    <field formid="confirmPassword" type="string"
           label="form.register.confirmpassword"
           mandatory="true"
           missing-error="form.register.confirmpassword.missing"/>

    <field formid="firstName" type="string"
           label="form.register.firstname"
           mandatory="true"
           max-length="50"/>

    <field formid="lastName" type="string"
           label="form.register.lastname"
           mandatory="true"
           max-length="50"/>

    <field formid="acceptTerms" type="boolean"
           label="form.register.terms"
           mandatory="true"
           missing-error="form.register.terms.required"/>

    <action formid="register" valid-form="true"/>
</form>
```
