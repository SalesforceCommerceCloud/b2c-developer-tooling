import FormElement = require('./FormElement');
import utilMap = require('../util/Map');
import utilIterator = require('../util/Iterator');
import FormFieldOptions = require('./FormFieldOptions');
import FormFieldOption = require('./FormFieldOption');

/**
 * Represents a field in a form.
 */
declare class FormField extends FormElement {
    /**
     * indicates a boolean/checkbox field in the form definition
     */
    static FIELD_TYPE_BOOLEAN: number;
    /**
     * indicates a date field in the form definition
     */
    static FIELD_TYPE_DATE: number;
    /**
     * indicates an integer field in the form definition
     */
    static FIELD_TYPE_INTEGER: number;
    /**
     * indicates a number field in the form definition
     */
    static FIELD_TYPE_NUMBER: number;
    /**
     * indicates a string field in the form definition
     */
    static FIELD_TYPE_STRING: number;
    /**
     * Identifies if the current selected state of this field is checked. In case of
     * a boolean field the method directly represent the boolean value. In case
     * of a string or int field, the method returns true if the current value
     * matched with the value specified as "selected-value". In this way a
     * selected status can be as determined for non-boolean fields.
     */
    readonly checked: boolean;
    /**
     * Returns an optinal description for the field.
     */
    readonly description: string;
    /**
     * Returns the error text that will be shown to the user when the field is
     * invalid. The error messages that may be returned by this method are
     * defined in the form field definition under the following attribute names:
     * 
     * - missing-error
     * - parse-error
     * - range-error
     * - value-error
     * 
     * The framework performs error checks in a specific order, and so if there
     * are multiple errors for a single FormField, the following sequence
     * defines which error is returned:
     * 
     * - When submitting a form entry, whitespace is first trimmed from user
     * entry and the entry is parsed into native data type (boolean, date,
     * integer, number, or string). A regex, if defined, is also matched against
     * the input. If there is an error while parsing or matching with regex,
     * "parse-error" is set as error.
     * - If field was marked as "mandatory" but there is no entry,
     * "missing-error" is returned
     * - The min/max and minlength/maxlength checks are performed. If test
     * failed, "range-error" is returned.
     * - value-error or form-error are returned when "invalidate()" was called
     * programatically (or pipelet InvalidateFormElement is used)
     * 
     * If the field is valid, this method returns null. If no error message was
     * specified in the form field definition, this method also returns null.
     */
    readonly error: string;
    /**
     * Returns the current external string representation of the
     * value in this field.
     */
    htmlValue: string;
    /**
     * Returns an optional label text for the field.
     */
    readonly label: string;
    /**
     * Indicates if the field is mandatory.
     */
    readonly mandatory: boolean;
    /**
     * Returns the maximum length for the form field. A maximum length can
     * be specified for all form data types, but is only used to validate fields
     * of type "string". For other data types the value is just provided as an
     * easy way to dynamically format the user interface. If not specified in
     * the form definition the default minimum length is Integer.MAX_VALUE.
     */
    readonly maxLength: number;
    /**
     * Returns the maximum value for a form field. A maximum value is only
     * applicable for fields with the data type "int", "number" and "date".
     * If a maximum value was not specified in the form definition the method
     * returns null.
     */
    readonly maxValue: any | null;
    /**
     * Returns the minimum length for the form field. A minimum length can
     * be specified for all form data types, but is only used to validate fields
     * of type "string". For other data types the value is just provided as an
     * easy way to dynamically format the user interface. If not specified in
     * the form definition the default minimum length is 0.
     */
    readonly minLength: number;
    /**
     * Returns the minimum value for a form field. A minimum value is only
     * applicable for fields with the data type "int", "number" and "date".
     * If a minimum value was not specified in the form definition the method
     * returns null.
     */
    readonly minValue: any | null;
    /**
     * Returns a list of possible values for this field. The method
     * is typically used to render a selection list or to render radio buttons.
     */
    options: FormFieldOptions;
    /**
     * Returns an optional regular expression pattern, which was set in the form
     * definition. A pattern is only used for validation only for string fields.
     * If no pattern was set, the method returns null.
     */
    readonly regEx: string | null;
    /**
     * Identifies if the current selected state of this field is selected. In case of
     * a boolean field the method directly represent the boolean value. In case
     * of a string or int field, the method returns true if the current value
     * matched with the value specified as "selected-value". In this way a
     * selected status can be as determined for non-boolean fields.
     */
    readonly selected: boolean;
    /**
     * Returns the selected options or null if the field has no option
     * or non is selected.
     */
    readonly selectedOption: FormFieldOption | null;
    /**
     * Returns the object that was optionally associated with the
     * currently selected option.
     */
    readonly selectedOptionObject: any;
    /**
     * The method returns the type of the field. The type is one of the
     * FIELD_TYPE constants defined in this class.
     */
    readonly type: number;
    /**
     * Returns the internal value representation, which can be a string, a
     * number, a boolean or a date.
     */
    value: any;
    private constructor();
    /**
     * Returns an optinal description for the field.
     */
    getDescription(): string;
    /**
     * Returns the error text that will be shown to the user when the field is
     * invalid. The error messages that may be returned by this method are
     * defined in the form field definition under the following attribute names:
     * 
     * - missing-error
     * - parse-error
     * - range-error
     * - value-error
     * 
     * The framework performs error checks in a specific order, and so if there
     * are multiple errors for a single FormField, the following sequence
     * defines which error is returned:
     * 
     * - When submitting a form entry, whitespace is first trimmed from user
     * entry and the entry is parsed into native data type (boolean, date,
     * integer, number, or string). A regex, if defined, is also matched against
     * the input. If there is an error while parsing or matching with regex,
     * "parse-error" is set as error.
     * - If field was marked as "mandatory" but there is no entry,
     * "missing-error" is returned
     * - The min/max and minlength/maxlength checks are performed. If test
     * failed, "range-error" is returned.
     * - value-error or form-error are returned when "invalidate()" was called
     * programatically (or pipelet InvalidateFormElement is used)
     * 
     * If the field is valid, this method returns null. If no error message was
     * specified in the form field definition, this method also returns null.
     */
    getError(): string;
    /**
     * Returns the current external string representation of the
     * value in this field.
     */
    getHtmlValue(): string;
    /**
     * Returns an optional label text for the field.
     */
    getLabel(): string;
    /**
     * Returns the maximum length for the form field. A maximum length can
     * be specified for all form data types, but is only used to validate fields
     * of type "string". For other data types the value is just provided as an
     * easy way to dynamically format the user interface. If not specified in
     * the form definition the default minimum length is Integer.MAX_VALUE.
     */
    getMaxLength(): number;
    /**
     * Returns the maximum value for a form field. A maximum value is only
     * applicable for fields with the data type "int", "number" and "date".
     * If a maximum value was not specified in the form definition the method
     * returns null.
     */
    getMaxValue(): any | null;
    /**
     * Returns the minimum length for the form field. A minimum length can
     * be specified for all form data types, but is only used to validate fields
     * of type "string". For other data types the value is just provided as an
     * easy way to dynamically format the user interface. If not specified in
     * the form definition the default minimum length is 0.
     */
    getMinLength(): number;
    /**
     * Returns the minimum value for a form field. A minimum value is only
     * applicable for fields with the data type "int", "number" and "date".
     * If a minimum value was not specified in the form definition the method
     * returns null.
     */
    getMinValue(): any | null;
    /**
     * Returns a list of possible values for this field. The method
     * is typically used to render a selection list or to render radio buttons.
     */
    getOptions(): FormFieldOptions;
    /**
     * Returns an optional regular expression pattern, which was set in the form
     * definition. A pattern is only used for validation only for string fields.
     * If no pattern was set, the method returns null.
     */
    getRegEx(): string | null;
    /**
     * Returns the selected options or null if the field has no option
     * or non is selected.
     */
    getSelectedOption(): FormFieldOption | null;
    /**
     * Returns the object that was optionally associated with the
     * currently selected option.
     */
    getSelectedOptionObject(): any;
    /**
     * The method returns the type of the field. The type is one of the
     * FIELD_TYPE constants defined in this class.
     */
    getType(): number;
    /**
     * Returns the internal value representation, which can be a string, a
     * number, a boolean or a date.
     */
    getValue(): any;
    /**
     * Identifies if the current selected state of this field is checked. In case of
     * a boolean field the method directly represent the boolean value. In case
     * of a string or int field, the method returns true if the current value
     * matched with the value specified as "selected-value". In this way a
     * selected status can be as determined for non-boolean fields.
     */
    isChecked(): boolean;
    /**
     * Indicates if the field is mandatory.
     */
    isMandatory(): boolean;
    /**
     * Identifies if the current selected state of this field is selected. In case of
     * a boolean field the method directly represent the boolean value. In case
     * of a string or int field, the method returns true if the current value
     * matched with the value specified as "selected-value". In this way a
     * selected status can be as determined for non-boolean fields.
     */
    isSelected(): boolean;
    /**
     * A form field has two value representations, the HTML value and the plain
     * value. The HTML value is always a string representation of the field value.
     * The plain value is the fully typed and validated field value.
     * 
     * The sets the HTML value for a field. The method is typically called from
     * the HTTP POST processing framework. The method than parses, validates
     * and assigns the value to the typed field value (see getValue()). If the
     * value is invalid the typed field value is set to null and the valid
     * flag is set to false. The error property contains an error message
     * for the form.
     */
    setHtmlValue(htmlValue: string): void;
    /**
     * The method can be called to update an option list based on the
     * given key and values in the given map.
     */
    setOptions(optionValues: utilMap<any, any>): void;
    /**
     * The method can be called to update an option list based on the
     * given key and values in the given map. The method also expects
     * and index range. This index range only makes sense when the Map is
     * a SortedMap.
     */
    setOptions(optionValues: utilMap<any, any>, begin: number, end: number): void;
    /**
     * The method can be called to update an option list based on the
     * given iterator with objects. The option list is updated using
     * the bindings specified in the form definition. If no bindings are
     * specified in the form definition the elements are interpreted as
     * pure strings.
     */
    setOptions(optionValues: utilIterator<any>, begin: number, end: number): void;
    /**
     * The method can be called to update an option list based on the
     * given iterator with objects.
     */
    setOptions(optionValues: utilIterator<any>): void;
    /**
     * Sets the typed value of the field. The value is than immediately
     * formatted into the external string representation, which is availble
     * through the getHtmlValue() method. Also the valid flag is set
     * to true. The actual value is not validated against the rules defined
     * in the form definition. The method is typically used to directly set
     * a typed value and to circumvent the validation rules.
     * 
     * The type of the argument must match with the type of the field.
     */
    setValue(value: any): void;
}

export = FormField;
