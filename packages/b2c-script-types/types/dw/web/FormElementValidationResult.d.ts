import utilMap = require('../util/Map');

/**
 * Represents a form element validation result. The validation script specified for form groups and fields can create
 * such FormElementValidationResult with the desired validity, message and data and can then return it. The server side form
 * element validation will evaluate these settings, i.e. calculate the corresponding element validity and message. The optional
 * data provided with this instance will be kept and can be accessed again from the form element after server side validation.
 */
declare class FormElementValidationResult {
    /**
     * Provides optional data acquired during validation.
     */
    readonly data: utilMap<any, any>;
    /**
     * Provides an optional message in case of validation failure.
     */
    message: string;
    /**
     * States if the validation succeeded or failed.
     */
    valid: boolean;
    /**
     * Creates a FormElementValidationResult with given setting for the validity but without any message.
     */
    constructor(valid: boolean);
    /**
     * Creates a FormElementValidationResult with given setting for the validity and corresponding message.
     * This is especially useful to represent a failed validation including some error message.
     */
    constructor(valid: boolean, message: string);
    /**
     * Creates a FormElementValidationResult with given setting for the validity and corresponding message.
     * This is especially useful to represent a failed validation including some error message. Additional
     * data can be stored, too.
     */
    constructor(valid: boolean, message: string, data: utilMap<any, any>);
    /**
     * Adds optional data acquired during validation.
     */
    addData(key: any, value: any): void;
    /**
     * Provides optional data acquired during validation.
     */
    getData(): utilMap<any, any>;
    /**
     * Provides an optional message in case of validation failure.
     */
    getMessage(): string;
    /**
     * States if the validation succeeded or failed.
     */
    isValid(): boolean;
    /**
     * Sets an optional message in case of validation failure.
     */
    setMessage(message: string): void;
    /**
     * Sets if the validation succeeded or failed.
     */
    setValid(valid: boolean): void;
}

export = FormElementValidationResult;
