<!-- prettier-ignore-start -->
# Class File

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.io.File](dw.io.File.md)

Represents a file resource accessible from scripting. As with
`java.io.File`, a `File` is essentially an
"abstract pathname" which may or may not denote an actual file on the file
system.  Methods `createNewFile`,
`mkdir`, `mkdirs`, and `remove` are provided
to actually manipulate physical files.


File access is limited to certain virtual directories.  These directories are
a subset of those accessible through WebDAV.  As a result of this
restriction, pathnames must be one of the following forms:



- `/TEMP(/...)`
- `/IMPEX(/...)`
- `/REALMDATA(/...)`
- `/CATALOGS/[Catalog Name](/...)`
- `/LIBRARIES/[Library Name](/...)`


Note, that these paths are analogous to the WebDAV URIs used to access the
same directories.


The files are stored in a shared file system where multiple processes could
access the same file. The programmer has to make sure no more than one process
writes to a file at a given time.



This class provides other useful methods for listing the
children of a directory and for working with zip files.


**Note:** when this class is used with sensitive data, be careful in persisting sensitive information.


For performance reasons no more than 100,000 files (regular files and directories) should be stored in a
directory.



## Constant Summary

| Constant | Description |
| --- | --- |
| [CATALOGS](#catalogs): [String](TopLevel.String.md) = "CATALOGS" | Catalogs root directory. |
| [CUSTOMERPI](#customerpi): [String](TopLevel.String.md) = "CUSTOMERPI" | Customer Payment Instrument root directory. |
| [CUSTOMER_SNAPSHOTS](#customer_snapshots): [String](TopLevel.String.md) = "CUSTOMERSNAPSHOTS" | Customer snapshots root directory. |
| [DYNAMIC](#dynamic): [String](TopLevel.String.md) = "DYNAMIC" | Reserved for future use. |
| [IMPEX](#impex): [String](TopLevel.String.md) = "IMPEX" | Import/export root directory. |
| [LIBRARIES](#libraries): [String](TopLevel.String.md) = "LIBRARIES" | Libraries root directory. |
| ~~[REALMDATA](#realmdata): [String](TopLevel.String.md) = "REALMDATA"~~ | RealmData root directory. |
| [SEPARATOR](#separator): [String](TopLevel.String.md) = "/" | The UNIX style '/' path separator, which must be used for files paths. |
| [STATIC](#static): [String](TopLevel.String.md) = "STATIC" | Static content root directory. |
| [TEMP](#temp): [String](TopLevel.String.md) = "TEMP" | Temp root directory. |

## Property Summary

| Property | Description |
| --- | --- |
| [directory](#directory): [Boolean](TopLevel.Boolean.md) `(read-only)` | Indicates that this file is a directory. |
| [file](#file): [Boolean](TopLevel.Boolean.md) `(read-only)` | Indicates if this file is a file. |
| [fullPath](#fullpath): [String](TopLevel.String.md) `(read-only)` | Return the full file path denoted by this `File`. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns the name of the file or directory denoted by this object. |
| ~~[path](#path): [String](TopLevel.String.md)~~ `(read-only)` | Returns the portion of the path relative to the root directory. |
| [rootDirectoryType](#rootdirectorytype): [String](TopLevel.String.md) `(read-only)` | Returns the root directory type, e.g. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [File](#filestring)([String](TopLevel.String.md)) | Creates a `File` from the given absolute file path in the  file namespace. |
| [File](#filefile-string)([File](dw.io.File.md), [String](TopLevel.String.md)) | Creates a `File` given a root directory and a relative path. |

## Method Summary

| Method | Description |
| --- | --- |
| [copyTo](dw.io.File.md#copytofile)([File](dw.io.File.md)) | Copy a file. |
| [createNewFile](dw.io.File.md#createnewfile)() | Create file. |
| [exists](dw.io.File.md#exists)() | Indicates if the file exists. |
| [getFullPath](dw.io.File.md#getfullpath)() | Return the full file path denoted by this `File`. |
| [getName](dw.io.File.md#getname)() | Returns the name of the file or directory denoted by this object. |
| ~~[getPath](dw.io.File.md#getpath)()~~ | Returns the portion of the path relative to the root directory. |
| static [getRootDirectory](dw.io.File.md#getrootdirectorystring-string)([String](TopLevel.String.md), [String...](TopLevel.String.md)) | Returns a `File` representing a directory for the specified  root directory type. |
| [getRootDirectoryType](dw.io.File.md#getrootdirectorytype)() | Returns the root directory type, e.g. |
| [gunzip](dw.io.File.md#gunzipfile)([File](dw.io.File.md)) | Assumes this instance is a gzip file. |
| [gzip](dw.io.File.md#gzipfile)([File](dw.io.File.md)) | GZip this instance into a new gzip file. |
| [isDirectory](dw.io.File.md#isdirectory)() | Indicates that this file is a directory. |
| [isFile](dw.io.File.md#isfile)() | Indicates if this file is a file. |
| [lastModified](dw.io.File.md#lastmodified)() | Return the time, in milliseconds, that this file was last modified. |
| [length](dw.io.File.md#length)() | Return the length of the file in bytes. |
| [list](dw.io.File.md#list)() | Returns an array of strings naming the files and directories in the  directory denoted by this object. |
| [listFiles](dw.io.File.md#listfiles)() | Returns an array of `File` objects in the directory denoted  by this `File`. |
| [listFiles](dw.io.File.md#listfilesfunction)([Function](TopLevel.Function.md)) | Returns an array of `File` objects denoting the files and  directories in the directory denoted by this object that satisfy the  specified filter. |
| [md5](dw.io.File.md#md5)() | Returns an MD5 hash of the content of the file of this instance. |
| [mkdir](dw.io.File.md#mkdir)() | Creates a directory. |
| [mkdirs](dw.io.File.md#mkdirs)() | Creates a directory, including, its parent directories, as needed. |
| [remove](dw.io.File.md#remove)() | Deletes the file or directory denoted by this object. |
| [renameTo](dw.io.File.md#renametofile)([File](dw.io.File.md)) | Rename file. |
| [unzip](dw.io.File.md#unzipfile)([File](dw.io.File.md)) | Assumes this instance is a zip file. |
| [zip](dw.io.File.md#zipfile)([File](dw.io.File.md)) | Zip this instance into a new zip file. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### CATALOGS

- CATALOGS: [String](TopLevel.String.md) = "CATALOGS"
  - : Catalogs root directory.


---

### CUSTOMERPI

- CUSTOMERPI: [String](TopLevel.String.md) = "CUSTOMERPI"
  - : Customer Payment Instrument root directory.


---

### CUSTOMER_SNAPSHOTS

- CUSTOMER_SNAPSHOTS: [String](TopLevel.String.md) = "CUSTOMERSNAPSHOTS"
  - : Customer snapshots root directory.


---

### DYNAMIC

- DYNAMIC: [String](TopLevel.String.md) = "DYNAMIC"
  - : Reserved for future use.


---

### IMPEX

- IMPEX: [String](TopLevel.String.md) = "IMPEX"
  - : Import/export root directory.


---

### LIBRARIES

- LIBRARIES: [String](TopLevel.String.md) = "LIBRARIES"
  - : Libraries root directory.


---

### REALMDATA

- ~~REALMDATA: [String](TopLevel.String.md) = "REALMDATA"~~
  - : RealmData root directory.

    **Deprecated:**
:::warning
Folder to be removed.
:::

---

### SEPARATOR

- SEPARATOR: [String](TopLevel.String.md) = "/"
  - : The UNIX style '/' path separator, which must be used for files paths.


---

### STATIC

- STATIC: [String](TopLevel.String.md) = "STATIC"
  - : Static content root directory.


---

### TEMP

- TEMP: [String](TopLevel.String.md) = "TEMP"
  - : Temp root directory.


---

## Property Details

### directory
- directory: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Indicates that this file is a directory.


---

### file
- file: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Indicates if this file is a file.


---

### fullPath
- fullPath: [String](TopLevel.String.md) `(read-only)`
  - : Return the full file path denoted by this `File`.
      This value will be the same regardless of which constructor was
      used to create this `File`.



---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the file or directory denoted by this object. This is
      just the last name in the pathname's name sequence. If the pathname's
      name sequence is empty, then the empty string is returned.



---

### path
- ~~path: [String](TopLevel.String.md)~~ `(read-only)`
  - : Returns the portion of the path relative to the root directory.

    **Deprecated:**
:::warning
Use [getFullPath()](dw.io.File.md#getfullpath) to access the full path.
            This method does not return the correct path for files
            in the CATALOGS or LIBRARIES virtual directories.

:::

---

### rootDirectoryType
- rootDirectoryType: [String](TopLevel.String.md) `(read-only)`
  - : Returns the root directory type, e.g. "IMPEX" represented by this
      `File`.



---

## Constructor Details

### File(String)
- File(absPath: [String](TopLevel.String.md))
  - : Creates a `File` from the given absolute file path in the
      file namespace.  If the specified path is not a valid accessible path,
      an exception will be thrown.
      
      
      The passed path should use the forward slash '/' as the path
      separator and begin with a leading slash.  However, if a leading slash
      is not provided, or the backslash character is used as the separator,
      these problems will be fixed.  The normalized value will then be returned
      by [getFullPath()](dw.io.File.md#getfullpath).


    **Parameters:**
    - absPath - the absolute file path  throws IOException


---

### File(File, String)
- File(rootDir: [File](dw.io.File.md), relPath: [String](TopLevel.String.md))
  - : Creates a `File` given a root directory and a relative path.

    **Parameters:**
    - rootDir - File object representing root directory
    - relPath - relative file path


---

## Method Details

### copyTo(File)
- copyTo(file: [File](dw.io.File.md)): [File](dw.io.File.md)
  - : Copy a file. Directories cannot be copied. This method cannot be used from storefront requests.

    **Parameters:**
    - file - the File object to copy to

    **Returns:**
    - a reference to the copied file.

    **Throws:**
    - IOException - if there is an interruption during file copy.
    - FileAlreadyExistsException - if the file to copy to already exists
    - UnsupportedOperationException - if invoked from a storefront request


---

### createNewFile()
- createNewFile(): [Boolean](TopLevel.Boolean.md)
  - : Create file.

    **Returns:**
    - boolean, true - if file has been created, false - file already exists

    **Throws:**
    - Exception - 


---

### exists()
- exists(): [Boolean](TopLevel.Boolean.md)
  - : Indicates if the file exists.

    **Returns:**
    - true if file exists, false otherwise.


---

### getFullPath()
- getFullPath(): [String](TopLevel.String.md)
  - : Return the full file path denoted by this `File`.
      This value will be the same regardless of which constructor was
      used to create this `File`.


    **Returns:**
    - the full file path.


---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the name of the file or directory denoted by this object. This is
      just the last name in the pathname's name sequence. If the pathname's
      name sequence is empty, then the empty string is returned.


    **Returns:**
    - The name of the file or directory denoted by this object.


---

### getPath()
- ~~getPath(): [String](TopLevel.String.md)~~
  - : Returns the portion of the path relative to the root directory.

    **Returns:**
    - the relative file path, possibly blank but not null.

    **Deprecated:**
:::warning
Use [getFullPath()](dw.io.File.md#getfullpath) to access the full path.
            This method does not return the correct path for files
            in the CATALOGS or LIBRARIES virtual directories.

:::

---

### getRootDirectory(String, String...)
- static getRootDirectory(rootDir: [String](TopLevel.String.md), args: [String...](TopLevel.String.md)): [File](dw.io.File.md)
  - : Returns a `File` representing a directory for the specified
      root directory type. If the root directory
      type is CATALOGS or LIBRARIES, then an additional argument representing
      the specific catalog or library must be provided.  Otherwise, no
      additional arguments are needed.


    **Parameters:**
    - rootDir - root directory type (see the constants defined in this class)
    - args - root directory specific arguments

    **Returns:**
    - File object representing the directory


---

### getRootDirectoryType()
- getRootDirectoryType(): [String](TopLevel.String.md)
  - : Returns the root directory type, e.g. "IMPEX" represented by this
      `File`.


    **Returns:**
    - root directory type


---

### gunzip(File)
- gunzip(root: [File](dw.io.File.md)): void
  - : Assumes this instance is a gzip file. Unzipping it will
      explode the contents in the directory passed in (root).


    **Parameters:**
    - root - a File indicating root. root must be a directory.

    **Throws:**
    - Exception - if the zip files contents can't be exploded.


---

### gzip(File)
- gzip(outputZipFile: [File](dw.io.File.md)): void
  - : GZip this instance into a new gzip file. If you're zipping a file, then a single entry, the instance,
      is included in the output gzip file. Note that a new File is created. GZipping directories is not supported.
      This file is never modified.


    **Parameters:**
    - outputZipFile - the zip file created.

    **Throws:**
    - IOException - if the zip file can't be created.


---

### isDirectory()
- isDirectory(): [Boolean](TopLevel.Boolean.md)
  - : Indicates that this file is a directory.

    **Returns:**
    - true if the file is a directory, false otherwise.


---

### isFile()
- isFile(): [Boolean](TopLevel.Boolean.md)
  - : Indicates if this file is a file.

    **Returns:**
    - true if the file is a file, false otherwise.


---

### lastModified()
- lastModified(): [Number](TopLevel.Number.md)
  - : Return the time, in milliseconds, that this file was last modified.

    **Returns:**
    - the time, in milliseconds, that this file was last modified.


---

### length()
- length(): [Number](TopLevel.Number.md)
  - : Return the length of the file in bytes.

    **Returns:**
    - the file length in bytes.


---

### list()
- list(): [String\[\]](TopLevel.String.md)
  - : Returns an array of strings naming the files and directories in the
      directory denoted by this object.
      
      
      
      If this object does not denote a directory, then this method returns
      `null`. Otherwise an array of strings is returned, one for
      each file or directory in the directory. Names denoting the directory
      itself and the directory's parent directory are not included in the
      result. Each string is a file name rather than a complete path.
      
      
      
      There is no guarantee that the name strings in the resulting array will
      appear in any specific order; they are not, in particular, guaranteed to
      appear in alphabetical order.


    **Returns:**
    - An array of strings naming the files and directories in the
              directory denoted by this `File`. The array will be
              empty if the directory is empty. Returns `null` if
              this `File` does not denote a directory.



---

### listFiles()
- listFiles(): [List](dw.util.List.md)
  - : Returns an array of `File` objects in the directory denoted
      by this `File`.
      
      
      
      If this `File` does not denote a directory, then this method
      returns `null`. Otherwise an array of `File`
      objects is returned, one for each file or directory in the directory.
      Files denoting the directory itself and the directory's parent directory
      are not included in the result.
      
      
      
      There is no guarantee that the files in the resulting array will appear
      in any specific order; they are not, in particular, guaranteed to appear
      in alphabetical order. Example usage:
      
      
      
      `
       // Assume "foo" is an accessible directory.
      
       var this_directory : dw.io.File = new File("foo");
      
       
      
       // Find all files in directory foo, one level "down".
      
       // listFiles() will _not_ traverse subdirectories.
      
      var folder : dw.util.List = this_directory.listFiles();
      
      var first_element : dw.io.File = folder[0];
      
      
      
      function modification_comparison(lhs : File, rhs : File) 
      
      {
      
      &nbsp;&nbsp;return lhs.lastModified() < rhs.lastModified();
      
      }
      
      
      
      function lexigraphic_comparison(lhs: File, rhs : File)
      
      {
      
      &nbsp;&nbsp;return lhs.getName() < rhs.getName();
      
      }
      
      
      
      var time_ordered_folder : dw.util.ArrayList = folder.sort(modification_comparison);
      
      var alphabetic_folder : dw.util.ArrayList = folder.sort(lexigraphic_comparison); 
      
      `


    **Returns:**
    - a list of `File` objects or `null` if
              this is not a directory.



---

### listFiles(Function)
- listFiles(filter: [Function](TopLevel.Function.md)): [List](dw.util.List.md)
  - : Returns an array of `File` objects denoting the files and
      directories in the directory denoted by this object that satisfy the
      specified filter. The behavior of this method is the same as that of the
      `[listFiles()](dw.io.File.md#listfiles)` method, except that the files in the
      returned array must satisfy the filter. The filter is a Javascript
      function which accepts one argument, a `File`, and returns
      true or false depending on whether the file meets the filter conditions.
      If the given `filter` is `null` then all files
      are accepted. Otherwise, a file satisfies the filter if and only if the
      filter returns `true`. Example usage:
      
      
      
      `
       // Assume "foo" is an accessible directory.
      
       var this_directory : dw.io.File = new File("foo");
      
       
      
       function longer_than_3(candidate : dw.io.File)
      
       {
      
       &nbsp;&nbsp;return candidate.getName().length > 3;
      
       }
      
       
      
       // Find all files in directory foo, one level "down",
      
       // such that the filename is longer than 3 characters.
      
       var folder_long_names : dw.util.List = this_directory.listFiles(longer_than_3);
      
       `


    **Parameters:**
    - filter - a Javascript function which accepts a `File`             argument and returns `true` or `false`.

    **Returns:**
    - list of `File` objects or `null` if
              this is not a directory



---

### md5()
- md5(): [String](TopLevel.String.md)
  - : Returns an MD5 hash of the content of the file of this instance.

    **Returns:**
    - The MD5 hash of the file's content.

    **Throws:**
    - Exception - if the file could not be read or is a directory.


---

### mkdir()
- mkdir(): [Boolean](TopLevel.Boolean.md)
  - : Creates a directory.

    **Returns:**
    - true if file creation succeeded, false otherwise.


---

### mkdirs()
- mkdirs(): [Boolean](TopLevel.Boolean.md)
  - : Creates a directory, including, its parent directories, as needed.

    **Returns:**
    - true if file creation succeeded, false otherwise.


---

### remove()
- remove(): [Boolean](TopLevel.Boolean.md)
  - : Deletes the file or directory denoted by this object. If this File
      represents a directory, then the directory must be empty in order to be
      deleted.


    **Returns:**
    - true if file deletion succeeded, false otherwise


---

### renameTo(File)
- renameTo(file: [File](dw.io.File.md)): [Boolean](TopLevel.Boolean.md)
  - : Rename file.

    **Parameters:**
    - file - the File object to rename to

    **Returns:**
    - boolean, true - if file rename succeeded, false - failed


---

### unzip(File)
- unzip(root: [File](dw.io.File.md)): void
  - : Assumes this instance is a zip file. Unzipping it will
      explode the contents in the directory passed in (root).


    **Parameters:**
    - root - a File indicating root. root must be a directory.

    **Throws:**
    - Exception - if the zip files contents can't be exploded.


---

### zip(File)
- zip(outputZipFile: [File](dw.io.File.md)): void
  - : Zip this instance into a new zip file. If you're zipping a directory,
      the directory itself and all its children files to any level (any number of subdirectories)
      are included in the zip file. The directory will be the only entry in the archive (single root).
      If you're zipping a file, then a single entry, the instance,
      is included in the output zip file. Note that a new File is created.
      This file is never modified.


    **Parameters:**
    - outputZipFile - the zip file created.

    **Throws:**
    - IOException - if the zip file can't be created.


---

<!-- prettier-ignore-end -->
