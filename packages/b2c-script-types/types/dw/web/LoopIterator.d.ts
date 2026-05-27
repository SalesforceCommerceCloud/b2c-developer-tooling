import utilIterator = require('../util/Iterator');

/**
 * Iterator used in <ISLOOP> implementation. It defines properties used to determine loop status.
 * LoopIterator object is assigned to variable declared in "status" attribute of the <ISLOOP> tag.
 */
declare class LoopIterator<T> extends utilIterator<T> {
    /**
     * Return begin iteration index. By default begin index is 0.
     */
    readonly begin: number;
    /**
     * Return iteration count, starting with 1.
     */
    readonly count: number;
    /**
     * Return end iteration index. By default end index equals 'length - 1', provided that length is determined.
     * If length cannot be determined end index is -1.
     */
    readonly end: number;
    /**
     * Identifies if count is an even value.
     */
    readonly even: boolean;
    /**
     * Identifies if the iterator is positioned at first iteratable item.
     */
    readonly first: boolean;
    /**
     * Return iteration index, which is the position of the iterator in the underlying iteratable object.
     * Index is 0-based and is calculated according the following formula: Index = (Count - 1) * Step.
     */
    readonly index: number;
    /**
     * Identifies if the iterator is positioned at last iteratable item.
     */
    readonly last: boolean;
    /**
     * Return the length of the object. If length cannot be determined, -1 is returned.
     */
    readonly length: number;
    /**
     * Identifies if count is an odd value.
     */
    readonly odd: boolean;
    /**
     * Return iterator step.
     */
    readonly step: number;
    private constructor();
    /**
     * Return begin iteration index. By default begin index is 0.
     */
    getBegin(): number;
    /**
     * Return iteration count, starting with 1.
     */
    getCount(): number;
    /**
     * Return end iteration index. By default end index equals 'length - 1', provided that length is determined.
     * If length cannot be determined end index is -1.
     */
    getEnd(): number;
    /**
     * Return iteration index, which is the position of the iterator in the underlying iteratable object.
     * Index is 0-based and is calculated according the following formula: Index = (Count - 1) * Step.
     */
    getIndex(): number;
    /**
     * Return the length of the object. If length cannot be determined, -1 is returned.
     */
    getLength(): number;
    /**
     * Return iterator step.
     */
    getStep(): number;
    /**
     * Identifies if count is an even value.
     */
    isEven(): boolean;
    /**
     * Identifies if the iterator is positioned at first iteratable item.
     */
    isFirst(): boolean;
    /**
     * Identifies if the iterator is positioned at last iteratable item.
     */
    isLast(): boolean;
    /**
     * Identifies if count is an odd value.
     */
    isOdd(): boolean;
}

export = LoopIterator;
