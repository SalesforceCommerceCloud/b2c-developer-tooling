import List = require('../util/List');

/**
 * Represents a file resource accessible from scripting. As with
 * `java.io.File`, a `File` is essentially an
 * "abstract pathname" which may or may not denote an actual file on the file
 * system.  Methods `createNewFile`,
 * `mkdir`, `mkdirs`, and `remove` are provided
 * to actually manipulate physical files.
 * 
 * File access is limited to certain virtual directories.  These directories are
 * a subset of those accessible through WebDAV.  As a result of this
 * restriction, pathnames must be one of the following forms:
 * 
 * - `/TEMP(/...)`
 * - `/IMPEX(/...)`
 * - `/REALMDATA(/...)`
 * - `/CATALOGS/[Catalog Name](/...)`
 * - `/LIBRARIES/[Library Name](/...)`
 * 
 * Note, that these paths are analogous to the WebDAV URIs used to access the
 * same directories.
 * 
 * The files are stored in a shared file system where multiple processes could
 * access the same file. The programmer has to make sure no more than one process
 * writes to a file at a given time.
 * 
 * This class provides other useful methods for listing the
 * children of a directory and for working with zip files.
 * 
 * Note: when this class is used with sensitive data, be careful in persisting sensitive information.
 * 
 * For performance reasons no more than 100,000 files (regular files and directories) should be stored in a
 * directory.
 */
