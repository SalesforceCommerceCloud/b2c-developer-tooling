import FormGroup = require('./FormGroup');
import List = require('../util/List');
import FormListItem = require('./FormListItem');

/**
 * Represents a list of forms.
 */
declare class FormList extends FormGroup {
    /**
     * returns the selected list items if the list is
     * configured to support selection of items.
     */
    readonly selectManyItems: List<FormListItem> | null;
    /**
     * Returns a list of all selected objects if the list is configured
     * to support the selection of items. The objects are the objects that were
     * bound to each row.
     */
    readonly selectManyObjects: List<any> | null;
    /**
     * Returns the default list item if the list is configured to
     * support the selection of a default item.
     */
    readonly selectOneItem: FormListItem | null;
    /**
     * Returns the selected object if the list is configured to
     * support the selection of a default item. The object is the object
     * bound to the item.
     */
    readonly selectOneObject: any;
    private constructor();
    /**
     * returns the selected list items if the list is
     * configured to support selection of items.
     */
    getSelectManyItems(): List<FormListItem> | null;
    /**
     * Returns a list of all selected objects if the list is configured
     * to support the selection of items. The objects are the objects that were
     * bound to each row.
     */
    getSelectManyObjects(): List<any> | null;
    /**
     * Returns the default list item if the list is configured to
     * support the selection of a default item.
     */
    getSelectOneItem(): FormListItem | null;
    /**
     * Returns the selected object if the list is configured to
     * support the selection of a default item. The object is the object
     * bound to the item.
     */
    getSelectOneObject(): any;
}

export = FormList;
