/**
 * Represents a Calendar and is based on the java.util.Calendar
 * class. Refer to the java.util.Calendar documentation for
 * more information.
 * 
 * IMPORTANT NOTE: Please use the dw.util.StringUtils.formatCalendar
 * functions to convert a Calendar object into a String.
 */
declare class Calendar {
    /**
     * Indicates whether the HOUR is before or after noon.
     */
    static readonly AM_PM = 9;
    /**
     * Value for the month of year field representing April.
     */
    static readonly APRIL = 3;
    /**
     * Value for the month of year field representing August.
     */
    static readonly AUGUST = 7;
    /**
     * Represents a date.
     */
    static readonly DATE = 5;
    /**
     * Represents a day of the month.
     */
    static readonly DAY_OF_MONTH = 5;
    /**
     * Represents a day of the week.
     */
    static readonly DAY_OF_WEEK = 7;
    /**
     * Represents a day of the week in a month.
     */
    static readonly DAY_OF_WEEK_IN_MONTH = 8;
    /**
     * Represents a day of the year.
     */
    static readonly DAY_OF_YEAR = 6;
    /**
     * Value for the month of year field representing December.
     */
    static readonly DECEMBER = 11;
    /**
     * Indicates the daylight savings offset in milliseconds.
     */
    static readonly DST_OFFSET = 16;
    /**
     * Indicates the era such as 'AD' or 'BC' in the Julian calendar.
     */
    static readonly ERA = 0;
    /**
     * Value for the month of year field representing February.
     */
    static readonly FEBRUARY = 1;
    /**
     * Value for the day of the week field representing Friday.
     */
    static readonly FRIDAY = 6;
    /**
     * Represents an hour.
     */
    static readonly HOUR = 10;
    /**
     * Represents an hour of the day.
     */
    static readonly HOUR_OF_DAY = 11;
    /**
     * The input date pattern, for instance MM/dd/yyyy
     */
    static readonly INPUT_DATE_PATTERN = 3;
    /**
     * The input date time pattern, for instance MM/dd/yyyy h:mm a
     */
    static readonly INPUT_DATE_TIME_PATTERN = 5;
    /**
     * The input time pattern, for instance h:mm a
     */
    static readonly INPUT_TIME_PATTERN = 4;
    /**
     * Value for the month of year field representing January.
     */
    static readonly JANUARY = 0;
    /**
     * Value for the month of year field representing July.
     */
    static readonly JULY = 6;
    /**
     * Value for the month of year field representing June.
     */
    static readonly JUNE = 5;
    /**
     * The long date pattern, for instance MMM/d/yyyy
     */
    static readonly LONG_DATE_PATTERN = 1;
    /**
     * Value for the month of year field representing March.
     */
    static readonly MARCH = 2;
    /**
     * Value for the month of year field representing May.
     */
    static readonly MAY = 4;
    /**
     * Represents a millisecond.
     */
    static readonly MILLISECOND = 14;
    /**
     * Represents a minute.
     */
    static readonly MINUTE = 12;
    /**
     * Value for the day of the week field representing Monday.
     */
    static readonly MONDAY = 2;
    /**
     * Represents a month where the first month of the year is 0.
     */
    static readonly MONTH = 2;
    /**
     * Value for the month of year field representing November.
     */
    static readonly NOVEMBER = 10;
    /**
     * Value for the month of year field representing October.
     */
    static readonly OCTOBER = 9;
    /**
     * Value for the day of the week field representing Saturday.
     */
    static readonly SATURDAY = 7;
    /**
     * Represents a second.
     */
    static readonly SECOND = 13;
    /**
     * Value for the month of year field representing September.
     */
    static readonly SEPTEMBER = 8;
    /**
     * The short date pattern, for instance M/d/yy
     */
    static readonly SHORT_DATE_PATTERN = 0;
    /**
     * Value for the day of the week field representing Sunday.
     */
    static readonly SUNDAY = 1;
    /**
     * Value for the day of the week field representing Thursday.
     */
    static readonly THURSDAY = 5;
    /**
     * The time pattern, for instance h:mm:ss a
     */
    static readonly TIME_PATTERN = 2;
    /**
     * Value for the day of the week field representing Tuesday.
     */
    static readonly TUESDAY = 3;
    /**
     * Value for the day of the week field representing Wednesday.
     */
    static readonly WEDNESDAY = 4;
    /**
     * Represents a week of the month.
     */
    static readonly WEEK_OF_MONTH = 4;
    /**
     * Represents a week in the year.
     */
    static readonly WEEK_OF_YEAR = 3;
    /**
     * Represents a year.
     */
    static readonly YEAR = 1;
    /**
     * Indicates the raw offset from GMT in milliseconds.
     */
    static readonly ZONE_OFFSET = 15;
    /**
     * Returns the first day of the week base on locale context. For example, in the US
     * the first day of the week is SUNDAY. However, in France the
     * first day of the week is MONDAY.
     */
    firstDayOfWeek: number;
    /**
     * Returns the current time stamp of this calendar. This method
     * is also used to convert a Calendar into a Date.
     * 
     * WARNING: Keep in mind that the returned Date object's time is always
     * interpreted in the time zone GMT. This means time zone information
     * set at the calendar object will not be honored and gets lost.
     */
    time: Date;
    /**
     * Returns the current time zone of this calendar.
     */
    timeZone: string;
    /**
     * Creates a new Calendar object that is set to the current
     * time. The default time zone of the Calendar object is GMT.
     * 
     * WARNING: Keep in mind that the time stamp represented by the new calendar
     * is always interpreted in the time zone GMT. This means time zone
     * information at the calendar object needs to be set separately by
     * using the setTimeZone method.
     */
    constructor();
    /**
     * Creates a new Calendar object for the given Date object. The time is set to
     * the given Date object's time. The default time zone of the Calendar object is GMT.
     * 
     * WARNING: Keep in mind that the given Date object is always
     * interpreted in the time zone GMT. This means time zone
     * information at the calendar object needs to be set separately by
     * using the setTimeZone method.
     */
    constructor(date: Date);
    /**
     * Adds or subtracts the specified amount of time to the given
     * calendar field, based on the calendar's rules.
     */
    add(field: number, value: number): void;
    /**
     * Indicates if this Calendar represents a time after
     * the time represented by the specified Object.
     */
    after(obj: any): boolean;
    /**
     * Indicates if this Calendar represents a time before
     * the time represented by the specified Object.
     */
    before(obj: any): boolean;
    /**
     * Sets all the calendar field values and the time value
     * (millisecond offset from the Epoch) of this Calendar undefined.
     */
    clear(): void;
    /**
     * Sets the given calendar field value and the time value
     * (millisecond offset from the Epoch) of this Calendar undefined.
     */
    clear(field: number): void;
    /**
     * Compares the time values (millisecond offsets from the Epoch)
     * represented by two Calendar objects.
     */
    compareTo(anotherCalendar: Calendar): number;
    /**
     * Compares two calendar values whether they are equivalent.
     */
    equals(other: any): boolean;
    /**
     * Returns the value of the given calendar field.
     */
    get(field: number): number;
    /**
     * Returns the maximum value that the specified calendar
     * field could have.
     */
    getActualMaximum(field: number): number;
    /**
     * Returns the minimum value that the specified calendar
     * field could have.
     */
    getActualMinimum(field: number): number;
    /**
     * Returns the first day of the week base on locale context. For example, in the US
     * the first day of the week is SUNDAY. However, in France the
     * first day of the week is MONDAY.
     */
    getFirstDayOfWeek(): number;
    /**
     * Returns the maximum value for the given calendar
     * field.
     */
    getMaximum(field: number): number;
    /**
     * Returns the minimum value for the given calendar
     * field.
     */
    getMinimum(field: number): number;
    /**
     * Returns the current time stamp of this calendar. This method
     * is also used to convert a Calendar into a Date.
     * 
     * WARNING: Keep in mind that the returned Date object's time is always
     * interpreted in the time zone GMT. This means time zone information
     * set at the calendar object will not be honored and gets lost.
     */
    getTime(): Date;
    /**
     * Returns the current time zone of this calendar.
     */
    getTimeZone(): string;
    /**
     * Calculates the hash code for a calendar;
     */
    hashCode(): number;
    /**
     * Indicates if the specified year is a leap year.
     */
    isLeapYear(year: number): boolean;
    /**
     * Checks, whether two calendar dates fall on the same day.
     * 
     * The method performs comparison based on both calendar's
     * field values by honoring the defined time zones.
     * 
     * Examples:
     * 
     * ```
     * new Calendar( new Date( "2002/02/28 13:45" ).isSameDay( new Calendar( new Date( "2002/02/28 06:01" ) ) );
     * ```
     * 
     * would return true.
     * 
     * ```
     * new Calendar( new Date( "2002/02/28 13:45" ).isSameDay( new Calendar( new Date( "2002/02/12 13:45" ) ) );
     * ```
     * 
     * would return false.
     * 
     * ```
     * new Calendar( new Date( "2002/02/28 13:45" ).isSameDay( new Calendar( new Date( "1970/02/28 13:45" ) ) );
     * ```
     * 
     * would return false.
     * 
     * ```
     * var cal1 = new Calendar( new Date( "2002/02/28 02:00" );
     * cal1.setTimeZone( "Etc/GMT+1" );
     * var cal2 = new Calendar( new Date( "2002/02/28 00:00" );
     * cal2.setTimeZone( "Etc/GMT+1" );
     * cal1.isSameDay( cal2 );
     * ```
     * 
     * would return false since the time zone is applied first which results in comparing `2002/02/28 01:00` for `cal1`
     * with `2002/02/27 23:00` for `cal2`.
     */
    isSameDay(other: Calendar): boolean;
    /**
     * Checks, whether two calendar dates fall on the same day.
     * 
     * The method performs comparison based on both calendar's
     * time stamps by ignoring any defined time zones.
     * 
     * Examples:
     * 
     * ```
     * new Calendar( new Date( "2002/02/28 13:45" ).isSameDayByTimestamp( new Calendar( new Date( "2002/02/28 06:01" ) ) );
     * ```
     * 
     * would return true.
     * 
     * ```
     * new Calendar( new Date( "2002/02/28 13:45" ).isSameDayByTimestamp( new Calendar( new Date( "2002/02/12 13:45" ) ) );
     * ```
     * 
     * would return false.
     * 
     * ```
     * new Calendar( new Date( "2002/02/28 13:45" ).isSameDayByTimestamp( new Calendar( new Date( "1970/02/28 13:45" ) ) );
     * ```
     * 
     * would return false.
     * 
     * ```
     * var cal1 = new Calendar( new Date( "2002/02/28 02:00" );
     * cal1.setTimeZone( "Etc/GMT+1" );
     * var cal2 = new Calendar( new Date( "2002/02/28 00:00" );
     * cal2.setTimeZone( "Etc/GMT+1" );
     * cal1.isSameDayByTimestamp( cal2 );
     * ```
     * 
     * would return true since the time zone is not applied first which results in comparing `2002/02/28 02:00` for `cal1`
     * with `2002/02/28 00:00` for `cal2`.
     */
    isSameDayByTimestamp(other: Calendar): boolean;
    /**
     * Indicates if the field is set.
     */
    isSet(field: number): boolean;
    /**
     * Parses the string according to the date and time format pattern and set
     * the time at this calendar object. For the specification of the date and
     * time format pattern see the javadoc of the JDK class java.text.SimpleDateFormat.
     * If a time zone is included in the format string,
     * this time zone is used to interpet the time. Otherwise the currently set
     * calendar time zone is used to parse the given time string.
     */
    parseByFormat(timeString: string, format: string): void;
    /**
     * Parses the string according the date format pattern of the given locale.
     * If the locale name is invalid, an exception is thrown. The currently set
     * calendar time zone is used to parse the given time string.
     */
    parseByLocale(timeString: string, locale: string, pattern: number): void;
    /**
     * Rolls the specified field up or down one value.
     */
    roll(field: number, up: boolean): void;
    /**
     * Rolls the specified field using the specified value.
     */
    roll(field: number, amount: number): void;
    /**
     * Sets the given calendar field to the given value.
     */
    set(field: number, value: number): void;
    /**
     * Sets the values for the calendar fields YEAR, MONTH, and DAY_OF_MONTH.
     */
    set(year: number, month: number, date: number): void;
    /**
     * Sets the values for the calendar fields YEAR, MONTH,
     * DAY_OF_MONTH, HOUR_OF_DAY, and MINUTE.
     */
    set(year: number, month: number, date: number, hourOfDay: number, minute: number): void;
    /**
     * Sets the values for the calendar fields YEAR, MONTH,
     * DAY_OF_MONTH, HOUR_OF_DAY, MINUTE and SECOND.
     */
    set(year: number, month: number, date: number, hourOfDay: number, minute: number, second: number): void;
    /**
     * Sets what the first day of the week is.
     */
    setFirstDayOfWeek(value: number): void;
    /**
     * Sets the current time stamp of this calendar.
     * 
     * WARNING: Keep in mind that the set Date object's time is always
     * interpreted in the time zone GMT. This means that time zone
     * information at the calendar object needs to be set separately by
     * using the setTimeZone method.
     */
    setTime(date: Date): void;
    /**
     * Sets the current time zone of this calendar.
     * 
     * WARNING: Keep in mind that the time stamp represented by the calendar is
     * always interpreted in the time zone GMT. Changing the time zone will not
     * change the calendar's time stamp.
     */
    setTimeZone(timeZone: string): void;
}

export = Calendar;
