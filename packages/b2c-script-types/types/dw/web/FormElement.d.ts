import FormElementValidationResult = require('./FormElementValidationResult');

/**
 * Represents a form element.
 */
declare class FormElement {
    /**
     * Returns a dynamic html name for the field. It can be used to suppress any autocompletion
     * support from a browser, e.g. for credit card related fields. It can be also
     * used for a unique form name, if one form is used multiple times in a page.
     */
    readonly dynamicHtmlName: string;
    /**
     * The ID of the form element. The is is unique within the parent
     * element of the form.
     */
    readonly formId: string;
    /**
     * Returns the global unique name of the field, which can be used as name
     * in the html form. For radio buttons this name is not unique.
     */
    readonly htmlName: string;
    /**
     * The parent within the form.
     */
    readonly parent: FormElement;
    /**
     * Identifies if this element and all its children elements are
     * valid. A form element, which was not submitted in the last
     * request is always valid.
     */
    readonly valid: boolean;
    /**
     * Provides a combined view on the validation status as per isValid() and getError(). In
     * addition it also provides the data as returned by the validation in case a validation
     * script was used.
     */
    readonly validationResult: FormElementValidationResult;
    /**
     * This method clears the whole form. After clearing a form it
     * contains no value or the default value, is not bound to any business
     * object and has the status of being valid.
     */
    clearFormElement(): void;
    /**
     * Returns a dynamic html name for the field. It can be used to suppress any autocompletion
     * support from a browser, e.g. for credit card related fields. It can be also
     * used for a unique form name, if one form is used multiple times in a page.
     */
    getDynamicHtmlName(): string;
    /**
     * The ID of the form element. The is is unique within the parent
     * element of the form.
     */
    getFormId(): string;
    /**
     * Returns the global unique name of the field, which can be used as name
     * in the html form. For radio buttons this name is not unique.
     */
    getHtmlName(): string;
    /**
     * The parent within the form.
     */
    getParent(): FormElement;
    /**
     * Provides a combined view on the validation status as per isValid() and getError(). In
     * addition it also provides the data as returned by the validation in case a validation
     * script was used.
     */
    getValidationResult(): FormElementValidationResult;
    /**
     * The method can be called to explicitly invalidate a form element. The
     * error text will be set to the one of two possible preconfigured custom
     * error messages associated with the form definition. The "value-error"
     * message will be used for FormField instances and "form-error" will be
     * used for FormGroup instances.
     */
    invalidateFormElement(): void;
    /**
     * The method can be called to explicitly invalidate a field. The error
     * text is set to the given error message.
     */
    invalidateFormElement(error: string): void;
    /**
     * Identifies if this element and all its children elements are
     * valid. A form element, which was not submitted in the last
     * request is always valid.
     */
    isValid(): boolean;
}

export = FormElement;
