/**
 * This comparator can be used for the List sort() methods and for the SortSet
 * and SortedMap classes. The comparator can be used to make a comparison based
 * on a property of the contained objects. The Comparison is done based on the
 * natural order of the values. It is guaranteed to work for Numbers, Strings,
 * Dates, Money and Quantity values.
 */
declare class PropertyComparator {
    /**
     * Constructs the comparator from the variable length argument list. The
     * parameters are property names that are to be used for the comparison.
     * When comparing two objects, the comparator first compares them by the
     * first property. If the two objects have equal values for the first
     * property, the comparator then compares them by the second property,
     * etc, until one object is determined to be less than the other or they are
     * equal. Each parameter must be either a simple name like "totalSum" or can
     * be a reference to a custom attribute like "custom.mytotal". Each
     * parameter may also be prefixed with an optional '+' or '-' character to
     * indicate that the objects should be sorted ascending or descending
     * respectively by that property. If not specified for a given property then
     * '+' (ascending sort) is assumed.
     * 
     * For example: new PropertyComparator("+prop1", "-prop2", "prop3")
     * constructs a Comparator which sorts by prop1 ascending, prop2 descending,
     * and finally prop3 ascending.
     * 
     * The comparator created with this constructor treats null values as
     * greater than any other value.
     */
    constructor(property: string, ...otherProperties: string[]);
    /**
     * Constructs the comparator. The specified parameter is the name of the
     * property that is used for the comparison. The parameter must be either a
     * simple name like "totalSum" or can be a reference to a custom attribute
     * like "custom.mytotal".
     * 
     * The comparator created with this constructor is setup with ascending or
     * descending sort order depending on value of sortOrder and null values
     * being greater than any other value.
     */
    constructor(propertyName: string, sortOrder: boolean);
    /**
     * Constructs the comparator. The specified parameter is the name of the
     * property that is used for the comparison. The parameter must be either a
     * simple name like "totalSum" or can be a reference to a custom attribute
     * like "custom.mytotal".
     */
    constructor(propertyName: string, sortOrder: boolean, nullGreater: boolean);
    /**
     * Compares its two arguments for order. Returns a negative integer, zero,
     * or a positive integer as the first argument is less than, equal to, or
     * greater than the second. By default a null value is treated always
     * greater than any other value. In the constructor of a PropertyComparator
     * this default behavior can be changed.
     */
    compare(arg1: any, arg2: any): number;
}

export = PropertyComparator;
