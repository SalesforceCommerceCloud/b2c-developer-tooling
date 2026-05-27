import ActiveData = require('../object/ActiveData');
import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');

declare global {
    module ICustomAttributes {
        interface ProductActiveData extends ICustomAttributes.ActiveData {
        }
    }
}

/**
 * Represents the active data for a dw.catalog.Product in Commerce Cloud Digital.
 */
declare class ProductActiveData extends ActiveData<ICustomAttributes.ProductActiveData> {
    /**
     * Returns the date the product became available on the site, or
     * `null` if none has been set.
     */
    readonly availableDate: Date | null;
    /**
     * Returns the average gross margin percentage of the product,
     * over the most recent day for the site, or `null`
     * if none has been set or the value is no longer valid.
     */
    readonly avgGrossMarginPercentDay: number;
    /**
     * Returns the average gross margin percentage of the product,
     * over the most recent 30 days for the site, or `null`
     * if none has been set or the value is no longer valid.
     */
    readonly avgGrossMarginPercentMonth: number;
    /**
     * Returns the average gross margin percentage of the product,
     * over the most recent 7 days for the site, or `null`
     * if none has been set or the value is no longer valid.
     */
    readonly avgGrossMarginPercentWeek: number;
    /**
     * Returns the average gross margin percentage of the product,
     * over the most recent 365 days for the site, or `null`
     * if none has been set or the value is no longer valid.
     */
    readonly avgGrossMarginPercentYear: number;
    /**
     * Returns the average gross margin value of the product,
     * over the most recent day for the site, or `null`
     * if none has been set or the value is no longer valid.
     */
    readonly avgGrossMarginValueDay: number;
    /**
     * Returns the average gross margin value of the product,
     * over the most recent 30 days for the site, or `null`
     * if none has been set or the value is no longer valid.
     */
    readonly avgGrossMarginValueMonth: number;
    /**
     * Returns the average gross margin value of the product,
     * over the most recent 7 days for the site, or `null`
     * if none has been set or the value is no longer valid.
     */
    readonly avgGrossMarginValueWeek: number;
    /**
     * Returns the average gross margin value of the product,
     * over the most recent 365 days for the site, or `null`
     * if none has been set or the value is no longer valid.
     */
    readonly avgGrossMarginValueYear: number;
    /**
     * Returns the average sales price for the product, over the most recent day
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly avgSalesPriceDay: number;
    /**
     * Returns the average sales price for the product, over the most recent 30 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly avgSalesPriceMonth: number;
    /**
     * Returns the average sales price for the product, over the most recent 7 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly avgSalesPriceWeek: number;
    /**
     * Returns the average sales price for the product, over the most recent 365 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly avgSalesPriceYear: number;
    /**
     * Returns the conversion rate of the product, over the most recent day
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly conversionDay: number;
    /**
     * Returns the conversion rate of the product, over the most recent 30 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly conversionMonth: number;
    /**
     * Returns the conversion rate of the product, over the most recent 7 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly conversionWeek: number;
    /**
     * Returns the conversion rate of the product, over the most recent 365 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly conversionYear: number;
    /**
     * Returns the cost price for the product for the site,
     * or `null` if none has been set or the value is no longer valid.
     */
    readonly costPrice: number;
    /**
     * Returns the number of days the product has been available on the site.
     * The number is calculated based on the current date and the date the
     * product became available on the site, or if that date has not been set,
     * the date the product was created in the system.
     * @see getAvailableDate
     */
    readonly daysAvailable: number;
    /**
     * Returns the impressions of the product, over the most recent day
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly impressionsDay: number;
    /**
     * Returns the impressions of the product, over the most recent 30 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly impressionsMonth: number;
    /**
     * Returns the impressions of the product, over the most recent 7 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly impressionsWeek: number;
    /**
     * Returns the impressions of the product, over the most recent 365 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly impressionsYear: number;
    /**
     * Returns the look to book ratio of the product, over the most recent day
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly lookToBookRatioDay: number;
    /**
     * Returns the look to book ratio of the product, over the most recent 30 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly lookToBookRatioMonth: number;
    /**
     * Returns the look to book ratio of the product, over the most recent 7 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly lookToBookRatioWeek: number;
    /**
     * Returns the look to book ratio of the product, over the most recent 365 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly lookToBookRatioYear: number;
    /**
     * Returns the number of orders containing the product, over the most
     * recent day for the site, or `null` if none has been set
     * or the value is no longer valid.
     */
    readonly ordersDay: number;
    /**
     * Returns the number of orders containing the product, over the most
     * recent 30 days for the site, or `null` if none has been set
     * or the value is no longer valid.
     */
    readonly ordersMonth: number;
    /**
     * Returns the number of orders containing the product, over the most
     * recent 7 days for the site, or `null` if none has been set
     * or the value is no longer valid.
     */
    readonly ordersWeek: number;
    /**
     * Returns the number of orders containing the product, over the most
     * recent 365 days for the site, or `null` if none has been set
     * or the value is no longer valid.
     */
    readonly ordersYear: number;
    /**
     * Returns the return rate for the product for the site,
     * or `null` if none has been set or the value is no longer valid.
     */
    readonly returnRate: number;
    /**
     * Returns the revenue of the product, over the most recent day
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly revenueDay: number;
    /**
     * Returns the revenue of the product, over the most recent 30 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly revenueMonth: number;
    /**
     * Returns the revenue of the product, over the most recent 7 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly revenueWeek: number;
    /**
     * Returns the revenue of the product, over the most recent 365 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly revenueYear: number;
    /**
     * Returns the sales velocity of the product, over the most recent day
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly salesVelocityDay: number;
    /**
     * Returns the sales velocity of the product, over the most recent 30 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly salesVelocityMonth: number;
    /**
     * Returns the sales velocity of the product, over the most recent 7 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly salesVelocityWeek: number;
    /**
     * Returns the sales velocity of the product, over the most recent 365 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly salesVelocityYear: number;
    /**
     * Returns the units of the product ordered over the most recent day
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly unitsDay: number;
    /**
     * Returns the units of the product ordered over the most recent 30 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly unitsMonth: number;
    /**
     * Returns the units of the product ordered over the most recent 7 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly unitsWeek: number;
    /**
     * Returns the units of the product ordered over the most recent 365 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly unitsYear: number;
    /**
     * Returns the views of the product, over the most recent day
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly viewsDay: number;
    /**
     * Returns the views of the product, over the most recent 30 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly viewsMonth: number;
    /**
     * Returns the views of the product, over the most recent 7 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly viewsWeek: number;
    /**
     * Returns the views of the product, over the most recent 365 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly viewsYear: number;
    private constructor();
    /**
     * Returns the date the product became available on the site, or
     * `null` if none has been set.
     */
    getAvailableDate(): Date | null;
    /**
     * Returns the average gross margin percentage of the product,
     * over the most recent day for the site, or `null`
     * if none has been set or the value is no longer valid.
     */
    getAvgGrossMarginPercentDay(): number;
    /**
     * Returns the average gross margin percentage of the product,
     * over the most recent 30 days for the site, or `null`
     * if none has been set or the value is no longer valid.
     */
    getAvgGrossMarginPercentMonth(): number;
    /**
     * Returns the average gross margin percentage of the product,
     * over the most recent 7 days for the site, or `null`
     * if none has been set or the value is no longer valid.
     */
    getAvgGrossMarginPercentWeek(): number;
    /**
     * Returns the average gross margin percentage of the product,
     * over the most recent 365 days for the site, or `null`
     * if none has been set or the value is no longer valid.
     */
    getAvgGrossMarginPercentYear(): number;
    /**
     * Returns the average gross margin value of the product,
     * over the most recent day for the site, or `null`
     * if none has been set or the value is no longer valid.
     */
    getAvgGrossMarginValueDay(): number;
    /**
     * Returns the average gross margin value of the product,
     * over the most recent 30 days for the site, or `null`
     * if none has been set or the value is no longer valid.
     */
    getAvgGrossMarginValueMonth(): number;
    /**
     * Returns the average gross margin value of the product,
     * over the most recent 7 days for the site, or `null`
     * if none has been set or the value is no longer valid.
     */
    getAvgGrossMarginValueWeek(): number;
    /**
     * Returns the average gross margin value of the product,
     * over the most recent 365 days for the site, or `null`
     * if none has been set or the value is no longer valid.
     */
    getAvgGrossMarginValueYear(): number;
    /**
     * Returns the average sales price for the product, over the most recent day
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getAvgSalesPriceDay(): number;
    /**
     * Returns the average sales price for the product, over the most recent 30 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getAvgSalesPriceMonth(): number;
    /**
     * Returns the average sales price for the product, over the most recent 7 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getAvgSalesPriceWeek(): number;
    /**
     * Returns the average sales price for the product, over the most recent 365 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getAvgSalesPriceYear(): number;
    /**
     * Returns the conversion rate of the product, over the most recent day
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getConversionDay(): number;
    /**
     * Returns the conversion rate of the product, over the most recent 30 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getConversionMonth(): number;
    /**
     * Returns the conversion rate of the product, over the most recent 7 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getConversionWeek(): number;
    /**
     * Returns the conversion rate of the product, over the most recent 365 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getConversionYear(): number;
    /**
     * Returns the cost price for the product for the site,
     * or `null` if none has been set or the value is no longer valid.
     */
    getCostPrice(): number;
    /**
     * Returns the number of days the product has been available on the site.
     * The number is calculated based on the current date and the date the
     * product became available on the site, or if that date has not been set,
     * the date the product was created in the system.
     * @see getAvailableDate
     */
    getDaysAvailable(): number;
    /**
     * Returns the impressions of the product, over the most recent day
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getImpressionsDay(): number;
    /**
     * Returns the impressions of the product, over the most recent 30 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getImpressionsMonth(): number;
    /**
     * Returns the impressions of the product, over the most recent 7 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getImpressionsWeek(): number;
    /**
     * Returns the impressions of the product, over the most recent 365 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getImpressionsYear(): number;
    /**
     * Returns the look to book ratio of the product, over the most recent day
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getLookToBookRatioDay(): number;
    /**
     * Returns the look to book ratio of the product, over the most recent 30 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getLookToBookRatioMonth(): number;
    /**
     * Returns the look to book ratio of the product, over the most recent 7 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getLookToBookRatioWeek(): number;
    /**
     * Returns the look to book ratio of the product, over the most recent 365 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getLookToBookRatioYear(): number;
    /**
     * Returns the number of orders containing the product, over the most
     * recent day for the site, or `null` if none has been set
     * or the value is no longer valid.
     */
    getOrdersDay(): number;
    /**
     * Returns the number of orders containing the product, over the most
     * recent 30 days for the site, or `null` if none has been set
     * or the value is no longer valid.
     */
    getOrdersMonth(): number;
    /**
     * Returns the number of orders containing the product, over the most
     * recent 7 days for the site, or `null` if none has been set
     * or the value is no longer valid.
     */
    getOrdersWeek(): number;
    /**
     * Returns the number of orders containing the product, over the most
     * recent 365 days for the site, or `null` if none has been set
     * or the value is no longer valid.
     */
    getOrdersYear(): number;
    /**
     * Returns the return rate for the product for the site,
     * or `null` if none has been set or the value is no longer valid.
     */
    getReturnRate(): number;
    /**
     * Returns the revenue of the product, over the most recent day
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getRevenueDay(): number;
    /**
     * Returns the revenue of the product, over the most recent 30 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getRevenueMonth(): number;
    /**
     * Returns the revenue of the product, over the most recent 7 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getRevenueWeek(): number;
    /**
     * Returns the revenue of the product, over the most recent 365 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getRevenueYear(): number;
    /**
     * Returns the sales velocity of the product, over the most recent day
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getSalesVelocityDay(): number;
    /**
     * Returns the sales velocity of the product, over the most recent 30 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getSalesVelocityMonth(): number;
    /**
     * Returns the sales velocity of the product, over the most recent 7 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getSalesVelocityWeek(): number;
    /**
     * Returns the sales velocity of the product, over the most recent 365 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getSalesVelocityYear(): number;
    /**
     * Returns the units of the product ordered over the most recent day
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getUnitsDay(): number;
    /**
     * Returns the units of the product ordered over the most recent 30 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getUnitsMonth(): number;
    /**
     * Returns the units of the product ordered over the most recent 7 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getUnitsWeek(): number;
    /**
     * Returns the units of the product ordered over the most recent 365 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getUnitsYear(): number;
    /**
     * Returns the views of the product, over the most recent day
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getViewsDay(): number;
    /**
     * Returns the views of the product, over the most recent 30 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getViewsMonth(): number;
    /**
     * Returns the views of the product, over the most recent 7 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getViewsWeek(): number;
    /**
     * Returns the views of the product, over the most recent 365 days
     * for the site, or `null` if none has been set or the value
     * is no longer valid.
     */
    getViewsYear(): number;
}

export = ProductActiveData;
