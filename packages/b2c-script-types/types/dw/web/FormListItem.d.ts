import FormGroup = require('./FormGroup');

/**
 * Represents an item in a form list.
 */
declare class FormListItem extends FormGroup {
    /**
     * Returns the index of this item with the list.
     */
    readonly itemIndex: number;
    private constructor();
    /**
     * Returns the index of this item with the list.
     */
    getItemIndex(): number;
}

export = FormListItem;
