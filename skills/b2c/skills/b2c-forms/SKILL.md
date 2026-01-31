---
name: b2c-forms
description: Create forms with validation in SFRA patterns for B2C Commerce. Use when building checkout forms, account forms, or any form with field definitions, validation rules, and error handling. Covers form XML definitions, server-side validation, and template rendering.
---

# Forms Skill

This skill guides you through creating forms with validation in Salesforce B2C Commerce using the SFRA patterns.

## Overview

B2C Commerce forms consist of three parts:

1. **Form Definition** - XML file defining fields, validation, and actions
2. **Controller Logic** - Server-side form handling and processing
3. **Template** - ISML template rendering the HTML form

## File Location

Forms are defined in the cartridge's `forms` directory:

```
/my-cartridge
    /cartridge
        /forms
            /default              # Default locale
                profile.xml
                contact.xml
            /de_DE               # German-specific (optional)
                address.xml
```

## Form Definition (XML)

### Basic Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<form xmlns="http://www.demandware.com/xml/form/2008-04-19">
    <field formid="email" label="form.email.label" type="string"
           mandatory="true" max-length="50"
           regexp="^[\w.%+-]+@[\w.-]+\.\w{2,6}$"
           parse-error="form.email.invalid"/>

    <field formid="password" label="form.password.label" type="string"
           mandatory="true" min-length="8" max-length="255"
           missing-error="form.password.required"/>

    <field formid="rememberMe" label="form.remember.label" type="boolean"/>

    <action formid="submit" valid-form="true"/>
    <action formid="cancel" valid-form="false"/>
</form>
```

### Field Types

| Type | Description | HTML Input |
|------|-------------|------------|
| `string` | Text input | `<input type="text">` |
| `integer` | Whole number | `<input type="number">` |
| `number` | Decimal number | `<input type="number">` |
| `boolean` | Checkbox | `<input type="checkbox">` |
| `date` | Date value | `<input type="date">` |

### Key Field Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `formid` | Field identifier (required) | `formid="email"` |
| `label` | Resource key for label | `label="form.email.label"` |
| `type` | Data type (required) | `type="string"` |
| `mandatory` | Required field | `mandatory="true"` |
| `max-length` | Max string length | `max-length="100"` |
| `min-length` | Min string length | `min-length="8"` |
| `regexp` | Validation pattern | `regexp="^\d{5}$"` |

### Validation Error Messages

| Attribute | When Triggered |
|-----------|----------------|
| `missing-error` | Mandatory field is empty |
| `parse-error` | Value doesn't match regexp or type |
| `range-error` | Value outside min/max range |
| `value-error` | General validation failure |

See [Form XML Reference](references/FORM-XML.md) for complete field attributes, groups, lists, and validation patterns.

## Controller Logic (SFRA)

### Rendering a Form

```javascript
'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.get('Show',
    csrfProtection.generateToken,
    function (req, res, next) {
        var form = server.forms.getForm('profile');
        form.clear();  // Reset previous values

        res.render('account/profile', {
            profileForm: form
        });
        next();
    }
);

module.exports = server.exports();
```

### Processing Form Submission

```javascript
server.post('Submit',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var form = server.forms.getForm('profile');

        if (!form.valid) {
            res.json({
                success: false,
                fields: getFormErrors(form)
            });
            return next();
        }

        // Access form values
        var email = form.email.value;
        var firstName = form.firstName.value;

        // Process and save data
        this.on('route:BeforeComplete', function () {
            var Transaction = require('dw/system/Transaction');
            Transaction.wrap(function () {
                customer.profile.email = email;
                customer.profile.firstName = firstName;
            });
        });

        res.json({ success: true });
        next();
    }
);

function getFormErrors(form) {
    var errors = {};
    Object.keys(form).forEach(function (key) {
        if (form[key] && form[key].error) {
            errors[key] = form[key].error;
        }
    });
    return errors;
}
```

### Prepopulating Forms

```javascript
server.get('Edit', function (req, res, next) {
    var form = server.forms.getForm('profile');
    form.clear();

    var profile = req.currentCustomer.profile;
    form.firstName.value = profile.firstName;
    form.lastName.value = profile.lastName;
    form.email.value = profile.email;

    res.render('account/editProfile', { profileForm: form });
    next();
});
```

## Template (ISML)

### Basic Form Template

```html
<form action="${pdict.actionUrl}" method="POST" name="profile-form"
      class="form-horizontal" data-action="${URLUtils.url('Profile-Submit')}">

    <!-- CSRF Token -->
    <input type="hidden" name="${pdict.csrf.tokenName}" value="${pdict.csrf.token}"/>

    <div class="form-group ${pdict.profileForm.email.mandatory ? 'required' : ''}">
        <label for="email" class="form-control-label">
            ${Resource.msg('form.email.label', 'forms', null)}
        </label>
        <input type="email"
               id="email"
               name="email"
               class="form-control ${pdict.profileForm.email.error ? 'is-invalid' : ''}"
               value="${pdict.profileForm.email.value || ''}"
               <isif condition="${pdict.profileForm.email.mandatory}">required</isif>
               maxlength="${pdict.profileForm.email.maxLength || 50}"/>
        <isif condition="${pdict.profileForm.email.error}">
            <div class="invalid-feedback">${pdict.profileForm.email.error}</div>
        </isif>
    </div>

    <button type="submit" class="btn btn-primary">
        ${Resource.msg('button.submit', 'forms', null)}
    </button>
</form>
```

## Localization

Form labels and errors use resource bundles:

**forms.properties:**
```properties
form.email.label=Email Address
form.email.required=Email is required
form.email.invalid=Please enter a valid email address
form.password.label=Password
button.submit=Submit
```

**forms_de_DE.properties:**
```properties
form.email.label=E-Mail-Adresse
form.email.required=E-Mail ist erforderlich
```

## Best Practices

1. **Always use CSRF protection** for form submissions
2. **Clear forms** before displaying to reset state
3. **Use resource keys** for labels and errors (localization)
4. **Validate server-side** even with client-side validation
5. **Use `route:BeforeComplete`** for database operations
6. **Return JSON** for AJAX form submissions

## Detailed Reference

For comprehensive form patterns:
- [Form XML Reference](references/FORM-XML.md) - Complete XML schema, validation patterns, and examples
