import Writer = require('./Writer');

/**
 * Template output stream writer.
 * 
 * Printwriter is available in the template scripting context and is used
 * to write data into the template output stream. You cannot instantiate this class
 * directly. Instead, the system assigns the object to variable named 'out' in the script context
 * to be used by the template scripts.
 * 
 * Note: when this class is used with sensitive data, be careful in persisting sensitive information to disk.
 */
declare class PrintWriter extends Writer {
    private constructor();
    /**
     * Prints the given string into the output stream.
     */
    print(str: string): void;
    /**
     * Print the given string followed by a line break into the output stream.
     */
    println(str: string): void;
    /**
     * Prints a line break into the output stream.
     */
    println(): void;
}

export = PrintWriter;