declare class File {
    /**
     * Catalogs root directory.
     */
    static readonly CATALOGS: string;
    /**
     * Customer Payment Instrument root directory.
     */
    static readonly CUSTOMERPI: string;
    /**
     * Customer snapshots root directory.
     */
    static readonly CUSTOMER_SNAPSHOTS: string;
    /**
     * Reserved for future use.
     */
    static readonly DYNAMIC: string;
    /**
     * Import/export root directory.
     */
    static readonly IMPEX: string;
    /**
     * Libraries root directory.
     */
    static readonly LIBRARIES: string;
    /**
     * RealmData root directory.
     * @deprecated Folder to be removed.
     */
    static readonly REALMDATA: string;
    /**
     * The UNIX style '/' path separator, which must be used for files paths.
     */
    static readonly SEPARATOR = "/";
    /**
     * Static content root directory.
     */
    static readonly STATIC: string;
    /**
     * Temp root directory.
     */
    static readonly TEMP: string;
    /**
     * Indicates that this file is a directory.
     */
    readonly directory: boolean;
    /**
     * Indicates if this file is a file.
     */
    readonly file: boolean;
    /**
     * Return the full file path denoted by this `File`.
     * This value will be the same regardless of which constructor was
     * used to create this `File`.
     */
    readonly fullPath: string;
    /**
     * Returns the name of the file or directory denoted by this object. This is
     * just the last name in the pathname's name sequence. If the pathname's
     * name sequence is empty, then the empty string is returned.
     */
    readonly name: string;
    /**
     * Returns the portion of the path relative to the root directory.
     * @deprecated Use getFullPath to access the full path.
     * This method does not return the correct path for files
     * in the CATALOGS or LIBRARIES virtual directories.
     */
    readonly path: string;
    /**
     * Returns the root directory type, e.g. "IMPEX" represented by this
     * `File`.
     */
    readonly rootDirectoryType: string;
    /**
     * Creates a `File` from the given absolute file path in the
     * file namespace.  If the specified path is not a valid accessible path,
     * an exception will be thrown.
     * 
     * The passed path should use the forward slash '/' as the path
     * separator and begin with a leading slash.  However, if a leading slash
     * is not provided, or the backslash character is used as the separator,
     * these problems will be fixed.  The normalized value will then be returned
     * by getFullPath.
     */
    constructor(absPath: string);
    /**
     * Creates a `File` given a root directory and a relative path.
     */
    constructor(rootDir: File, relPath: string);
    /**
     * Returns a `File` representing a directory for the specified
     * root directory type. If the root directory
     * type is CATALOGS or LIBRARIES, then an additional argument representing
     * the specific catalog or library must be provided.  Otherwise, no
     * additional arguments are needed.
     */
    static getRootDirectory(rootDir: string, ...args: string[]): File;
    /**
     * Copy a file. Directories cannot be copied. This method cannot be used from storefront requests.
     * @throws IOException if there is an interruption during file copy.
     * @throws FileAlreadyExistsException if the file to copy to already exists
     * @throws UnsupportedOperationException if invoked from a storefront request
     */
    copyTo(file: File): File;
    /**
     * Create file.
     * @throws Exception
     */
    createNewFile(): boolean;
    /**
     * Indicates if the file exists.
     */
    exists(): boolean;
    /**
     * Return the full file path denoted by this `File`.
     * This value will be the same regardless of which constructor was
     * used to create this `File`.
     */
    getFullPath(): string;
    /**
     * Returns the name of the file or directory denoted by this object. This is
     * just the last name in the pathname's name sequence. If the pathname's
     * name sequence is empty, then the empty string is returned.
     */
    getName(): string;
    /**
     * Returns the portion of the path relative to the root directory.
     * @deprecated Use getFullPath to access the full path.
     * This method does not return the correct path for files
     * in the CATALOGS or LIBRARIES virtual directories.
     */
    getPath(): string;
    /**
     * Returns the root directory type, e.g. "IMPEX" represented by this
     * `File`.
     */
    getRootDirectoryType(): string;
    /**
     * Assumes this instance is a gzip file. Unzipping it will
     * explode the contents in the directory passed in (root).
     * @throws Exception if the zip files contents can't be exploded.
     */
    gunzip(root: File): void;
    /**
     * GZip this instance into a new gzip file. If you're zipping a file, then a single entry, the instance,
     * is included in the output gzip file. Note that a new File is created. GZipping directories is not supported.
     * This file is never modified.
     * @throws IOException if the zip file can't be created.
     */
    gzip(outputZipFile: File): void;
    /**
     * Indicates that this file is a directory.
     */
    isDirectory(): boolean;
    /**
     * Indicates if this file is a file.
     */
    isFile(): boolean;
    /**
     * Return the time, in milliseconds, that this file was last modified.
     */
    lastModified(): number;
    /**
     * Return the length of the file in bytes.
     */
    length(): number;
    /**
     * Returns an array of strings naming the files and directories in the
     * directory denoted by this object.
     * 
     * If this object does not denote a directory, then this method returns
     * `null`. Otherwise an array of strings is returned, one for
     * each file or directory in the directory. Names denoting the directory
     * itself and the directory's parent directory are not included in the
     * result. Each string is a file name rather than a complete path.
     * 
     * There is no guarantee that the name strings in the resulting array will
     * appear in any specific order; they are not, in particular, guaranteed to
     * appear in alphabetical order.
     */
    list(): string[] | null;
    /**
     * Returns an array of `File` objects in the directory denoted
     * by this `File`.
     * 
     * If this `File` does not denote a directory, then this method
     * returns `null`. Otherwise an array of `File`
     * objects is returned, one for each file or directory in the directory.
     * Files denoting the directory itself and the directory's parent directory
     * are not included in the result.
     * 
     * There is no guarantee that the files in the resulting array will appear
     * in any specific order; they are not, in particular, guaranteed to appear
     * in alphabetical order. Example usage:
     * 
     * `
     * // Assume "foo" is an accessible directory.
     * 
     * var this_directory : dw.io.File = new File("foo");
     * 
     * // Find all files in directory foo, one level "down".
     * 
     * // listFiles() will not traverse subdirectories.
     * 
     * var folder : dw.util.List = this_directory.listFiles();
     * 
     * var first_element : dw.io.File = folder[0];
     * 
     * function modification_comparison(lhs : File, rhs : File)
     * 
     * {
     * 
     * return lhs.lastModified() < rhs.lastModified();
     * 
     * }
     * 
     * function lexigraphic_comparison(lhs: File, rhs : File)
     * 
     * {
     * 
     * return lhs.getName() < rhs.getName();
     * 
     * }
     * 
     * var time_ordered_folder : dw.util.ArrayList = folder.sort(modification_comparison);
     * 
     * var alphabetic_folder : dw.util.ArrayList = folder.sort(lexigraphic_comparison);
     * 
     * `
     */
    listFiles(): List<File> | null;
    /**
     * Returns an array of `File` objects denoting the files and
     * directories in the directory denoted by this object that satisfy the
     * specified filter. The behavior of this method is the same as that of the
     * `listFiles` method, except that the files in the
     * returned array must satisfy the filter. The filter is a Javascript
     * function which accepts one argument, a `File`, and returns
     * true or false depending on whether the file meets the filter conditions.
     * If the given `filter` is `null` then all files
     * are accepted. Otherwise, a file satisfies the filter if and only if the
     * filter returns `true`. Example usage:
     * 
     * `
     * // Assume "foo" is an accessible directory.
     * 
     * var this_directory : dw.io.File = new File("foo");
     * 
     * function longer_than_3(candidate : dw.io.File)
     * 
     * {
     * 
     * return candidate.getName().length > 3;
     * 
     * }
     * 
     * // Find all files in directory foo, one level "down",
     * 
     * // such that the filename is longer than 3 characters.
     * 
     * var folder_long_names : dw.util.List = this_directory.listFiles(longer_than_3);
     * 
     * `
     */
    listFiles(filter: Function): List<File> | null;
    /**
     * Returns an MD5 hash of the content of the file of this instance.
     * @throws Exception if the file could not be read or is a directory.
     */
    md5(): string;
    /**
     * Creates a directory.
     */
    mkdir(): boolean;
    /**
     * Creates a directory, including, its parent directories, as needed.
     */
    mkdirs(): boolean;
    /**
     * Deletes the file or directory denoted by this object. If this File
     * represents a directory, then the directory must be empty in order to be
     * deleted.
     */
    remove(): boolean;
    /**
     * Rename file.
     */
    renameTo(file: File): boolean;
    /**
     * Assumes this instance is a zip file. Unzipping it will
     * explode the contents in the directory passed in (root).
     * @throws Exception if the zip files contents can't be exploded.
     */
    unzip(root: File): void;
    /**
     * Zip this instance into a new zip file. If you're zipping a directory,
     * the directory itself and all its children files to any level (any number of subdirectories)
     * are included in the zip file. The directory will be the only entry in the archive (single root).
     * If you're zipping a file, then a single entry, the instance,
     * is included in the output zip file. Note that a new File is created.
     * This file is never modified.
     * @throws IOException if the zip file can't be created.
     */
    zip(outputZipFile: File): void;
}

export = File;
