/**
 * A special type of exception that is thrown when an Iterator or Generator
 * sequence is exhausted.
 * @see TopLevel.Generator.next
 * @see TopLevel.Iterator.next
 */
declare class StopIteration {
    private constructor();
}

export = StopIteration;
