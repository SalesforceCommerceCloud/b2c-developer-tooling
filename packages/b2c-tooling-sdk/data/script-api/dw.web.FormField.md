<!-- prettier-ignore-start -->
# Class FormField

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.FormElement](dw.web.FormElement.md)
    - [dw.web.FormField](dw.web.FormField.md)

Represents a field in a form.


## Property Summary

| Property | Description |
| --- | --- |
| [FIELD_TYPE_BOOLEAN](#field_type_boolean): [Number](TopLevel.Number.md) | indicates a boolean/checkbox field in the form definition |
| [FIELD_TYPE_DATE](#field_type_date): [Number](TopLevel.Number.md) | indicates a date field in the form definition |
| [FIELD_TYPE_INTEGER](#field_type_integer): [Number](TopLevel.Number.md) | indicates an integer field in the form definition |
| [FIELD_TYPE_NUMBER](#field_type_number): [Number](TopLevel.Number.md) | indicates a number field in the form definition |
| [FIELD_TYPE_STRING](#field_type_string): [Number](TopLevel.Number.md) | indicates a string field in the form definition |
| [checked](#checked): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the current selected state of this field is checked. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns an optinal description for the field. |
| [error](#error): [String](TopLevel.String.md) `(read-only)` | Returns the error text that will be shown to the user when the field is  invalid. |
| [htmlValue](#htmlvalue): [String](TopLevel.String.md) | Returns the current external string representation of the  value in this field. |
| [label](#label): [String](TopLevel.String.md) `(read-only)` | Returns an optional label text for the field. |
| [mandatory](#mandatory): [Boolean](TopLevel.Boolean.md) `(read-only)` | Indicates if the field is mandatory. |
| [maxLength](#maxlength): [Number](TopLevel.Number.md) `(read-only)` | Returns the maximum length for the form field. |
| [maxValue](#maxvalue): [Object](TopLevel.Object.md) `(read-only)` | Returns the maximum value for a form field. |
| [minLength](#minlength): [Number](TopLevel.Number.md) `(read-only)` | Returns the minimum length for the form field. |
| [minValue](#minvalue): [Object](TopLevel.Object.md) `(read-only)` | Returns the minimum value for a form field. |
| [options](#options): [FormFieldOptions](dw.web.FormFieldOptions.md) | Returns a list of possible values for this field. |
| [regEx](#regex): [String](TopLevel.String.md) `(read-only)` | Returns an optional regular expression pattern, which was set in the form  definition. |
| [selected](#selected): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the current selected state of this field is selected. |
| [selectedOption](#selectedoption): [FormFieldOption](dw.web.FormFieldOption.md) `(read-only)` | Returns the selected options or null if the field has no option  or non is selected. |
| [selectedOptionObject](#selectedoptionobject): [Object](TopLevel.Object.md) `(read-only)` | Returns the object that was optionally associated with the  currently selected option. |
| [type](#type): [Number](TopLevel.Number.md) `(read-only)` | The method returns the type of the field. |
| [value](#value): [Object](TopLevel.Object.md) | Returns the internal value representation, which can be a string, a  number, a boolean or a date. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getDescription](dw.web.FormField.md#getdescription)() | Returns an optinal description for the field. |
| [getError](dw.web.FormField.md#geterror)() | Returns the error text that will be shown to the user when the field is  invalid. |
| [getHtmlValue](dw.web.FormField.md#gethtmlvalue)() | Returns the current external string representation of the  value in this field. |
| [getLabel](dw.web.FormField.md#getlabel)() | Returns an optional label text for the field. |
| [getMaxLength](dw.web.FormField.md#getmaxlength)() | Returns the maximum length for the form field. |
| [getMaxValue](dw.web.FormField.md#getmaxvalue)() | Returns the maximum value for a form field. |
| [getMinLength](dw.web.FormField.md#getminlength)() | Returns the minimum length for the form field. |
| [getMinValue](dw.web.FormField.md#getminvalue)() | Returns the minimum value for a form field. |
| [getOptions](dw.web.FormField.md#getoptions)() | Returns a list of possible values for this field. |
| [getRegEx](dw.web.FormField.md#getregex)() | Returns an optional regular expression pattern, which was set in the form  definition. |
| [getSelectedOption](dw.web.FormField.md#getselectedoption)() | Returns the selected options or null if the field has no option  or non is selected. |
| [getSelectedOptionObject](dw.web.FormField.md#getselectedoptionobject)() | Returns the object that was optionally associated with the  currently selected option. |
| [getType](dw.web.FormField.md#gettype)() | The method returns the type of the field. |
| [getValue](dw.web.FormField.md#getvalue)() | Returns the internal value representation, which can be a string, a  number, a boolean or a date. |
| [isChecked](dw.web.FormField.md#ischecked)() | Identifies if the current selected state of this field is checked. |
| [isMandatory](dw.web.FormField.md#ismandatory)() | Indicates if the field is mandatory. |
| [isSelected](dw.web.FormField.md#isselected)() | Identifies if the current selected state of this field is selected. |
| [setHtmlValue](dw.web.FormField.md#sethtmlvaluestring)([String](TopLevel.String.md)) | A form field has two value representations, the HTML value and the plain  value. |
| [setOptions](dw.web.FormField.md#setoptionsiterator)([Iterator](dw.util.Iterator.md)) | The method can be called to update an option list based on the  given iterator with objects. |
| [setOptions](dw.web.FormField.md#setoptionsiterator-number-number)([Iterator](dw.util.Iterator.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | The method can be called to update an option list based on the  given iterator with objects. |
| [setOptions](dw.web.FormField.md#setoptionsmap)([Map](dw.util.Map.md)) | The method can be called to update an option list based on the  given key and values in the given map. |
| [setOptions](dw.web.FormField.md#setoptionsmap-number-number)([Map](dw.util.Map.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | The method can be called to update an option list based on the  given key and values in the given map. |
| [setValue](dw.web.FormField.md#setvalueobject)([Object](TopLevel.Object.md)) | Sets the typed value of the field. |

### Methods inherited from class FormElement

[clearFormElement](dw.web.FormElement.md#clearformelement), [getDynamicHtmlName](dw.web.FormElement.md#getdynamichtmlname), [getFormId](dw.web.FormElement.md#getformid), [getHtmlName](dw.web.FormElement.md#gethtmlname), [getParent](dw.web.FormElement.md#getparent), [getValidationResult](dw.web.FormElement.md#getvalidationresult), [invalidateFormElement](dw.web.FormElement.md#invalidateformelement), [invalidateFormElement](dw.web.FormElement.md#invalidateformelementstring), [isValid](dw.web.FormElement.md#isvalid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### FIELD_TYPE_BOOLEAN
- FIELD_TYPE_BOOLEAN: [Number](TopLevel.Number.md)
  - : indicates a boolean/checkbox field in the form definition


---

### FIELD_TYPE_DATE
- FIELD_TYPE_DATE: [Number](TopLevel.Number.md)
  - : indicates a date field in the form definition


---

### FIELD_TYPE_INTEGER
- FIELD_TYPE_INTEGER: [Number](TopLevel.Number.md)
  - : indicates an integer field in the form definition


---

### FIELD_TYPE_NUMBER
- FIELD_TYPE_NUMBER: [Number](TopLevel.Number.md)
  - : indicates a number field in the form definition


---

### FIELD_TYPE_STRING
- FIELD_TYPE_STRING: [Number](TopLevel.Number.md)
  - : indicates a string field in the form definition


---

### checked
- checked: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the current selected state of this field is checked. In case of
      a boolean field the method directly represent the boolean value. In case
      of a string or int field, the method returns true if the current value
      matched with the value specified as "selected-value". In this way a
      selected status can be as determined for non-boolean fields.



---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns an optinal description for the field.


---

### error
- error: [String](TopLevel.String.md) `(read-only)`
  - : Returns the error text that will be shown to the user when the field is
      invalid. The error messages that may be returned by this method are
      defined in the form field definition under the following attribute names:
      
      
      - missing-error
      - parse-error
      - range-error
      - value-error
      
      
      The framework performs error checks in a specific order, and so if there
      are multiple errors for a single FormField, the following sequence
      defines which error is returned:
      
      
      - When submitting a form entry, whitespace is first trimmed from user  entry and the entry is parsed into native data type (boolean, date,  integer, number, or string). A regex, if defined, is also matched against  the input. If there is an error while parsing or matching with regex,  "parse-error" is set as error.
      - If field was marked as "mandatory" but there is no entry,  "missing-error" is returned
      - The min/max and minlength/maxlength checks are performed. If test  failed, "range-error" is returned.
      - value-error or form-error are returned when "invalidate()" was called  programatically (or pipelet InvalidateFormElement is used)
      
      
      If the field is valid, this method returns null. If no error message was
      specified in the form field definition, this method also returns null.



---

### htmlValue
- htmlValue: [String](TopLevel.String.md)
  - : Returns the current external string representation of the
      value in this field.



---

### label
- label: [String](TopLevel.String.md) `(read-only)`
  - : Returns an optional label text for the field.


---

### mandatory
- mandatory: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Indicates if the field is mandatory.


---

### maxLength
- maxLength: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the maximum length for the form field. A maximum length can
      be specified for all form data types, but is only used to validate fields
      of type "string". For other data types the value is just provided as an
      easy way to dynamically format the user interface. If not specified in
      the form definition the default minimum length is Integer.MAX\_VALUE.



---

### maxValue
- maxValue: [Object](TopLevel.Object.md) `(read-only)`
  - : Returns the maximum value for a form field. A maximum value is only
      applicable for fields with the data type "int", "number" and "date".
      If a maximum value was not specified in the form definition the method
      returns null.



---

### minLength
- minLength: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the minimum length for the form field. A minimum length can
      be specified for all form data types, but is only used to validate fields
      of type "string". For other data types the value is just provided as an
      easy way to dynamically format the user interface. If not specified in
      the form definition the default minimum length is 0.



---

### minValue
- minValue: [Object](TopLevel.Object.md) `(read-only)`
  - : Returns the minimum value for a form field. A minimum value is only
      applicable for fields with the data type "int", "number" and "date".
      If a minimum value was not specified in the form definition the method
      returns null.



---

### options
- options: [FormFieldOptions](dw.web.FormFieldOptions.md)
  - : Returns a list of possible values for this field. The method
      is typically used to render a selection list or to render radio buttons.



---

### regEx
- regEx: [String](TopLevel.String.md) `(read-only)`
  - : Returns an optional regular expression pattern, which was set in the form
      definition. A pattern is only used for validation only for string fields.
      If no pattern was set, the method returns null.



---

### selected
- selected: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the current selected state of this field is selected. In case of
      a boolean field the method directly represent the boolean value. In case
      of a string or int field, the method returns true if the current value
      matched with the value specified as "selected-value". In this way a
      selected status can be as determined for non-boolean fields.



---

### selectedOption
- selectedOption: [FormFieldOption](dw.web.FormFieldOption.md) `(read-only)`
  - : Returns the selected options or null if the field has no option
      or non is selected.



---

### selectedOptionObject
- selectedOptionObject: [Object](TopLevel.Object.md) `(read-only)`
  - : Returns the object that was optionally associated with the
      currently selected option.



---

### type
- type: [Number](TopLevel.Number.md) `(read-only)`
  - : The method returns the type of the field. The type is one of the
      FIELD\_TYPE constants defined in this class.



---

### value
- value: [Object](TopLevel.Object.md)
  - : Returns the internal value representation, which can be a string, a
      number, a boolean or a date.



---

## Method Details

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns an optinal description for the field.

    **Returns:**
    - an optional description for the field.


---

### getError()
- getError(): [String](TopLevel.String.md)
  - : Returns the error text that will be shown to the user when the field is
      invalid. The error messages that may be returned by this method are
      defined in the form field definition under the following attribute names:
      
      
      - missing-error
      - parse-error
      - range-error
      - value-error
      
      
      The framework performs error checks in a specific order, and so if there
      are multiple errors for a single FormField, the following sequence
      defines which error is returned:
      
      
      - When submitting a form entry, whitespace is first trimmed from user  entry and the entry is parsed into native data type (boolean, date,  integer, number, or string). A regex, if defined, is also matched against  the input. If there is an error while parsing or matching with regex,  "parse-error" is set as error.
      - If field was marked as "mandatory" but there is no entry,  "missing-error" is returned
      - The min/max and minlength/maxlength checks are performed. If test  failed, "range-error" is returned.
      - value-error or form-error are returned when "invalidate()" was called  programatically (or pipelet InvalidateFormElement is used)
      
      
      If the field is valid, this method returns null. If no error message was
      specified in the form field definition, this method also returns null.


    **Returns:**
    - the error text that will be shown to the user when the field is
              invalid.



---

### getHtmlValue()
- getHtmlValue(): [String](TopLevel.String.md)
  - : Returns the current external string representation of the
      value in this field.


    **Returns:**
    - the current external string representation of the
      value in this field.



---

### getLabel()
- getLabel(): [String](TopLevel.String.md)
  - : Returns an optional label text for the field.

    **Returns:**
    - an optional label text for the field.


---

### getMaxLength()
- getMaxLength(): [Number](TopLevel.Number.md)
  - : Returns the maximum length for the form field. A maximum length can
      be specified for all form data types, but is only used to validate fields
      of type "string". For other data types the value is just provided as an
      easy way to dynamically format the user interface. If not specified in
      the form definition the default minimum length is Integer.MAX\_VALUE.


    **Returns:**
    - maximum length or MAX\_VALUE


---

### getMaxValue()
- getMaxValue(): [Object](TopLevel.Object.md)
  - : Returns the maximum value for a form field. A maximum value is only
      applicable for fields with the data type "int", "number" and "date".
      If a maximum value was not specified in the form definition the method
      returns null.


    **Returns:**
    - maximum value or null


---

### getMinLength()
- getMinLength(): [Number](TopLevel.Number.md)
  - : Returns the minimum length for the form field. A minimum length can
      be specified for all form data types, but is only used to validate fields
      of type "string". For other data types the value is just provided as an
      easy way to dynamically format the user interface. If not specified in
      the form definition the default minimum length is 0.


    **Returns:**
    - minimum length or 0


---

### getMinValue()
- getMinValue(): [Object](TopLevel.Object.md)
  - : Returns the minimum value for a form field. A minimum value is only
      applicable for fields with the data type "int", "number" and "date".
      If a minimum value was not specified in the form definition the method
      returns null.


    **Returns:**
    - minimum value or null


---

### getOptions()
- getOptions(): [FormFieldOptions](dw.web.FormFieldOptions.md)
  - : Returns a list of possible values for this field. The method
      is typically used to render a selection list or to render radio buttons.


    **Returns:**
    - a list of possible values for this field.


---

### getRegEx()
- getRegEx(): [String](TopLevel.String.md)
  - : Returns an optional regular expression pattern, which was set in the form
      definition. A pattern is only used for validation only for string fields.
      If no pattern was set, the method returns null.


    **Returns:**
    - the regular expression used for validation or null


---

### getSelectedOption()
- getSelectedOption(): [FormFieldOption](dw.web.FormFieldOption.md)
  - : Returns the selected options or null if the field has no option
      or non is selected.


    **Returns:**
    - the selected options or null if the field has no option
      or non is selected.



---

### getSelectedOptionObject()
- getSelectedOptionObject(): [Object](TopLevel.Object.md)
  - : Returns the object that was optionally associated with the
      currently selected option.


    **Returns:**
    - the object that was optionally associated with the
      currently selected option.



---

### getType()
- getType(): [Number](TopLevel.Number.md)
  - : The method returns the type of the field. The type is one of the
      FIELD\_TYPE constants defined in this class.


    **Returns:**
    - the type of the form field


---

### getValue()
- getValue(): [Object](TopLevel.Object.md)
  - : Returns the internal value representation, which can be a string, a
      number, a boolean or a date.


    **Returns:**
    - the internal value representation, which can be a string, a
      number, a boolean or a date.



---

### isChecked()
- isChecked(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the current selected state of this field is checked. In case of
      a boolean field the method directly represent the boolean value. In case
      of a string or int field, the method returns true if the current value
      matched with the value specified as "selected-value". In this way a
      selected status can be as determined for non-boolean fields.


    **Returns:**
    - true if current selected state of this field is checked.


---

### isMandatory()
- isMandatory(): [Boolean](TopLevel.Boolean.md)
  - : Indicates if the field is mandatory.

    **Returns:**
    - true if the field is mandatory, false otherwise.


---

### isSelected()
- isSelected(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the current selected state of this field is selected. In case of
      a boolean field the method directly represent the boolean value. In case
      of a string or int field, the method returns true if the current value
      matched with the value specified as "selected-value". In this way a
      selected status can be as determined for non-boolean fields.


    **Returns:**
    - true if current selected state of this field is checked.


---

### setHtmlValue(String)
- setHtmlValue(htmlValue: [String](TopLevel.String.md)): void
  - : A form field has two value representations, the HTML value and the plain
      value. The HTML value is always a string representation of the field value.
      The plain value is the fully typed and validated field value.
      
      The sets the HTML value for a field. The method is typically called from
      the HTTP POST processing framework. The method than parses, validates
      and assigns the value to the typed field value (see getValue()). If the
      value is invalid the typed field value is set to null and the valid
      flag is set to false. The error property contains an error message
      for the form.


    **Parameters:**
    - htmlValue - the HTML value to use.


---

### setOptions(Iterator)
- setOptions(optionValues: [Iterator](dw.util.Iterator.md)): void
  - : The method can be called to update an option list based on the
      given iterator with objects.


    **Parameters:**
    - optionValues - an iterator whose elements are used as option values


---

### setOptions(Iterator, Number, Number)
- setOptions(optionValues: [Iterator](dw.util.Iterator.md), begin: [Number](TopLevel.Number.md), end: [Number](TopLevel.Number.md)): void
  - : The method can be called to update an option list based on the
      given iterator with objects. The option list is updated using
      the bindings specified in the form definition. If no bindings are
      specified in the form definition the elements are interpreted as
      pure strings.


    **Parameters:**
    - optionValues - an iterator hows elements are used as option values
    - begin - the index of the first element to use as option value
    - end - the last of the last element to use as option value


---

### setOptions(Map)
- setOptions(optionValues: [Map](dw.util.Map.md)): void
  - : The method can be called to update an option list based on the
      given key and values in the given map.


    **Parameters:**
    - optionValues - a Map with the values for the option list


---

### setOptions(Map, Number, Number)
- setOptions(optionValues: [Map](dw.util.Map.md), begin: [Number](TopLevel.Number.md), end: [Number](TopLevel.Number.md)): void
  - : The method can be called to update an option list based on the
      given key and values in the given map. The method also expects
      and index range. This index range only makes sense when the Map is
      a SortedMap.


    **Parameters:**
    - optionValues - a Map with the values for the option list.
    - begin - the index of the first element to use as option value.
    - end - the last of the last element to use as option value.


---

### setValue(Object)
- setValue(value: [Object](TopLevel.Object.md)): void
  - : Sets the typed value of the field. The value is than immediately
      formatted into the external string representation, which is availble
      through the getHtmlValue() method. Also the valid flag is set
      to true. The actual value is not validated against the rules defined
      in the form definition. The method is typically used to directly set
      a typed value and to circumvent the validation rules.
      
      The type of the argument must match with the type of the field.


    **Parameters:**
    - value - the value to set.


---

<!-- prettier-ignore-end -->
