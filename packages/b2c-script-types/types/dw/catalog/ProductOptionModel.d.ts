import Collection = require('../util/Collection');
import ProductOption = require('./ProductOption');
import ProductOptionValue = require('./ProductOptionValue');
import Money = require('../value/Money');
import URL = require('../web/URL');

/**
 * This class represents the option model of a specific product and
 * for a specific currency. It provides accessor methods to the configured
 * options and the values of those options. It has also methods to set a
 * specific selection of option values.
 */
declare class ProductOptionModel {
    /**
     * Returns the collection of product options.
     */
    readonly options: Collection<ProductOption>;
    private constructor();
    /**
     * Returns the product option for the specified ID.
     */
    getOption(optionID: string): ProductOption;
    /**
     * Returns the product option value object for the passed value id and in
     * the context of the passed option.
     */
    getOptionValue(option: ProductOption, valueID: string): ProductOptionValue;
    /**
     * Returns a collection of product option values for the
     * specified product option.
     */
    getOptionValues(option: ProductOption): Collection<ProductOptionValue>;
    /**
     * Returns the collection of product options.
     */
    getOptions(): Collection<ProductOption>;
    /**
     * Returns the effective price of the specified option value.
     */
    getPrice(optionValue: ProductOptionValue): Money;
    /**
     * Returns the selected value for the specified product option. If no
     * option values was set as selected option explicitly, the method
     * returns the default option value for this option.
     */
    getSelectedOptionValue(option: ProductOption): ProductOptionValue;
    /**
     * Returns true if the specified option value is the one currently selected,
     * false otherwise.
     */
    isSelectedOptionValue(option: ProductOption, value: ProductOptionValue): boolean;
    /**
     * Updates the selection of the specified option based on the specified value.
     */
    setSelectedOptionValue(option: ProductOption, value: ProductOptionValue): void;
    /**
     * Returns a URL that can be used to select one or more option values. The
     * optional `varOptionAndValues` argument can be empty, or can
     * contain one or more option / value pairs. This variable list must be even
     * in length, with options and values alternating. If the list is odd in
     * length, the last argument will be ignored. Options can be specified as
     * instances of ProductOption, or String option ID. Values can be specified
     * as instances of ProductOptionValue or as strings representing the value
     * ID. If a parameter is invalid, then the parameter pair is not included in
     * the generated URL. The returned URL will contain options and values
     * already selected in the product option model, as well as options and
     * values specified as method parameters. This includes option values
     * explicitly selected and implicitly selected by default.
     */
    url(action: string, ...varOptionAndValues: any[]): URL;
    /**
     * Returns an URL that can be used to select a specific value of a specific
     * option.
     */
    urlSelectOptionValue(action: string, option: ProductOption, value: ProductOptionValue): string;
}

export = ProductOptionModel;
