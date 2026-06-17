/**
 * The class represents the list of options for a field. The class supports
 * an index style access to the options, e.g. myfield.options[2] or
 * myfield.options.red.
 */
declare class FormFieldOptions {
    /**
     * Returns the number of option values.
     */
    readonly optionsCount: number;
    private constructor();
    /**
     * Returns the number of option values.
     */
    getOptionsCount(): number;
}

export = FormFieldOptions;
