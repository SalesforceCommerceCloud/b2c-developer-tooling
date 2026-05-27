import PersistentObject = require('../object/PersistentObject');
import ABTest = require('./ABTest');

/**
 * Object representing an AB-test segment in the Commerce Cloud Digital.
 * 
 * Each AB-test defines 1 or more segments to which customers are randomly
 * assigned by the platform when they qualify for the AB-test. Customers are
 * assigned to segments according to allocation percentages controlled by the
 * merchant. Each AB-test segment defines a set of "experiences" that the
 * merchant is testing and which which apply only to the customers in that
 * segment.  There is always one "control" segment which contains only the
 * default set of experiences for that site.
 */
declare class ABTestSegment extends PersistentObject {
    /**
     * Get the AB-test to which this segment belongs.
     */
    readonly ABTest: ABTest;
    /**
     * Get the ID of the AB-test segment.
     */
    readonly ID: string;
    /**
     * Returns true if this is the "control segment" for the AB-test, meaning
     * the segment that has no experiences associated with it.
     */
    readonly controlSegment: boolean;
    private constructor();
    /**
     * Get the AB-test to which this segment belongs.
     */
    getABTest(): ABTest;
    /**
     * Get the ID of the AB-test segment.
     */
    getID(): string;
    /**
     * Returns true if this is the "control segment" for the AB-test, meaning
     * the segment that has no experiences associated with it.
     */
    isControlSegment(): boolean;
}

export = ABTestSegment;
