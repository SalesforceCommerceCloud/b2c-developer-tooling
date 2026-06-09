import Collection = require('../util/Collection');
import ABTestSegment = require('./ABTestSegment');

/**
 * Manager class used to access AB-test information in the storefront.
 */
declare class ABTestMgr {
    /**
     * Return the AB-test segments to which the current customer is assigned.
     * AB-test segments deleted in the meantime will not be returned.
     */
    static readonly assignedTestSegments: Collection<ABTestSegment>;
    private constructor();
    /**
     * Return the AB-test segments to which the current customer is assigned.
     * AB-test segments deleted in the meantime will not be returned.
     */
    static getAssignedTestSegments(): Collection<ABTestSegment>;
    /**
     * Test whether the current customer is a member of the specified AB-test
     * segment. This method can be used to customize the storefront experience
     * in ways that are not supported using Business Manager configuration
     * alone.
     */
    static isParticipant(testID: string, segmentID: string): boolean;
}

export = ABTestMgr;
