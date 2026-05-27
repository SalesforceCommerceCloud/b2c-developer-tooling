import FormField = require('./FormField');

/**
 * Represents an option for a form field.
 */
declare class FormFieldOption {
    /**
     * Identifies if this option is checked.
     */
    readonly checked: boolean;
    /**
     * Returns the value for the HTML value attribute of a HTML option element.
     */
    readonly htmlValue: string;
    /**
     * Returns the value for the HTML label attribute of the HTML option element.
     * If not specified in the form option definition the label is identical with
     * the string representation of option value (see getValue()).
     */
    label: string;
    /**
     * Returns the object that was bound to this option value.
     */
    readonly object: any;
    /**
     * Returns the ID of the option. This is an internal ID used to uniquely
     * reference this option. If not specified in the form option definition
     * the ID is identical with the string representation of the option value
     * (see getValue()).
     */
    readonly optionId: string;
    /**
     * The parent, which is a field element.
     */
    readonly parent: FormField;
    /**
     * Identifies if this option is selected.
     */
    readonly selected: boolean;
    /**
     * The actual value associated with this option. This value is formatted
     * and than returned as HTML value with the method getHtmlValue().
     */
    readonly value: any;
    private constructor();
    /**
     * Returns the value for the HTML value attribute of a HTML option element.
     */
    getHtmlValue(): string;
    /**
     * Returns the value for the HTML label attribute of the HTML option element.
     * If not specified in the form option definition the label is identical with
     * the string representation of option value (see getValue()).
     */
    getLabel(): string;
    /**
     * Returns the object that was bound to this option value.
     */
    getObject(): any;
    /**
     * Returns the ID of the option. This is an internal ID used to uniquely
     * reference this option. If not specified in the form option definition
     * the ID is identical with the string representation of the option value
     * (see getValue()).
     */
    getOptionId(): string;
    /**
     * The parent, which is a field element.
     */
    getParent(): FormField;
    /**
     * The actual value associated with this option. This value is formatted
     * and than returned as HTML value with the method getHtmlValue().
     */
    getValue(): any;
    /**
     * Identifies if this option is checked.
     */
    isChecked(): boolean;
    /**
     * Identifies if this option is selected.
     */
    isSelected(): boolean;
    /**
     * Sets the label attribute for this option.
     */
    setLabel(label: string): void;
}

export = FormFieldOption;
