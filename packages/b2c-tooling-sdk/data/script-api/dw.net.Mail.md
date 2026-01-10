<!-- prettier-ignore-start -->
# Class Mail

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.net.Mail](dw.net.Mail.md)

This class is used to send an email with either plain text or MimeEncodedText content.
Recipient data (from, to, cc, bcc) and subject are specified
using setter methods. When the [send()](dw.net.Mail.md#send) method is invoked,
the email is put into an internal queue and sent asynchronously.


**Note:** when this class is used with sensitive data, be careful in persisting sensitive information to disk.


The following example script sends an email with MimeEncodedText content:


```

function sendMail() {
 var template: Template = new dw.util.Template("myTemplate.isml");

 var o: Map = new dw.util.HashMap();
 o.put("customer","customer");
 o.put("product","product");

 var content: MimeEncodedText = template.render(o);
 var mail: Mail = new dw.net.Mail();
 mail.addTo("to@example.org");
 mail.setFrom("from@example.org");
 mail.setSubject("Example Email");
 mail.setContent(content);

 mail.send();//returns either Status.ERROR or Status.OK, mail might not be sent yet, when this method returns
 }
```



 See **Sending email via scripts or hooks** in the documentation for additional examples.



## Property Summary

| Property | Description |
| --- | --- |
| [bcc](#bcc): [List](dw.util.List.md) | Gets the `bcc` address List. |
| [cc](#cc): [List](dw.util.List.md) | Gets the `cc` address List. |
| [from](#from): [String](TopLevel.String.md) | Gets the email address to use as the `from` address for the  email. |
| [replyTo](#replyto): [List](dw.util.List.md) `(read-only)` | Gets the `replyTo` address List. |
| [subject](#subject): [String](TopLevel.String.md) | Gets the `subject` of the email. |
| [to](#to): [List](dw.util.List.md) | Gets the `to` address List where the email is sent. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Mail](#mail)() |  |

## Method Summary

| Method | Description |
| --- | --- |
| [addAttachment](dw.net.Mail.md#addattachmentfile)([File](dw.io.File.md)) | Adds a file attachment to the email. |
| [addBcc](dw.net.Mail.md#addbccstring)([String](TopLevel.String.md)) | Adds an address to the `bcc` List. |
| [addCc](dw.net.Mail.md#addccstring)([String](TopLevel.String.md)) | Adds an address to the `cc` List. |
| [addReplyTo](dw.net.Mail.md#addreplytostring)([String](TopLevel.String.md)) | Adds an address to the `replyTo` List. |
| [addTo](dw.net.Mail.md#addtostring)([String](TopLevel.String.md)) | Adds an address to the `to` address List. |
| [getBcc](dw.net.Mail.md#getbcc)() | Gets the `bcc` address List. |
| [getCc](dw.net.Mail.md#getcc)() | Gets the `cc` address List. |
| [getFrom](dw.net.Mail.md#getfrom)() | Gets the email address to use as the `from` address for the  email. |
| [getReplyTo](dw.net.Mail.md#getreplyto)() | Gets the `replyTo` address List. |
| [getSubject](dw.net.Mail.md#getsubject)() | Gets the `subject` of the email. |
| [getTo](dw.net.Mail.md#getto)() | Gets the `to` address List where the email is sent. |
| [send](dw.net.Mail.md#send)() | prepares an email that is queued to the internal mail system for  delivery. |
| [setBcc](dw.net.Mail.md#setbcclist)([List](dw.util.List.md)) | Sets the `bcc` address List. |
| [setCc](dw.net.Mail.md#setcclist)([List](dw.util.List.md)) | Sets the `cc` address List where the email is sent. |
| [setContent](dw.net.Mail.md#setcontentmimeencodedtext)([MimeEncodedText](dw.value.MimeEncodedText.md)) | **Mandatory** Uses [MimeEncodedText](dw.value.MimeEncodedText.md) to set the  content, MIME type and encoding. |
| [setContent](dw.net.Mail.md#setcontentstring)([String](TopLevel.String.md)) | **Mandatory** Sets the email content. |
| [setContent](dw.net.Mail.md#setcontentstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | **Mandatory** Sets the email content, MIME type, and encoding. |
| [setFrom](dw.net.Mail.md#setfromstring)([String](TopLevel.String.md)) | **Mandatory** Sets the sender address for this email. |
| [setListUnsubscribe](dw.net.Mail.md#setlistunsubscribestring)([String](TopLevel.String.md)) | Sets the List-Unsubscribe header value to work with List-Unsubscribe-Post to allow integration with an  externally-managed mailing list. |
| [setListUnsubscribePost](dw.net.Mail.md#setlistunsubscribepoststring)([String](TopLevel.String.md)) | Sets the List-Unsubscribe-Post header value. |
| [setSubject](dw.net.Mail.md#setsubjectstring)([String](TopLevel.String.md)) | **Mandatory** sets the `subject` for the email. |
| [setTo](dw.net.Mail.md#settolist)([List](dw.util.List.md)) | Sets the `to` address List where the email is sent. |
| static [validateAddress](dw.net.Mail.md#validateaddressstring)([String](TopLevel.String.md)) | Validates the address that is sent as parameter. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### bcc
- bcc: [List](dw.util.List.md)
  - : Gets the `bcc` address List.


---

### cc
- cc: [List](dw.util.List.md)
  - : Gets the `cc` address List.


---

### from
- from: [String](TopLevel.String.md)
  - : Gets the email address to use as the `from` address for the
      email.



---

### replyTo
- replyTo: [List](dw.util.List.md) `(read-only)`
  - : Gets the `replyTo` address List.


---

### subject
- subject: [String](TopLevel.String.md)
  - : Gets the `subject` of the email.


---

### to
- to: [List](dw.util.List.md)
  - : Gets the `to` address List where the email is sent.


---

## Constructor Details

### Mail()
- Mail()
  - : 


---

## Method Details

### addAttachment(File)
- addAttachment(file: [File](dw.io.File.md)): [Mail](dw.net.Mail.md)
  - : Adds a file attachment to the email. This method is restricted to Job context only.

    **Parameters:**
    - file - The file to be attached to the email. Must not be null and must exist.

    **Returns:**
    - this Mail object

    **Throws:**
    - IllegalArgumentException - if the file is null, doesn't exist, or is not a file


---

### addBcc(String)
- addBcc(bcc: [String](TopLevel.String.md)): [Mail](dw.net.Mail.md)
  - : Adds an address to the `bcc` List. Address must conform to the RFC822 standard.

    **Parameters:**
    - bcc - new bcc address to add to `bcc` address List.

    **Returns:**
    - this Mail object.


---

### addCc(String)
- addCc(cc: [String](TopLevel.String.md)): [Mail](dw.net.Mail.md)
  - : Adds an address to the `cc` List. The address must conform to RFC822 standard.

    **Parameters:**
    - cc - new cc address to be added to `cc` address List.

    **Returns:**
    - this Mail object.


---

### addReplyTo(String)
- addReplyTo(replyTo: [String](TopLevel.String.md)): [Mail](dw.net.Mail.md)
  - : Adds an address to the `replyTo` List. Address must conform to the RFC822 standard.

    **Parameters:**
    - replyTo - new replyTo address to add to `replyTo` address List.

    **Returns:**
    - this Mail object.

    **Throws:**
    - IllegalArgumentException - if the email address is invalid


---

### addTo(String)
- addTo(to: [String](TopLevel.String.md)): [Mail](dw.net.Mail.md)
  - : Adds an address to the `to` address List. The address must conform to the RFC822 standard.

    **Parameters:**
    - to - email address to add to the `to` address List.

    **Returns:**
    - this Mail object.


---

### getBcc()
- getBcc(): [List](dw.util.List.md)
  - : Gets the `bcc` address List.

    **Returns:**
    - `bcc` address List or empty List if no `bcc`
              addresses are set.



---

### getCc()
- getCc(): [List](dw.util.List.md)
  - : Gets the `cc` address List.

    **Returns:**
    - `cc` address List or empty List if no `cc`
              addresses are set.



---

### getFrom()
- getFrom(): [String](TopLevel.String.md)
  - : Gets the email address to use as the `from` address for the
      email.


    **Returns:**
    - the `from` address for this mail or null if no `from`
              address is set yet.



---

### getReplyTo()
- getReplyTo(): [List](dw.util.List.md)
  - : Gets the `replyTo` address List.

    **Returns:**
    - `replyTo` address List or empty List if no `replyTo`
              addresses are set.



---

### getSubject()
- getSubject(): [String](TopLevel.String.md)
  - : Gets the `subject` of the email.

    **Returns:**
    - `subject` or null if no `subject` is set yet.


---

### getTo()
- getTo(): [List](dw.util.List.md)
  - : Gets the `to` address List where the email is sent.

    **Returns:**
    - `to` address List or empty List if no `to`
              addresses are set.



---

### send()
- send(): [Status](dw.system.Status.md)
  - : prepares an email that is queued to the internal mail system for
      delivery.


    **Returns:**
    - [Status](dw.system.Status.md) which tells if the mail could be
              successfully queued ( [Status.OK](dw.system.Status.md#ok)) or not (
              [Status.ERROR](dw.system.Status.md#error)). If an error is raised, more
              information about the reason for the failure can be found within the
              log files. If the mandatory fields `from`,
              `content`, and `subject` are
              empty an IllegalArgumentException is raised. An
              IllegalArgumentException is raised if neither `to`, `cc`
              nor `bcc` are set.



---

### setBcc(List)
- setBcc(bcc: [List](dw.util.List.md)): [Mail](dw.net.Mail.md)
  - : Sets the `bcc` address List. If there
      are already `bcc` addresses they are overwritten.


    **Parameters:**
    - bcc - list of Strings representing RFC822 compliant email             addresses. List replaces any previously set list of             addresses. Throws an exception if the given list is null.

    **Returns:**
    - this Mail object.


---

### setCc(List)
- setCc(cc: [List](dw.util.List.md)): [Mail](dw.net.Mail.md)
  - : Sets the `cc` address List where the email is sent. If there are
      already `cc` addresses set, they are overwritten. The address(es) must
      conform to the RFC822 standard.


    **Parameters:**
    - cc - List of Strings representing RFC822 compliant email             addresses. This List replaces any previously set List of             addresses. Throws an exception if the given List is null.

    **Returns:**
    - this Mail object


---

### setContent(MimeEncodedText)
- setContent(mimeEncodedText: [MimeEncodedText](dw.value.MimeEncodedText.md)): [Mail](dw.net.Mail.md)
  - : **Mandatory** Uses [MimeEncodedText](dw.value.MimeEncodedText.md) to set the
      content, MIME type and encoding.


    **Parameters:**
    - mimeEncodedText - MimeEncodedText from which the content, MIME type, and encoding             information is extracted.

    **Returns:**
    - this Mail object.


---

### setContent(String)
- setContent(content: [String](TopLevel.String.md)): [Mail](dw.net.Mail.md)
  - : **Mandatory** Sets the email content. The MIME type is set to
      "text/plain;charset=UTF-8" and encoding set to "UTF-8".


    **Parameters:**
    - content - String containing the content of the email.

    **Returns:**
    - this Mail object.


---

### setContent(String, String, String)
- setContent(content: [String](TopLevel.String.md), mimeType: [String](TopLevel.String.md), encoding: [String](TopLevel.String.md)): [Mail](dw.net.Mail.md)
  - : **Mandatory** Sets the email content, MIME type, and encoding. No
      validation of MIME type and encoding is done. It is the responsibility of
      the caller to specify a valid MIME type and encoding.


    **Parameters:**
    - content - String containing the content of the mail
    - mimeType - mime type of the content. For example             "text/plain;charset=UTF-8" or "text/html"
    - encoding - character encoding of the email content. For example UTF-8-8

    **Returns:**
    - this Mail object.


---

### setFrom(String)
- setFrom(from: [String](TopLevel.String.md)): [Mail](dw.net.Mail.md)
  - : **Mandatory** Sets the sender address for this email. The address must
      conform to the RFC822 standard.


    **Parameters:**
    - from - String containing a RFC822 compliant email address

    **Returns:**
    - this Mail object.


---

### setListUnsubscribe(String)
- setListUnsubscribe(listUnsubscribe: [String](TopLevel.String.md)): [Mail](dw.net.Mail.md)
  - : Sets the List-Unsubscribe header value to work with List-Unsubscribe-Post to allow integration with an
      externally-managed mailing list.


    **Parameters:**
    - listUnsubscribe - The List-Unsubscribe header value, e.g., "<https://example.com/unsubscribe>"

    **Returns:**
    - this Mail object


---

### setListUnsubscribePost(String)
- setListUnsubscribePost(listUnsubscribePost: [String](TopLevel.String.md)): [Mail](dw.net.Mail.md)
  - : Sets the List-Unsubscribe-Post header value. This header supports one-click unsubscribe functionality.

    **Parameters:**
    - listUnsubscribePost - The List-Unsubscribe-Post header value, typically "List-Unsubscribe=One-Click"

    **Returns:**
    - this Mail object


---

### setSubject(String)
- setSubject(subject: [String](TopLevel.String.md)): [Mail](dw.net.Mail.md)
  - : **Mandatory** sets the `subject` for the email. If the `subject` is not set
      or set to null at the time [send()](dw.net.Mail.md#send) is invoked and
      IllegalArgumentException is thrown.


    **Parameters:**
    - subject - `subject` of the mail to send.

    **Returns:**
    - this Mail object.


---

### setTo(List)
- setTo(to: [List](dw.util.List.md)): [Mail](dw.net.Mail.md)
  - : Sets the `to` address List where the email is sent. If there are
      already `to` addresses, they are overwritten.


    **Parameters:**
    - to - list of Strings representing RFC822 compliant email addresses.             List replaces any previously set List of addresses. Throws             an exception if the given List is null.

    **Returns:**
    - this Mail object


---

### validateAddress(String)
- static validateAddress(address: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Validates the address that is sent as parameter.
      This validation includes:
      
      - The format must match RFC822
      - The address must be 7-bit ASCII
      - The top-level domain must be IANA-registered
      - Sample domains such as example.com are not allowed


    **Parameters:**
    - address - Email address to be validated

    **Returns:**
    - true if valid, false otherwise


---

<!-- prettier-ignore-end -->
