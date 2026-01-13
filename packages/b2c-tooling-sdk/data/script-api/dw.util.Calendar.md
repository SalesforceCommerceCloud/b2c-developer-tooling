<!-- prettier-ignore-start -->
# Class Calendar

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Calendar](dw.util.Calendar.md)

Represents a Calendar and is based on the java.util.Calendar
class. Refer to the java.util.Calendar documentation for
more information.


**IMPORTANT NOTE:** Please use the [StringUtils.formatCalendar(Calendar)](dw.util.StringUtils.md#formatcalendarcalendar)
functions to convert a Calendar object into a String.



## Constant Summary

| Constant | Description |
| --- | --- |
| [AM_PM](#am_pm): [Number](TopLevel.Number.md) = 9 | Indicates whether the HOUR is before or after noon. |
| [APRIL](#april): [Number](TopLevel.Number.md) = 3 | Value for the month of year field representing April. |
| [AUGUST](#august): [Number](TopLevel.Number.md) = 7 | Value for the month of year field representing August. |
| [DATE](#date): [Number](TopLevel.Number.md) = 5 | Represents a date. |
| [DAY_OF_MONTH](#day_of_month): [Number](TopLevel.Number.md) = 5 | Represents a day of the month. |
| [DAY_OF_WEEK](#day_of_week): [Number](TopLevel.Number.md) = 7 | Represents a day of the week. |
| [DAY_OF_WEEK_IN_MONTH](#day_of_week_in_month): [Number](TopLevel.Number.md) = 8 | Represents a day of the week in a month. |
| [DAY_OF_YEAR](#day_of_year): [Number](TopLevel.Number.md) = 6 | Represents a day of the year. |
| [DECEMBER](#december): [Number](TopLevel.Number.md) = 11 | Value for the month of year field representing December. |
| [DST_OFFSET](#dst_offset): [Number](TopLevel.Number.md) = 16 | Indicates the daylight savings offset in milliseconds. |
| [ERA](#era): [Number](TopLevel.Number.md) = 0 | Indicates the era such as 'AD' or 'BC' in the Julian calendar. |
| [FEBRUARY](#february): [Number](TopLevel.Number.md) = 1 | Value for the month of year field representing February. |
| [FRIDAY](#friday): [Number](TopLevel.Number.md) = 6 | Value for the day of the week field representing Friday. |
| [HOUR](#hour): [Number](TopLevel.Number.md) = 10 | Represents an hour. |
| [HOUR_OF_DAY](#hour_of_day): [Number](TopLevel.Number.md) = 11 | Represents an hour of the day. |
| [INPUT_DATE_PATTERN](#input_date_pattern): [Number](TopLevel.Number.md) = 3 | The input date pattern, for instance MM/dd/yyyy |
| [INPUT_DATE_TIME_PATTERN](#input_date_time_pattern): [Number](TopLevel.Number.md) = 5 | The input date time pattern, for instance MM/dd/yyyy h:mm a |
| [INPUT_TIME_PATTERN](#input_time_pattern): [Number](TopLevel.Number.md) = 4 | The input time pattern, for instance h:mm a |
| [JANUARY](#january): [Number](TopLevel.Number.md) = 0 | Value for the month of year field representing January. |
| [JULY](#july): [Number](TopLevel.Number.md) = 6 | Value for the month of year field representing July. |
| [JUNE](#june): [Number](TopLevel.Number.md) = 5 | Value for the month of year field representing June. |
| [LONG_DATE_PATTERN](#long_date_pattern): [Number](TopLevel.Number.md) = 1 | The long date pattern, for instance MMM/d/yyyy |
| [MARCH](#march): [Number](TopLevel.Number.md) = 2 | Value for the month of year field representing March. |
| [MAY](#may): [Number](TopLevel.Number.md) = 4 | Value for the month of year field representing May. |
| [MILLISECOND](#millisecond): [Number](TopLevel.Number.md) = 14 | Represents a millisecond. |
| [MINUTE](#minute): [Number](TopLevel.Number.md) = 12 | Represents a minute. |
| [MONDAY](#monday): [Number](TopLevel.Number.md) = 2 | Value for the day of the week field representing Monday. |
| [MONTH](#month): [Number](TopLevel.Number.md) = 2 | Represents a month where the first month of the year is 0. |
| [NOVEMBER](#november): [Number](TopLevel.Number.md) = 10 | Value for the month of year field representing November. |
| [OCTOBER](#october): [Number](TopLevel.Number.md) = 9 | Value for the month of year field representing October. |
| [SATURDAY](#saturday): [Number](TopLevel.Number.md) = 7 | Value for the day of the week field representing Saturday. |
| [SECOND](#second): [Number](TopLevel.Number.md) = 13 | Represents a second. |
| [SEPTEMBER](#september): [Number](TopLevel.Number.md) = 8 | Value for the month of year field representing September. |
| [SHORT_DATE_PATTERN](#short_date_pattern): [Number](TopLevel.Number.md) = 0 | The short date pattern, for instance M/d/yy |
| [SUNDAY](#sunday): [Number](TopLevel.Number.md) = 1 | Value for the day of the week field representing Sunday. |
| [THURSDAY](#thursday): [Number](TopLevel.Number.md) = 5 | Value for the day of the week field representing Thursday. |
| [TIME_PATTERN](#time_pattern): [Number](TopLevel.Number.md) = 2 | The time pattern, for instance h:mm:ss a |
| [TUESDAY](#tuesday): [Number](TopLevel.Number.md) = 3 | Value for the day of the week field representing Tuesday. |
| [WEDNESDAY](#wednesday): [Number](TopLevel.Number.md) = 4 | Value for the day of the week field representing Wednesday. |
| [WEEK_OF_MONTH](#week_of_month): [Number](TopLevel.Number.md) = 4 | Represents a week of the month. |
| [WEEK_OF_YEAR](#week_of_year): [Number](TopLevel.Number.md) = 3 | Represents a week in the year. |
| [YEAR](#year): [Number](TopLevel.Number.md) = 1 | Represents a year. |
| [ZONE_OFFSET](#zone_offset): [Number](TopLevel.Number.md) = 15 | Indicates the raw offset from GMT in milliseconds. |

## Property Summary

| Property | Description |
| --- | --- |
| [firstDayOfWeek](#firstdayofweek): [Number](TopLevel.Number.md) | Returns the first day of the week base on locale context. |
| [time](#time): [Date](TopLevel.Date.md) | Returns the current time stamp of this calendar. |
| [timeZone](#timezone): [String](TopLevel.String.md) | Returns the current time zone of this calendar. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Calendar](#calendar)() | Creates a new Calendar object that is set to the current  time. |
| [Calendar](#calendardate)([Date](TopLevel.Date.md)) | Creates a new Calendar object for the given Date object. |

## Method Summary

| Method | Description |
| --- | --- |
| [add](dw.util.Calendar.md#addnumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Adds or subtracts the specified amount of time to the given  calendar field, based on the calendar's rules. |
| [after](dw.util.Calendar.md#afterobject)([Object](TopLevel.Object.md)) | Indicates if this Calendar represents a time after  the time represented by the specified Object. |
| [before](dw.util.Calendar.md#beforeobject)([Object](TopLevel.Object.md)) | Indicates if this Calendar represents a time before  the time represented by the specified Object. |
| [clear](dw.util.Calendar.md#clear)() | Sets all the calendar field values and the time value  (millisecond offset from the Epoch) of this Calendar undefined. |
| [clear](dw.util.Calendar.md#clearnumber)([Number](TopLevel.Number.md)) | Sets the given calendar field value and the time value  (millisecond offset from the Epoch) of this Calendar undefined. |
| [compareTo](dw.util.Calendar.md#comparetocalendar)([Calendar](dw.util.Calendar.md)) | Compares the time values (millisecond offsets from the Epoch)  represented by two Calendar objects. |
| [equals](dw.util.Calendar.md#equalsobject)([Object](TopLevel.Object.md)) | Compares two calendar values whether they are equivalent. |
| [get](dw.util.Calendar.md#getnumber)([Number](TopLevel.Number.md)) | Returns the value of the given calendar field. |
| [getActualMaximum](dw.util.Calendar.md#getactualmaximumnumber)([Number](TopLevel.Number.md)) | Returns the maximum value that the specified calendar  field could have. |
| [getActualMinimum](dw.util.Calendar.md#getactualminimumnumber)([Number](TopLevel.Number.md)) | Returns the minimum value that the specified calendar  field could have. |
| [getFirstDayOfWeek](dw.util.Calendar.md#getfirstdayofweek)() | Returns the first day of the week base on locale context. |
| [getMaximum](dw.util.Calendar.md#getmaximumnumber)([Number](TopLevel.Number.md)) | Returns the maximum value for the given calendar  field. |
| [getMinimum](dw.util.Calendar.md#getminimumnumber)([Number](TopLevel.Number.md)) | Returns the minimum value for the given calendar  field. |
| [getTime](dw.util.Calendar.md#gettime)() | Returns the current time stamp of this calendar. |
| [getTimeZone](dw.util.Calendar.md#gettimezone)() | Returns the current time zone of this calendar. |
| [hashCode](dw.util.Calendar.md#hashcode)() | Calculates the hash code for a calendar; |
| [isLeapYear](dw.util.Calendar.md#isleapyearnumber)([Number](TopLevel.Number.md)) | Indicates if the specified year is a leap year. |
| [isSameDay](dw.util.Calendar.md#issamedaycalendar)([Calendar](dw.util.Calendar.md)) | Checks, whether two calendar dates fall on the same day. |
| [isSameDayByTimestamp](dw.util.Calendar.md#issamedaybytimestampcalendar)([Calendar](dw.util.Calendar.md)) | Checks, whether two calendar dates fall on the same day. |
| [isSet](dw.util.Calendar.md#issetnumber)([Number](TopLevel.Number.md)) | Indicates if the field is set. |
| [parseByFormat](dw.util.Calendar.md#parsebyformatstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Parses the string according to the date and time format pattern and set  the time at this calendar object. |
| [parseByLocale](dw.util.Calendar.md#parsebylocalestring-string-number)([String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Parses the string according the date format pattern of the given locale. |
| [roll](dw.util.Calendar.md#rollnumber-boolean)([Number](TopLevel.Number.md), [Boolean](TopLevel.Boolean.md)) | Rolls the specified field up or down one value. |
| [roll](dw.util.Calendar.md#rollnumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Rolls the specified field using the specified value. |
| [set](dw.util.Calendar.md#setnumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Sets the given calendar field to the given value. |
| [set](dw.util.Calendar.md#setnumber-number-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Sets the values for the calendar fields YEAR, MONTH, and DAY\_OF\_MONTH. |
| [set](dw.util.Calendar.md#setnumber-number-number-number-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Sets the values for the calendar fields YEAR, MONTH,  DAY\_OF\_MONTH, HOUR\_OF\_DAY, and MINUTE. |
| [set](dw.util.Calendar.md#setnumber-number-number-number-number-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Sets the values for the calendar fields YEAR, MONTH,  DAY\_OF\_MONTH, HOUR\_OF\_DAY, MINUTE and SECOND. |
| [setFirstDayOfWeek](dw.util.Calendar.md#setfirstdayofweeknumber)([Number](TopLevel.Number.md)) | Sets what the first day of the week is. |
| [setTime](dw.util.Calendar.md#settimedate)([Date](TopLevel.Date.md)) | Sets the current time stamp of this calendar.<br/>  <br/>  **WARNING:** Keep in mind that the set Date object's time is always           interpreted in the time zone GMT. |
| [setTimeZone](dw.util.Calendar.md#settimezonestring)([String](TopLevel.String.md)) | Sets the current time zone of this calendar.<br/>  <br/>  **WARNING:** Keep in mind that the time stamp represented by the calendar is           always interpreted in the time zone GMT. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### AM_PM

- AM_PM: [Number](TopLevel.Number.md) = 9
  - : Indicates whether the HOUR is before or after noon.


---

### APRIL

- APRIL: [Number](TopLevel.Number.md) = 3
  - : Value for the month of year field representing April.


---

### AUGUST

- AUGUST: [Number](TopLevel.Number.md) = 7
  - : Value for the month of year field representing August.


---

### DATE

- DATE: [Number](TopLevel.Number.md) = 5
  - : Represents a date.


---

### DAY_OF_MONTH

- DAY_OF_MONTH: [Number](TopLevel.Number.md) = 5
  - : Represents a day of the month.


---

### DAY_OF_WEEK

- DAY_OF_WEEK: [Number](TopLevel.Number.md) = 7
  - : Represents a day of the week.


---

### DAY_OF_WEEK_IN_MONTH

- DAY_OF_WEEK_IN_MONTH: [Number](TopLevel.Number.md) = 8
  - : Represents a day of the week in a month.


---

### DAY_OF_YEAR

- DAY_OF_YEAR: [Number](TopLevel.Number.md) = 6
  - : Represents a day of the year.


---

### DECEMBER

- DECEMBER: [Number](TopLevel.Number.md) = 11
  - : Value for the month of year field representing December.


---

### DST_OFFSET

- DST_OFFSET: [Number](TopLevel.Number.md) = 16
  - : Indicates the daylight savings offset in milliseconds.


---

### ERA

- ERA: [Number](TopLevel.Number.md) = 0
  - : Indicates the era such as 'AD' or 'BC' in the Julian calendar.


---

### FEBRUARY

- FEBRUARY: [Number](TopLevel.Number.md) = 1
  - : Value for the month of year field representing February.


---

### FRIDAY

- FRIDAY: [Number](TopLevel.Number.md) = 6
  - : Value for the day of the week field representing Friday.


---

### HOUR

- HOUR: [Number](TopLevel.Number.md) = 10
  - : Represents an hour.


---

### HOUR_OF_DAY

- HOUR_OF_DAY: [Number](TopLevel.Number.md) = 11
  - : Represents an hour of the day.


---

### INPUT_DATE_PATTERN

- INPUT_DATE_PATTERN: [Number](TopLevel.Number.md) = 3
  - : The input date pattern, for instance MM/dd/yyyy


---

### INPUT_DATE_TIME_PATTERN

- INPUT_DATE_TIME_PATTERN: [Number](TopLevel.Number.md) = 5
  - : The input date time pattern, for instance MM/dd/yyyy h:mm a


---

### INPUT_TIME_PATTERN

- INPUT_TIME_PATTERN: [Number](TopLevel.Number.md) = 4
  - : The input time pattern, for instance h:mm a


---

### JANUARY

- JANUARY: [Number](TopLevel.Number.md) = 0
  - : Value for the month of year field representing January.


---

### JULY

- JULY: [Number](TopLevel.Number.md) = 6
  - : Value for the month of year field representing July.


---

### JUNE

- JUNE: [Number](TopLevel.Number.md) = 5
  - : Value for the month of year field representing June.


---

### LONG_DATE_PATTERN

- LONG_DATE_PATTERN: [Number](TopLevel.Number.md) = 1
  - : The long date pattern, for instance MMM/d/yyyy


---

### MARCH

- MARCH: [Number](TopLevel.Number.md) = 2
  - : Value for the month of year field representing March.


---

### MAY

- MAY: [Number](TopLevel.Number.md) = 4
  - : Value for the month of year field representing May.


---

### MILLISECOND

- MILLISECOND: [Number](TopLevel.Number.md) = 14
  - : Represents a millisecond.


---

### MINUTE

- MINUTE: [Number](TopLevel.Number.md) = 12
  - : Represents a minute.


---

### MONDAY

- MONDAY: [Number](TopLevel.Number.md) = 2
  - : Value for the day of the week field representing Monday.


---

### MONTH

- MONTH: [Number](TopLevel.Number.md) = 2
  - : Represents a month where the first month of the year is 0.


---

### NOVEMBER

- NOVEMBER: [Number](TopLevel.Number.md) = 10
  - : Value for the month of year field representing November.


---

### OCTOBER

- OCTOBER: [Number](TopLevel.Number.md) = 9
  - : Value for the month of year field representing October.


---

### SATURDAY

- SATURDAY: [Number](TopLevel.Number.md) = 7
  - : Value for the day of the week field representing Saturday.


---

### SECOND

- SECOND: [Number](TopLevel.Number.md) = 13
  - : Represents a second.


---

### SEPTEMBER

- SEPTEMBER: [Number](TopLevel.Number.md) = 8
  - : Value for the month of year field representing September.


---

### SHORT_DATE_PATTERN

- SHORT_DATE_PATTERN: [Number](TopLevel.Number.md) = 0
  - : The short date pattern, for instance M/d/yy


---

### SUNDAY

- SUNDAY: [Number](TopLevel.Number.md) = 1
  - : Value for the day of the week field representing Sunday.


---

### THURSDAY

- THURSDAY: [Number](TopLevel.Number.md) = 5
  - : Value for the day of the week field representing Thursday.


---

### TIME_PATTERN

- TIME_PATTERN: [Number](TopLevel.Number.md) = 2
  - : The time pattern, for instance h:mm:ss a


---

### TUESDAY

- TUESDAY: [Number](TopLevel.Number.md) = 3
  - : Value for the day of the week field representing Tuesday.


---

### WEDNESDAY

- WEDNESDAY: [Number](TopLevel.Number.md) = 4
  - : Value for the day of the week field representing Wednesday.


---

### WEEK_OF_MONTH

- WEEK_OF_MONTH: [Number](TopLevel.Number.md) = 4
  - : Represents a week of the month.


---

### WEEK_OF_YEAR

- WEEK_OF_YEAR: [Number](TopLevel.Number.md) = 3
  - : Represents a week in the year.


---

### YEAR

- YEAR: [Number](TopLevel.Number.md) = 1
  - : Represents a year.


---

### ZONE_OFFSET

- ZONE_OFFSET: [Number](TopLevel.Number.md) = 15
  - : Indicates the raw offset from GMT in milliseconds.


---

## Property Details

### firstDayOfWeek
- firstDayOfWeek: [Number](TopLevel.Number.md)
  - : Returns the first day of the week base on locale context. For example, in the US
      the first day of the week is SUNDAY. However, in France the
      first day of the week is MONDAY.



---

### time
- time: [Date](TopLevel.Date.md)
  - : Returns the current time stamp of this calendar. This method
      is also used to convert a Calendar into a Date.
      
      
      
      **WARNING:** Keep in mind that the returned Date object's time is always
               interpreted in the time zone GMT. This means time zone information
               set at the calendar object will not be honored and gets lost.



---

### timeZone
- timeZone: [String](TopLevel.String.md)
  - : Returns the current time zone of this calendar.


---

## Constructor Details

### Calendar()
- Calendar()
  - : Creates a new Calendar object that is set to the current
      time. The default time zone of the Calendar object is GMT.
      
      
      
      **WARNING:** Keep in mind that the time stamp represented by the new calendar
               is always interpreted in the time zone GMT. This means time zone
               information at the calendar object needs to be set separately by
               using the [setTimeZone(String)](dw.util.Calendar.md#settimezonestring) method.



---

### Calendar(Date)
- Calendar(date: [Date](TopLevel.Date.md))
  - : Creates a new Calendar object for the given Date object. The time is set to
      the given Date object's time. The default time zone of the Calendar object is GMT.
      
      
      
      **WARNING:** Keep in mind that the given Date object is always
               interpreted in the time zone GMT. This means time zone
               information at the calendar object needs to be set separately by
               using the [setTimeZone(String)](dw.util.Calendar.md#settimezonestring) method.


    **Parameters:**
    - date - the date for which the calendar will be set.


---

## Method Details

### add(Number, Number)
- add(field: [Number](TopLevel.Number.md), value: [Number](TopLevel.Number.md)): void
  - : Adds or subtracts the specified amount of time to the given
      calendar field, based on the calendar's rules.


    **Parameters:**
    - field - the calendar field.
    - value - the amount of date or time to be added to the field


---

### after(Object)
- after(obj: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Indicates if this Calendar represents a time after
      the time represented by the specified Object.


    **Parameters:**
    - obj - the object to test.

    **Returns:**
    - true if this Calendar represents a time after
      the time represented by the specified Object, false otherwise.



---

### before(Object)
- before(obj: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Indicates if this Calendar represents a time before
      the time represented by the specified Object.


    **Parameters:**
    - obj - the object to test.

    **Returns:**
    - true if this Calendar represents a time before
      the time represented by the specified Object, false otherwise.



---

### clear()
- clear(): void
  - : Sets all the calendar field values and the time value
      (millisecond offset from the Epoch) of this Calendar undefined.



---

### clear(Number)
- clear(field: [Number](TopLevel.Number.md)): void
  - : Sets the given calendar field value and the time value
      (millisecond offset from the Epoch) of this Calendar undefined.


    **Parameters:**
    - field - the calendar field to be cleared.


---

### compareTo(Calendar)
- compareTo(anotherCalendar: [Calendar](dw.util.Calendar.md)): [Number](TopLevel.Number.md)
  - : Compares the time values (millisecond offsets from the Epoch)
      represented by two Calendar objects.


    **Parameters:**
    - anotherCalendar - the Calendar to be compared.

    **Returns:**
    - the value 0 if the time represented by the argument is equal
      to the time represented by this Calendar; a value less than 0 if
      the time of this Calendar is before the time represented by the
      argument; and a value greater than 0 if the time of this Calendar
      is after the time represented by the argument.



---

### equals(Object)
- equals(other: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Compares two calendar values whether they are equivalent.

    **Parameters:**
    - other - the object to compare against this calendar.


---

### get(Number)
- get(field: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the value of the given calendar field.

    **Parameters:**
    - field - the calendar field to retrieve.

    **Returns:**
    - the value for the given calendar field.


---

### getActualMaximum(Number)
- getActualMaximum(field: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the maximum value that the specified calendar
      field could have.


    **Parameters:**
    - field - the calendar field.

    **Returns:**
    - the maximum value that the specified calendar
      field could have.



---

### getActualMinimum(Number)
- getActualMinimum(field: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the minimum value that the specified calendar
      field could have.


    **Parameters:**
    - field - the calendar field.

    **Returns:**
    - the minimum value that the specified calendar
      field could have.



---

### getFirstDayOfWeek()
- getFirstDayOfWeek(): [Number](TopLevel.Number.md)
  - : Returns the first day of the week base on locale context. For example, in the US
      the first day of the week is SUNDAY. However, in France the
      first day of the week is MONDAY.


    **Returns:**
    - the first day of the week base on locale context. For example, in the US
      the first day of the week is SUNDAY. However, in France the
      first day of the week is MONDAY.



---

### getMaximum(Number)
- getMaximum(field: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the maximum value for the given calendar
      field.


    **Parameters:**
    - field - the calendar field.

    **Returns:**
    - the maximum value for the given calendar
      field.



---

### getMinimum(Number)
- getMinimum(field: [Number](TopLevel.Number.md)): [Number](TopLevel.Number.md)
  - : Returns the minimum value for the given calendar
      field.


    **Parameters:**
    - field - the calendar field.

    **Returns:**
    - the minimum value for the given calendar
      field.



---

### getTime()
- getTime(): [Date](TopLevel.Date.md)
  - : Returns the current time stamp of this calendar. This method
      is also used to convert a Calendar into a Date.
      
      
      
      **WARNING:** Keep in mind that the returned Date object's time is always
               interpreted in the time zone GMT. This means time zone information
               set at the calendar object will not be honored and gets lost.


    **Returns:**
    - the current time stamp of this calendar as a Date.


---

### getTimeZone()
- getTimeZone(): [String](TopLevel.String.md)
  - : Returns the current time zone of this calendar.

    **Returns:**
    - the current time zone of this calendar.


---

### hashCode()
- hashCode(): [Number](TopLevel.Number.md)
  - : Calculates the hash code for a calendar;


---

### isLeapYear(Number)
- isLeapYear(year: [Number](TopLevel.Number.md)): [Boolean](TopLevel.Boolean.md)
  - : Indicates if the specified year is a leap year.

    **Parameters:**
    - year - the year to test.

    **Returns:**
    - true if the specified year is a leap year.


---

### isSameDay(Calendar)
- isSameDay(other: [Calendar](dw.util.Calendar.md)): [Boolean](TopLevel.Boolean.md)
  - : Checks, whether two calendar dates fall on the same day.
      
      
      The method performs comparison based on both calendar's
      field values by honoring the defined time zones.
      
      
      
      
      Examples:
      
      
      
      ```
      new Calendar( new Date( "2002/02/28 13:45" ).isSameDay( new Calendar( new Date( "2002/02/28 06:01" ) ) );
      ```
      
      would return true.
      
      ```
      new Calendar( new Date( "2002/02/28 13:45" ).isSameDay( new Calendar( new Date( "2002/02/12 13:45" ) ) );
      ```
      
      would return false.
      
      ```
      new Calendar( new Date( "2002/02/28 13:45" ).isSameDay( new Calendar( new Date( "1970/02/28 13:45" ) ) );
      ```
      
      would return false.
      
      ```
      var cal1 = new Calendar( new Date( "2002/02/28 02:00" );
      cal1.setTimeZone( "Etc/GMT+1" );
      var cal2 = new Calendar( new Date( "2002/02/28 00:00" );
      cal2.setTimeZone( "Etc/GMT+1" );
      cal1.isSameDay( cal2 );
      ```
      
      would return false since the time zone is applied first which results in comparing `2002/02/28 01:00` for `cal1`
      with `2002/02/27 23:00` for `cal2`.


    **Parameters:**
    - other - the calendar to compare against this calendar.


---

### isSameDayByTimestamp(Calendar)
- isSameDayByTimestamp(other: [Calendar](dw.util.Calendar.md)): [Boolean](TopLevel.Boolean.md)
  - : Checks, whether two calendar dates fall on the same day.
      
      
      The method performs comparison based on both calendar's
      time stamps by ignoring any defined time zones.
      
      
      
      
      Examples:
      
      
      
      ```
      new Calendar( new Date( "2002/02/28 13:45" ).isSameDayByTimestamp( new Calendar( new Date( "2002/02/28 06:01" ) ) );
      ```
      
      would return true.
      
      ```
      new Calendar( new Date( "2002/02/28 13:45" ).isSameDayByTimestamp( new Calendar( new Date( "2002/02/12 13:45" ) ) );
      ```
      
      would return false.
      
      ```
      new Calendar( new Date( "2002/02/28 13:45" ).isSameDayByTimestamp( new Calendar( new Date( "1970/02/28 13:45" ) ) );
      ```
      
      would return false.
      
      ```
      var cal1 = new Calendar( new Date( "2002/02/28 02:00" );
      cal1.setTimeZone( "Etc/GMT+1" );
      var cal2 = new Calendar( new Date( "2002/02/28 00:00" );
      cal2.setTimeZone( "Etc/GMT+1" );
      cal1.isSameDayByTimestamp( cal2 );
      ```
      
      would return true since the time zone is not applied first which results in comparing `2002/02/28 02:00` for `cal1`
      with `2002/02/28 00:00` for `cal2`.


    **Parameters:**
    - other - the calendar to compare against this calendar.


---

### isSet(Number)
- isSet(field: [Number](TopLevel.Number.md)): [Boolean](TopLevel.Boolean.md)
  - : Indicates if the field is set.

    **Parameters:**
    - field - the field to test.

    **Returns:**
    - true if the field is set, false otherwise.


---

### parseByFormat(String, String)
- parseByFormat(timeString: [String](TopLevel.String.md), format: [String](TopLevel.String.md)): void
  - : Parses the string according to the date and time format pattern and set
      the time at this calendar object. For the specification of the date and
      time format pattern see the javadoc of the JDK class java.text.SimpleDateFormat.
      If a time zone is included in the format string,
      this time zone is used to interpet the time. Otherwise the currently set
      calendar time zone is used to parse the given time string.


    **Parameters:**
    - timeString - the time string to parsed
    - format - the time format string


---

### parseByLocale(String, String, Number)
- parseByLocale(timeString: [String](TopLevel.String.md), locale: [String](TopLevel.String.md), pattern: [Number](TopLevel.Number.md)): void
  - : Parses the string according the date format pattern of the given locale.
      If the locale name is invalid, an exception is thrown. The currently set
      calendar time zone is used to parse the given time string.


    **Parameters:**
    - timeString - the time string to parsed
    - locale - the locale id, which defines the date format pattern
    - pattern - the pattern is one of calendar pattern e.g. SHORT\_DATE\_PATTERN                 as defined in the regional settings for the locale


---

### roll(Number, Boolean)
- roll(field: [Number](TopLevel.Number.md), up: [Boolean](TopLevel.Boolean.md)): void
  - : Rolls the specified field up or down one value.

    **Parameters:**
    - field - the field to roll.
    - up - if true rolls the field up, if false  rolls the field down.


---

### roll(Number, Number)
- roll(field: [Number](TopLevel.Number.md), amount: [Number](TopLevel.Number.md)): void
  - : Rolls the specified field using the specified value.

    **Parameters:**
    - field - the field to roll.
    - amount - the amount to roll the field.


---

### set(Number, Number)
- set(field: [Number](TopLevel.Number.md), value: [Number](TopLevel.Number.md)): void
  - : Sets the given calendar field to the given value.

    **Parameters:**
    - field - the calendar field to set.
    - value - the value to set in the field.


---

### set(Number, Number, Number)
- set(year: [Number](TopLevel.Number.md), month: [Number](TopLevel.Number.md), date: [Number](TopLevel.Number.md)): void
  - : Sets the values for the calendar fields YEAR, MONTH, and DAY\_OF\_MONTH.

    **Parameters:**
    - year - the value for year.
    - month - the value for month.
    - date - the value for date.


---

### set(Number, Number, Number, Number, Number)
- set(year: [Number](TopLevel.Number.md), month: [Number](TopLevel.Number.md), date: [Number](TopLevel.Number.md), hourOfDay: [Number](TopLevel.Number.md), minute: [Number](TopLevel.Number.md)): void
  - : Sets the values for the calendar fields YEAR, MONTH,
      DAY\_OF\_MONTH, HOUR\_OF\_DAY, and MINUTE.


    **Parameters:**
    - year - the value for year.
    - month - the value for month.
    - date - the value for date.
    - hourOfDay - the value for hour of day.
    - minute - the value for minute.


---

### set(Number, Number, Number, Number, Number, Number)
- set(year: [Number](TopLevel.Number.md), month: [Number](TopLevel.Number.md), date: [Number](TopLevel.Number.md), hourOfDay: [Number](TopLevel.Number.md), minute: [Number](TopLevel.Number.md), second: [Number](TopLevel.Number.md)): void
  - : Sets the values for the calendar fields YEAR, MONTH,
      DAY\_OF\_MONTH, HOUR\_OF\_DAY, MINUTE and SECOND.


    **Parameters:**
    - year - the value for year.
    - month - the value for month.
    - date - the value for date.
    - hourOfDay - the value for hour of day.
    - minute - the value for minute.
    - second - the value for second.


---

### setFirstDayOfWeek(Number)
- setFirstDayOfWeek(value: [Number](TopLevel.Number.md)): void
  - : Sets what the first day of the week is.

    **Parameters:**
    - value - the day to set as the first day of the week.


---

### setTime(Date)
- setTime(date: [Date](TopLevel.Date.md)): void
  - : Sets the current time stamp of this calendar.
      
      
      
      **WARNING:** Keep in mind that the set Date object's time is always
               interpreted in the time zone GMT. This means that time zone
               information at the calendar object needs to be set separately by
               using the [setTimeZone(String)](dw.util.Calendar.md#settimezonestring) method.


    **Parameters:**
    - date - the current time stamp of this calendar.


---

### setTimeZone(String)
- setTimeZone(timeZone: [String](TopLevel.String.md)): void
  - : Sets the current time zone of this calendar.
      
      
      
      **WARNING:** Keep in mind that the time stamp represented by the calendar is
               always interpreted in the time zone GMT. Changing the time zone will not
               change the calendar's time stamp.


    **Parameters:**
    - timeZone - the current time zone value to set.


---

<!-- prettier-ignore-end -->
