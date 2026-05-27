import Reader = require('./Reader');
import List = require('../util/List');

/**
 * The class supports reading a CSV file. The reader supports handling CSV
 * entries where the separator is contained in quotes and also CSV entries where
 * a quoted entry contains newline characters.
 */
declare class CSVStreamReader {
    /**
     * Creates a new CSVReader with a ',' as separator character and a '"' as
     * quote character. The reader doesn't skip any header lines.
     */
    constructor(ioreader: Reader);
    /**
     * Creates a new CSVReader with the specified separator character and a '"'
     * as quote character. The reader doesn't skip any header lines.
     */
    constructor(ioreader: Reader, separator: string);
    /**
     * Creates a new CSVReader with the specified separator character and the
     * specified quote character. The reader doesn't skip any header lines.
     */
    constructor(ioreader: Reader, separator: string, quote: string);
    /**
     * Creates a new CSVReader. The separator character, the quote character and
     * the number of header lines can be specified in the call.
     */
    constructor(ioreader: Reader, separator: string, quote: string, skip: number);
    /**
     * Closes the underlying reader.
     */
    close(): void;
    /**
     * Returns a list of lines representing the entire CSV file. Each line is a
     * array of strings.
     * 
     * Using this method on large feeds is inherently unsafe and may lead to an
     * out-of-memory condition. Instead use method readNext and
     * process entries line by line.
     */
    readAll(): List<List<any>>;
    /**
     * Returns the next line from the input stream. The line is returned as an
     * array of strings. The method returns null if the end of the stream is
     * reached.
     */
    readNext(): string[] | null;
}

export = CSVStreamReader;
