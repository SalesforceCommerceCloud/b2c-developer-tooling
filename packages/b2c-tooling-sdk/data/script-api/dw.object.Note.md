<!-- prettier-ignore-start -->
# Class Note

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.Note](dw.object.Note.md)

Represents a note that can be attached to any persistent object
that supports this feature.



## Property Summary

| Property | Description |
| --- | --- |
| [createdBy](#createdby): [String](TopLevel.String.md) `(read-only)` | Return the login ID of user that is stored in the session at the time  the note is created. |
| [creationDate](#creationdate): [Date](TopLevel.Date.md) `(read-only)` | Return the date and time that the note was created. |
| [subject](#subject): [String](TopLevel.String.md) `(read-only)` | Return the subject of the note. |
| [text](#text): [String](TopLevel.String.md) `(read-only)` | Return the text of the note. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCreatedBy](dw.object.Note.md#getcreatedby)() | Return the login ID of user that is stored in the session at the time  the note is created. |
| [getCreationDate](dw.object.Note.md#getcreationdate)() | Return the date and time that the note was created. |
| [getSubject](dw.object.Note.md#getsubject)() | Return the subject of the note. |
| [getText](dw.object.Note.md#gettext)() | Return the text of the note. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### createdBy
- createdBy: [String](TopLevel.String.md) `(read-only)`
  - : Return the login ID of user that is stored in the session at the time
      the note is created.



---

### creationDate
- creationDate: [Date](TopLevel.Date.md) `(read-only)`
  - : Return the date and time that the note was created.  This is usually
      set by the system, but may be specified if the note is generated
      via an import.



---

### subject
- subject: [String](TopLevel.String.md) `(read-only)`
  - : Return the subject of the note.


---

### text
- text: [String](TopLevel.String.md) `(read-only)`
  - : Return the text of the note.


---

## Method Details

### getCreatedBy()
- getCreatedBy(): [String](TopLevel.String.md)
  - : Return the login ID of user that is stored in the session at the time
      the note is created.


    **Returns:**
    - the username.


---

### getCreationDate()
- getCreationDate(): [Date](TopLevel.Date.md)
  - : Return the date and time that the note was created.  This is usually
      set by the system, but may be specified if the note is generated
      via an import.


    **Returns:**
    - the creation date.


---

### getSubject()
- getSubject(): [String](TopLevel.String.md)
  - : Return the subject of the note.

    **Returns:**
    - the subject.


---

### getText()
- getText(): [String](TopLevel.String.md)
  - : Return the text of the note.

    **Returns:**
    - the text.


---

<!-- prettier-ignore-end -->
