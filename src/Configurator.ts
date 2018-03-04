import { OptionMultipleValue } from "./Option/OptionMultipleValue";
import { IOptionDefinition } from "./Option/OptionType";
import { OptionManager } from "./Option/OptionManager";
import { ConfIgniter } from './ConfIgniter';
import { Config } from "./Config";

export interface IConfigurator
{
    getName(): string;

    isPrivate(): boolean;

    setConfIgniter(confIgniter: ConfIgniter): void;

    getSchema(): { [optName: string]: IOptionDefinition } | IOptionDefinition;

    alterSchema(
        schema: IOptionDefinition | { [optionName: string]: IOptionDefinition }
    ): IOptionDefinition | { [optionName: string]: IOptionDefinition };

    normalizeSchema(
        schema: IOptionDefinition | { [optionName: string]: IOptionDefinition }
    ): IOptionDefinition | { [optionName: string]: IOptionDefinition };

    injectSchema(
        schema: IOptionDefinition | { [optionName: string]: IOptionDefinition },
        appSchema: { [optionName: string]: IOptionDefinition }
    ): void;

    processSchema(
        schema: IOptionDefinition | { [optionName: string]: IOptionDefinition },
        appSchema: { [optionName: string]: IOptionDefinition }
    ): void;

    validateSchema(
        schema: IOptionDefinition | { [optionName: string]: IOptionDefinition },
        appSchema: { [optionName: string]: IOptionDefinition }
    ): void;

    processConfigs(configs: OptionMultipleValue, appConfigs: Config): void;

    getValues(): any;
}

export abstract class Configurator implements IConfigurator
{
    /**
     * An instance of subclass config manager
     *
     * @type {ConfIgniter}
     * @private
     */
    private _confIgniter: ConfIgniter | any;

    /**
     * Returns name of configuration subtree
     */
    public static getName(): string
    {
        throw new Error(
            `The static method "getName" doesn't implemented ` +
            `in a subclass of class "Configurator"`
        );
    }

    /**
     * Reports whether current configuration schema can be accessed
     * in the root app configuration object level
     *
     * @returns {boolean}
     */
    public static isPrivate(): boolean
    {
        return false;
    }

    public getName(): string
    {
        return (<typeof Configurator>this.constructor).getName();
    }

    public isPrivate(): boolean
    {
        return (<typeof Configurator>this.constructor).isPrivate();
    }

    public setConfIgniter(confIgniter: ConfIgniter): void
    {
        this._confIgniter = confIgniter;
    }

    /**
     * Returns instance of the config manager
     *
     * @returns {ConfIgniter}
     */
    protected getConfIgniter(): ConfIgniter
    {
        return this._confIgniter;
    }

    /**
     * Returns instance of the option manager
     *
     * @returns {OptionManager}
     */
    protected getOptionManager(): OptionManager
    {
        return this.getConfIgniter().getOptionManager();
    }

    /**
     * Returns object which contains definitions of options
     * or an option definition.
     *
     * Depending on what it method returns the finally app config
     * will contain several options or just a single option with name
     * of current configurator.
     *
     * @example
     *
     * Let's suppose that configurator is public and it's name is "foo"
     *
     * // Schema contains definitions of several options
     *
     * public getSchema(): {
     *     return {
     *         opt1: { type: "string" },
     *         opt2: { type: "number" },
     *         ...
     *     };
     * }
     * ...
     *
     * // The final schema will contain options
     *
     * {
     *     opt1: { type: "string" },
     *     opt2: { type: "number" },
     *     ...
     * }
     * ...
     *
     * // Schema is an option definition
     *
     * public getSchema(): {
     *     return { type: "string" };
     * }
     *
     * // The final schema will contain:
     *
     * {
     *     foo: { type: "string" },
     *     ...
     * }
     */
    public getSchema(): { [optName: string]: IOptionDefinition } | IOptionDefinition
    {
        return {};
    }

    /**
     * Normalizes custom types to default
     */
    public normalizeSchema(
        schema: IOptionDefinition | { [optionName: string]: IOptionDefinition }
    ): IOptionDefinition | { [optionName: string]: IOptionDefinition }
    {
        return ConfIgniter.normalizeSchema(
            this.getOptionManager(),
            schema
        );
    }

    /**
     * Alters configuration definition object.
     * Allows add/edit/remove config definition parts of all application
     *
     * @param {*|IOptionDefinition} schema
     */
    public alterSchema(
        schema: IOptionDefinition | { [optionName: string]: IOptionDefinition }
    ): IOptionDefinition | { [optionName: string]: IOptionDefinition }
    {
        return schema;
    }

    /**
     * Injects schema to common configuration tree schema.
     * Applicable only for private configurators!
     *
     * @param {*|IOptionDefinition} schema
     * @param {*} appSchema
     */
    public injectSchema(
        schema: IOptionDefinition | { [optionName: string]: IOptionDefinition },
        appSchema: { [optionName: string]: IOptionDefinition }
    ): void
    {
        // Some operations
    }

    /**
     * Allows process schema right after it has been altered by all configurators
     *
     * @param {*|IOptionDefinition} schema
     * @param {*} appSchema
     */
    public processSchema(
        schema: IOptionDefinition | { [optionName: string]: IOptionDefinition },
        appSchema: { [optionName: string]: IOptionDefinition }
    ): void
    {
        // Some operations
    }

    /**
     * Allows validate schema right after it has been processed
     * Should throw error if something went wrong.
     *
     * @param {*|IOptionDefinition} schema
     * @param {*} appSchema
     */
    public validateSchema(
        schema: IOptionDefinition | { [optionName: string]: IOptionDefinition },
        appSchema: { [optionName: string]: IOptionDefinition }
    ): void
    {
        // Some operations
    }

    /**
     * Returns initial config values
     *
     * @returns {*}
     */
    public getValues(): any
    {
        return {};
    }

    /**
     * Processes configuration values of current configurator
     *
     * @param {Object} configs
     * @param {Object} appConfigs
     */
    public processConfigs(configs: OptionMultipleValue, appConfigs: Config): void
    {
        // Some operations
    }
}