import FormGroup = require('./FormGroup');

/**
 * The class is the top level element in the form instance hierachy.
 */
declare class Form extends FormGroup {
    /**
     * Returns the secure key html name to be used for the hidden input field
     * that will contain the secure key value.
     */
    readonly secureKeyHtmlName: string;
    /**
     * Returns the secure key value that is generated for the form to use
     * in a hidden input field for authentication.
     */
    readonly secureKeyValue: string;
    private constructor();
    /**
     * Returns the secure key html name to be used for the hidden input field
     * that will contain the secure key value.
     */
    getSecureKeyHtmlName(): string;
    /**
     * Returns the secure key value that is generated for the form to use
     * in a hidden input field for authentication.
     */
    getSecureKeyValue(): string;
}

export = Form;
