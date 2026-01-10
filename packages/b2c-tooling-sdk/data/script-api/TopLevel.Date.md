<!-- prettier-ignore-start -->
# Class Date

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.Date](TopLevel.Date.md)

A Date object contains a number indicating a particular instant in time to within a millisecond. The number may also
be NaN, indicating that the Date object does not represent a specific instant of time.



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Date](#date)() | Constructs the Date instance using the current date and time. |
| [Date](#datenumber)([Number](TopLevel.Number.md)) | Constructs the Date instance using the specified milliseconds. |
| [Date](#datenumber-number-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Number...](TopLevel.Number.md)) | Constructs the Date instance using the specified year and month. |
| [Date](#datestring)([String](TopLevel.String.md)) | Constructs the Date instance by parsing the specified String. |

## Method Summary

| Method | Description |
| --- | --- |
| static [UTC](TopLevel.Date.md#utcnumber-number-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Number...](TopLevel.Number.md)) | Returns the number of milliseconds since midnight of January 1, 1970 according to universal time. |
| [getDate](TopLevel.Date.md#getdate)() | Returns the day of the month where the value is a Number from 1 to 31. |
| [getDay](TopLevel.Date.md#getday)() | Returns the day of the week where the value is a Number from 0 to 6. |
| [getFullYear](TopLevel.Date.md#getfullyear)() | Returns the year of the Date in four-digit format. |
| [getHours](TopLevel.Date.md#gethours)() | Return the hours field of the Date where the value is a Number from 0 (midnight) to 23 (11 PM). |
| [getMilliseconds](TopLevel.Date.md#getmilliseconds)() | Returns the milliseconds field of the Date. |
| [getMinutes](TopLevel.Date.md#getminutes)() | Return the minutes field of the Date where the value is a Number from 0 to 59. |
| [getMonth](TopLevel.Date.md#getmonth)() | Returns the month of the year as a value between 0 and 11. |
| [getSeconds](TopLevel.Date.md#getseconds)() | Return the seconds field of the Date where the value is a Number from 0 to 59. |
| [getTime](TopLevel.Date.md#gettime)() | Returns the internal, millisecond representation of the Date object. |
| [getTimezoneOffset](TopLevel.Date.md#gettimezoneoffset)() | Returns the difference between local time and Greenwich Mean Time (GMT) in minutes. |
| [getUTCDate](TopLevel.Date.md#getutcdate)() | Returns the day of the month where the value is a Number from 1 to 31 when date is expressed in universal time. |
| [getUTCDay](TopLevel.Date.md#getutcday)() | Returns the day of the week where the value is a Number from 0 to 6 when date is expressed in universal time. |
| [getUTCFullYear](TopLevel.Date.md#getutcfullyear)() | Returns the year when the Date is expressed in universal time. |
| [getUTCHours](TopLevel.Date.md#getutchours)() | Return the hours field, expressed in universal time, of the Date where the value is a Number from 0 (midnight) to  23 (11 PM). |
| [getUTCMilliseconds](TopLevel.Date.md#getutcmilliseconds)() | Returns the milliseconds field, expressed in universal time, of the Date. |
| [getUTCMinutes](TopLevel.Date.md#getutcminutes)() | Return the minutes field, expressed in universal time, of the Date where the value is a Number from 0 to 59. |
| [getUTCMonth](TopLevel.Date.md#getutcmonth)() | Returns the month of the year that results when the Date is expressed in universal time. |
| [getUTCSeconds](TopLevel.Date.md#getutcseconds)() | Return the seconds field, expressed in universal time, of the Date where the value is a Number from 0 to 59. |
| static [now](TopLevel.Date.md#now)() | Returns the number of milliseconds since midnight of January 1, 1970 up until now. |
| static [parse](TopLevel.Date.md#parsestring)([String](TopLevel.String.md)) | Takes a date string and returns the number of milliseconds since midnight of January 1, 1970. |
| [setDate](TopLevel.Date.md#setdatenumber)([Number](TopLevel.Number.md)) | Sets the day of the month where the value is a Number from 1 to 31. |
| [setFullYear](TopLevel.Date.md#setfullyearnumber-number)([Number](TopLevel.Number.md), [Number...](TopLevel.Number.md)) | Sets the full year of Date where the value must be a four-digit Number. |
| [setHours](TopLevel.Date.md#sethoursnumber-number)([Number](TopLevel.Number.md), [Number...](TopLevel.Number.md)) | Sets the hours field of this Date instance. |
| [setMilliseconds](TopLevel.Date.md#setmillisecondsnumber)([Number](TopLevel.Number.md)) | Sets the milliseconds field of this Date instance. |
| [setMinutes](TopLevel.Date.md#setminutesnumber-number)([Number](TopLevel.Number.md), [Number...](TopLevel.Number.md)) | Sets the minutes field of this Date instance. |
| [setMonth](TopLevel.Date.md#setmonthnumber-number)([Number](TopLevel.Number.md), [Number...](TopLevel.Number.md)) | Sets the month of the year where the value is a Number from 0 to 11. |
| [setSeconds](TopLevel.Date.md#setsecondsnumber-number)([Number](TopLevel.Number.md), [Number...](TopLevel.Number.md)) | Sets the seconds field of this Date instance. |
| [setTime](TopLevel.Date.md#settimenumber)([Number](TopLevel.Number.md)) | Sets the number of milliseconds between the desired date and time and January 1, 1970. |
| [setUTCDate](TopLevel.Date.md#setutcdatenumber)([Number](TopLevel.Number.md)) | Sets the day of the month, expressed in universal time, where the value is a Number from 1 to 31. |
| [setUTCFullYear](TopLevel.Date.md#setutcfullyearnumber-number)([Number](TopLevel.Number.md), [Number...](TopLevel.Number.md)) | Sets the full year, expressed in universal time, of Date where the value must be a four-digit Number. |
| [setUTCHours](TopLevel.Date.md#setutchoursnumber-number)([Number](TopLevel.Number.md), [Number...](TopLevel.Number.md)) | Sets the hours field, expressed in universal time, of this Date instance. |
| [setUTCMilliseconds](TopLevel.Date.md#setutcmillisecondsnumber)([Number](TopLevel.Number.md)) | Sets the milliseconds field, expressed in universal time, of this Date instance. |
| [setUTCMinutes](TopLevel.Date.md#setutcminutesnumber-number)([Number](TopLevel.Number.md), [Number...](TopLevel.Number.md)) | Sets the minutes field, expressed in universal time, of this Date instance. |
| [setUTCMonth](TopLevel.Date.md#setutcmonthnumber-number)([Number](TopLevel.Number.md), [Number...](TopLevel.Number.md)) | Sets the month of the year, expressed in universal time, where the value is a Number from 0 to 11. |
| [setUTCSeconds](TopLevel.Date.md#setutcsecondsnumber-number)([Number](TopLevel.Number.md), [Number...](TopLevel.Number.md)) | Sets the seconds field, expressed in universal time, of this Date instance. |
| [toDateString](TopLevel.Date.md#todatestring)() | Returns the Date as a String value where the value represents the _date_ portion of the Date in the default  locale (en\_US). |
| [toISOString](TopLevel.Date.md#toisostring)() | This function returns a string value represent the instance in time represented by this Date object. |
| [toJSON](TopLevel.Date.md#tojsonstring)([String](TopLevel.String.md)) | This function returns the same string as Date.prototype.toISOString(). |
| [toLocaleDateString](TopLevel.Date.md#tolocaledatestring)() | Returns the Date as a String value where the value represents the _date_ portion of the Date in the default  locale (en\_US). |
| [toLocaleString](TopLevel.Date.md#tolocalestring)() | Returns the Date as a String using the default locale (en\_US). |
| [toLocaleTimeString](TopLevel.Date.md#tolocaletimestring)() | Returns the Date as a String value where the value represents the _time_ portion of the Date in the default  locale (en\_US). |
| [toTimeString](TopLevel.Date.md#totimestring)() | Returns the Date as a String value where the value represents the _time_ portion of the Date in the default  locale (en\_US). |
| [toUTCString](TopLevel.Date.md#toutcstring)() | Returns a String representation of this Date, expressed in universal time. |
| [valueOf](TopLevel.Date.md#valueof)() | Returns the value of this Date represented in milliseconds. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### Date()
- Date()
  - : Constructs the Date instance using the current date and time.


---

### Date(Number)
- Date(millis: [Number](TopLevel.Number.md))
  - : Constructs the Date instance using the specified milliseconds.

    **Parameters:**
    - millis - the number of milliseconds between the desired date and January 1, 1970 (UTC). For example, value             of 10000 would create a Date instance representing 10 seconds past midnight on January 1, 1970.


---

### Date(Number, Number, Number...)
- Date(year: [Number](TopLevel.Number.md), month: [Number](TopLevel.Number.md), args: [Number...](TopLevel.Number.md))
  - : Constructs the Date instance using the specified year and month. Optionally, you can pass up to five additional
      arguments representing date, hours, minutes, seconds, and milliseconds.


    **Parameters:**
    - year - a number representing the year.
    - month - a number representing the month.
    - args - a set of numbers representing the date, hours, minutes, seconds, and milliseconds.


---

### Date(String)
- Date(dateString: [String](TopLevel.String.md))
  - : Constructs the Date instance by parsing the specified String.

    **Parameters:**
    - dateString - represents a Date in a valid date format.


---

## Method Details

### UTC(Number, Number, Number...)
- static UTC(year: [Number](TopLevel.Number.md), month: [Number](TopLevel.Number.md), args: [Number...](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the number of milliseconds since midnight of January 1, 1970 according to universal time. Optionally, you
      can pass up to five additional arguments representing date, hours, minutes, seconds, and milliseconds.


    **Parameters:**
    - year - a number representing the year.
    - month - a number representing the month.
    - args - a set of numbers representing the date, hours, minutes, seconds, and milliseconds.

    **Returns:**
    - the number of milliseconds since midnight of January 1, 1970 according to universal time.


---

### getDate()
- getDate(): [Number](TopLevel.Number.md)
  - : Returns the day of the month where the value is a Number from 1 to 31.

    **Returns:**
    - the day of the month where the value is a Number from 1 to 31.


---

### getDay()
- getDay(): [Number](TopLevel.Number.md)
  - : Returns the day of the week where the value is a Number from 0 to 6.

    **Returns:**
    - the day of the month where the value is a Number from 0 to 6.


---

### getFullYear()
- getFullYear(): [Number](TopLevel.Number.md)
  - : Returns the year of the Date in four-digit format.

    **Returns:**
    - the year of the Date in four-digit format.


---

### getHours()
- getHours(): [Number](TopLevel.Number.md)
  - : Return the hours field of the Date where the value is a Number from 0 (midnight) to 23 (11 PM).

    **Returns:**
    - the hours field of the Date where the value is a Number from 0 (midnight) to 23 (11 PM).


---

### getMilliseconds()
- getMilliseconds(): [Number](TopLevel.Number.md)
  - : Returns the milliseconds field of the Date.

    **Returns:**
    - the milliseconds field of the Date.


---

### getMinutes()
- getMinutes(): [Number](TopLevel.Number.md)
  - : Return the minutes field of the Date where the value is a Number from 0 to 59.

    **Returns:**
    - the minutes field of the Date where the value is a Number from 0 to 59.


---

### getMonth()
- getMonth(): [Number](TopLevel.Number.md)
  - : Returns the month of the year as a value between 0 and 11.

    **Returns:**
    - the month of the year as a value between 0 and 11.


---

### getSeconds()
- getSeconds(): [Number](TopLevel.Number.md)
  - : Return the seconds field of the Date where the value is a Number from 0 to 59.

    **Returns:**
    - the seconds field of the Date where the value is a Number from 0 to 59.


---

### getTime()
- getTime(): [Number](TopLevel.Number.md)
  - : Returns the internal, millisecond representation of the Date object. This value is independent of time zone.

    **Returns:**
    - the internal, millisecond representation of the Date object.


---

### getTimezoneOffset()
- getTimezoneOffset(): [Number](TopLevel.Number.md)
  - : Returns the difference between local time and Greenwich Mean Time (GMT) in minutes.

    **Returns:**
    - the difference between local time and Greenwich Mean Time (GMT) in minutes.


---

### getUTCDate()
- getUTCDate(): [Number](TopLevel.Number.md)
  - : Returns the day of the month where the value is a Number from 1 to 31 when date is expressed in universal time.

    **Returns:**
    - the day of the month where the value is a Number from 1 to 31 when date is expressed in universal time.


---

### getUTCDay()
- getUTCDay(): [Number](TopLevel.Number.md)
  - : Returns the day of the week where the value is a Number from 0 to 6 when date is expressed in universal time.

    **Returns:**
    - the day of the week where the value is a Number from 0 to 6 when date is expressed in universal time.


---

### getUTCFullYear()
- getUTCFullYear(): [Number](TopLevel.Number.md)
  - : Returns the year when the Date is expressed in universal time. The return value is a four-digit format.

    **Returns:**
    - the year of the Date in four-digit form.


---

### getUTCHours()
- getUTCHours(): [Number](TopLevel.Number.md)
  - : Return the hours field, expressed in universal time, of the Date where the value is a Number from 0 (midnight) to
      23 (11 PM).


    **Returns:**
    - the hours field, expressed in universal time, of the Date where the value is a Number from 0 (midnight)
              to 23 (11 PM).



---

### getUTCMilliseconds()
- getUTCMilliseconds(): [Number](TopLevel.Number.md)
  - : Returns the milliseconds field, expressed in universal time, of the Date.

    **Returns:**
    - the milliseconds field, expressed in universal time, of the Date.


---

### getUTCMinutes()
- getUTCMinutes(): [Number](TopLevel.Number.md)
  - : Return the minutes field, expressed in universal time, of the Date where the value is a Number from 0 to 59.

    **Returns:**
    - the minutes field, expressed in universal time, of the Date where the value is a Number from 0 to 59.


---

### getUTCMonth()
- getUTCMonth(): [Number](TopLevel.Number.md)
  - : Returns the month of the year that results when the Date is expressed in universal time. The return value is a
      Number betwee 0 and 11.


    **Returns:**
    - the month of the year as a value between 0 and 11.


---

### getUTCSeconds()
- getUTCSeconds(): [Number](TopLevel.Number.md)
  - : Return the seconds field, expressed in universal time, of the Date where the value is a Number from 0 to 59.

    **Returns:**
    - the seconds field, expressed in universal time, of the Date where the value is a Number from 0 to 59.


---

### now()
- static now(): [Number](TopLevel.Number.md)
  - : Returns the number of milliseconds since midnight of January 1, 1970 up until now.

    **Returns:**
    - the number of milliseconds since midnight of January 1, 1970.


---

### parse(String)
- static parse(dateString: [String](TopLevel.String.md)): [Number](TopLevel.Number.md)
  - : Takes a date string and returns the number of milliseconds since midnight of January 1, 1970.
      
      Supports:
      
      - RFC2822 date strings
      - strings matching the exact ISO 8601 format 'YYYY-MM-DDTHH:mm:ss.sssZ'


    **Parameters:**
    - dateString - represents a Date in a valid date format.

    **Returns:**
    - the number of milliseconds since midnight of January 1, 1970 or NaN if no date could be recognized.


---

### setDate(Number)
- setDate(date: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Sets the day of the month where the value is a Number from 1 to 31.

    **Parameters:**
    - date - the day of the month.

    **Returns:**
    - the millisecond representation of the adjusted date.


---

### setFullYear(Number, Number...)
- setFullYear(year: [Number](TopLevel.Number.md), args: [Number...](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Sets the full year of Date where the value must be a four-digit Number. Optionally, you can set the month and
      date.


    **Parameters:**
    - year - the year as a four-digit Number.
    - args - the month and day of the month.

    **Returns:**
    - the millisecond representation of the adjusted date.


---

### setHours(Number, Number...)
- setHours(hours: [Number](TopLevel.Number.md), args: [Number...](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Sets the hours field of this Date instance. The minutes value should be a Number from 0 to 23. Optionally, hours,
      seconds and milliseconds can also be provided.


    **Parameters:**
    - hours - the minutes field of this Date instance.
    - args - the hours, seconds and milliseconds values for this Date instance.

    **Returns:**
    - the millisecond representation of the adjusted date.


---

### setMilliseconds(Number)
- setMilliseconds(millis: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Sets the milliseconds field of this Date instance.

    **Parameters:**
    - millis - the milliseconds field of this Date instance.

    **Returns:**
    - the millisecond representation of the adjusted date.


---

### setMinutes(Number, Number...)
- setMinutes(minutes: [Number](TopLevel.Number.md), args: [Number...](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Sets the minutes field of this Date instance. The minutes value should be a Number from 0 to 59. Optionally,
      seconds and milliseconds can also be provided.


    **Parameters:**
    - minutes - the minutes field of this Date instance.
    - args - the seconds and milliseconds value for this Date instance.

    **Returns:**
    - the millisecond representation of the adjusted date.


---

### setMonth(Number, Number...)
- setMonth(month: [Number](TopLevel.Number.md), date: [Number...](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Sets the month of the year where the value is a Number from 0 to 11. Optionally, you can set the day of the
      month.


    **Parameters:**
    - month - the month of the year.
    - date - the day of the month.

    **Returns:**
    - the millisecond representation of the adjusted date.


---

### setSeconds(Number, Number...)
- setSeconds(seconds: [Number](TopLevel.Number.md), millis: [Number...](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Sets the seconds field of this Date instance. The seconds value should be a Number from 0 to 59. Optionally,
      milliseconds can also be provided.


    **Parameters:**
    - seconds - the seconds field of this Date instance.
    - millis - the milliseconds field of this Date instance.

    **Returns:**
    - the millisecond representation of the adjusted date.


---

### setTime(Number)
- setTime(millis: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Sets the number of milliseconds between the desired date and time and January 1, 1970.

    **Parameters:**
    - millis - the number of milliseconds between the desired date and time and January 1, 1970.

    **Returns:**
    - the millisecond representation of the adjusted date.


---

### setUTCDate(Number)
- setUTCDate(date: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Sets the day of the month, expressed in universal time, where the value is a Number from 1 to 31.

    **Parameters:**
    - date - the day of the month, expressed in universal time.

    **Returns:**
    - the millisecond representation of the adjusted date.


---

### setUTCFullYear(Number, Number...)
- setUTCFullYear(year: [Number](TopLevel.Number.md), args: [Number...](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Sets the full year, expressed in universal time, of Date where the value must be a four-digit Number. Optionally,
      you can set the month and date.


    **Parameters:**
    - year - the year as a four-digit Number, expressed in universal time.
    - args - the month and day of the month.

    **Returns:**
    - the millisecond representation of the adjusted date.


---

### setUTCHours(Number, Number...)
- setUTCHours(hours: [Number](TopLevel.Number.md), args: [Number...](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Sets the hours field, expressed in universal time, of this Date instance. The minutes value should be a Number
      from 0 to 23. Optionally, seconds and milliseconds can also be provided.


    **Parameters:**
    - hours - the minutes field, expressed in universal time, of this Date instance.
    - args - the seconds and milliseconds value, expressed in universal time, for this Date instance.

    **Returns:**
    - the millisecond representation of the adjusted date.


---

### setUTCMilliseconds(Number)
- setUTCMilliseconds(millis: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Sets the milliseconds field, expressed in universal time, of this Date instance.

    **Parameters:**
    - millis - the milliseconds field, expressed in universal time, of this Date instance.

    **Returns:**
    - the millisecond representation of the adjusted date.


---

### setUTCMinutes(Number, Number...)
- setUTCMinutes(minutes: [Number](TopLevel.Number.md), args: [Number...](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Sets the minutes field, expressed in universal time, of this Date instance. The minutes value should be a Number
      from 0 to 59. Optionally, seconds and milliseconds can also be provided.


    **Parameters:**
    - minutes - the minutes field, expressed in universal time, of this Date instance.
    - args - the seconds and milliseconds values, expressed in universal time, for this Date instance.

    **Returns:**
    - the millisecond representation of the adjusted date.


---

### setUTCMonth(Number, Number...)
- setUTCMonth(month: [Number](TopLevel.Number.md), date: [Number...](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Sets the month of the year, expressed in universal time, where the value is a Number from 0 to 11. Optionally,
      you can set the day of the month.


    **Parameters:**
    - month - the month of the year, expressed in universal time.
    - date - the day of the month.

    **Returns:**
    - the millisecond representation of the adjusted date.


---

### setUTCSeconds(Number, Number...)
- setUTCSeconds(seconds: [Number](TopLevel.Number.md), millis: [Number...](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Sets the seconds field, expressed in universal time, of this Date instance. The seconds value should be a Number
      from 0 to 59. Optionally, milliseconds can also be provided.


    **Parameters:**
    - seconds - the seconds field, expressed in universal time, of this Date instance.
    - millis - the milliseconds field, expressed in universal time, of this Date instance.

    **Returns:**
    - the millisecond representation of the adjusted date.


---

### toDateString()
- toDateString(): [String](TopLevel.String.md)
  - : Returns the Date as a String value where the value represents the _date_ portion of the Date in the default
      locale (en\_US). To format a calendar object in an alternate format use the
      `dw.util.StringUtils.formatCalendar()` functions instead.


    **Returns:**
    - the Date as a String value.


---

### toISOString()
- toISOString(): [String](TopLevel.String.md)
  - : This function returns a string value represent the instance in time represented by this Date object. The date is
      formatted with the Simplified ISO 8601 format as follows: YYYY-MM-DDTHH:mm:ss.sssTZ. The time zone is always UTC,
      denoted by the suffix Z.


    **Returns:**
    - string representation of this date


---

### toJSON(String)
- toJSON(key: [String](TopLevel.String.md)): [Object](TopLevel.Object.md)
  - : This function returns the same string as Date.prototype.toISOString(). The method is called when a Date object is
      stringified.


    **Parameters:**
    - key - the name of the key, which is stringified

    **Returns:**
    - JSON string representation of this date


---

### toLocaleDateString()
- toLocaleDateString(): [String](TopLevel.String.md)
  - : Returns the Date as a String value where the value represents the _date_ portion of the Date in the default
      locale (en\_US). To format a calendar object in an alternate format use the
      `dw.util.StringUtils.formatCalendar()` functions instead.


    **Returns:**
    - returns the _date_ portion of the Date as a String.


---

### toLocaleString()
- toLocaleString(): [String](TopLevel.String.md)
  - : Returns the Date as a String using the default locale (en\_US). To format a calendar object in an alternate format
      use the `dw.util.StringUtils.formatCalendar()` functions instead.


    **Returns:**
    - the Date as a String using the default locale en\_US


---

### toLocaleTimeString()
- toLocaleTimeString(): [String](TopLevel.String.md)
  - : Returns the Date as a String value where the value represents the _time_ portion of the Date in the default
      locale (en\_US). To format a calendar object in an alternate format use the
      `dw.util.StringUtils.formatCalendar()` functions instead.


    **Returns:**
    - returns the _time_ time's portion of the Date as a String.


---

### toTimeString()
- toTimeString(): [String](TopLevel.String.md)
  - : Returns the Date as a String value where the value represents the _time_ portion of the Date in the default
      locale (en\_US). To format a calendar object in an alternate format use the
      `dw.util.StringUtils.formatCalendar()` functions instead.


    **Returns:**
    - the Date's time.


---

### toUTCString()
- toUTCString(): [String](TopLevel.String.md)
  - : Returns a String representation of this Date, expressed in universal time.

    **Returns:**
    - a String representation of this Date, expressed in universal time.


---

### valueOf()
- valueOf(): [Object](TopLevel.Object.md)
  - : Returns the value of this Date represented in milliseconds.

    **Returns:**
    - the value of this Date represented in milliseconds.


---

<!-- prettier-ignore-end -->
