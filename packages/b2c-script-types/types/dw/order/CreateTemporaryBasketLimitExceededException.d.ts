/**
 * This exception is thrown by BasketMgr.createTemporaryBasket to indicate that the open temporary basket
 * limit for the current session customer is already reached, and therefore no new temporary basket could be created.
 */
declare class CreateTemporaryBasketLimitExceededException {
    private constructor();
}

export = CreateTemporaryBasketLimitExceededException;
