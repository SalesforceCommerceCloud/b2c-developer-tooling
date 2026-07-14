/**
 * Represents the value definition associated with an
 * object attribute.
 */
declare class ObjectAttributeValueDefinition {
    /**
     * Returns a display name that can be used to present this value in
     * the user interface. For example, the value might be '1' but the display
     * name might be 'Order Exported'.
     */
    readonly displayValue: string;
    /**
     * Returns the actual value for the attribute.
     */
    readonly value: any;
    private constructor();
    /**
     * Returns a display name that can be used to present this value in
     * the user interface. For example, the value might be '1' but the display
     * name might be 'Order Exported'.
     */
    getDisplayValue(): string;
    /**
     * Returns the actual value for the attribute.
     */
    getValue(): any;
}

export = ObjectAttributeValueDefinition;
