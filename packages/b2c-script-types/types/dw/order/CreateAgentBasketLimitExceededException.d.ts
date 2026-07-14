/**
 * This exception is thrown by BasketMgr.createAgentBasket to indicate that the open agent basket limit for
 * the current session customer is already reached, and therefore no new agent basket could be created.
 */
declare class CreateAgentBasketLimitExceededException {
    private constructor();
}

export = CreateAgentBasketLimitExceededException;
