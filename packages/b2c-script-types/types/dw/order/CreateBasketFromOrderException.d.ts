/**
 * This APIException is thrown by method dw.order.BasketMgr.createBasketFromOrder
 * to indicate no Basket could be created from the Order.
 */
declare class CreateBasketFromOrderException {
    /**
     * Indicates reason why dw.order.BasketMgr.createBasketFromOrder failed.
     */
    readonly errorCode: string;
    private constructor();
    /**
     * Indicates reason why dw.order.BasketMgr.createBasketFromOrder failed.
     */
    getErrorCode(): string;
}

export = CreateBasketFromOrderException;
