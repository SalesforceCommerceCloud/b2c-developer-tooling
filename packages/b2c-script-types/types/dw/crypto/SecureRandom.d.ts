import Bytes = require('../util/Bytes');

/**
 * The SecureRandom class provides a cryptographically strong random number generator (RNG).
 * See the Internet Engineering Task Force (IETF) RFC 1750: Randomness Recommendations for
 * Security for more information.</a>
 * 
 * Typical callers of SecureRandom invoke the following methods to retrieve random bytes:
 * 
 * ```
 * Bytes bytes...
 * SecureRandom random = new SecureRandom();
 * Bytes nextBytes = random.nextBytes(bytes);
 * ```
 * 
 * or more convenient to get a Bytes with the demanded length
 * 
 * ```
 * int length = 32;
 * SecureRandom random = new SecureRandom();
 * Bytes nextBytes = random.nextBytes(length);
 * ```
 * 
 * dw.crypto.SecureRandom is intentionally an adapter for generating cryptographic hard random numbers.
 */
declare class SecureRandom {
    /**
     * Instantiates a new secure random.
     */
    constructor();
    /**
     * Returns the given number of seed bytes, computed using the seed
     * generation algorithm that this class uses to seed itself.  This
     * call may be used to seed other random number generators.
     */
    generateSeed(numBytes: number): Bytes;
    /**
     * Generates a user-specified number of random bytes.
     * 
     * If a call to `setSeed` had not occurred previously,
     * the first call to this method forces this SecureRandom object
     * to seed itself.  This self-seeding will not occur if
     * `setSeed` was previously called.
     */
    nextBytes(numBits: number): Bytes;
    /**
     * Returns the next pseudorandom, uniformly distributed int value from this random number generator's sequence. The general
     * contract of nextInt is that one int value is pseudorandomly generated and returned. All 2^32
     * possible int values are produced with (approximately) equal probability.
     */
    nextInt(): number;
    /**
     * Returns a pseudorandom, uniformly distributed int value
     * between 0 (inclusive) and the specified value (exclusive), drawn from
     * this random number generator's sequence.
     * @throws IllegalArgumentException if n is not positive
     */
    nextInt(upperBound: number): number;
    /**
     * Returns the next pseudorandom, uniformly distributed
     * Number value between 0.0 (inclusive) and 1.0 (exclusive) from this random number generator's sequence.
     */
    nextNumber(): number;
    /**
     * Reseeds this random object. The given seed supplements, rather than replaces, the existing seed. Thus, repeated calls are guaranteed never to reduce randomness.
     */
    setSeed(seed: Bytes): void;
}

export = SecureRandom;
