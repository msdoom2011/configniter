import { IOptionDefinition } from './Option/OptionType';
import { OptionManager } from "./Option/OptionManager";
import { ConfigSchema } from "./ConfigSchema";
import { Configurator } from "./Configurator";
import { Tools } from "./Tools/Tools";
import { Config } from "./Config";

export class ConfIgniter
{
    /**
     * Custom types definitions
     *
     * @type {{}}
     */
    public static _types: { [optName: string]: IOptionDefinition } = {};

    /**
     * Option manager instance
     *
     * @type {OptionManager}
     * @private
     */
    private _optionManager: OptionManager;

    /**
     * A plain object that contains definition of configuration schema
     *
     * @type {Object}
     * @private
     */
    private _schemaDefinition: { [optName: string]: IOptionDefinition } = {};

    /**
     * Definition of configs class
     *
     * @type {ConfigSchema}
     * @private
     */
    private _schema: ConfigSchema | null = null;

    /**
     * Collection of registered app configurators
     *
     * @type {Array<Configurator>}
     * @private
     */
    private _configurators: Array<Configurator> = [];

    /**
     * Instance of config class containing application configuration
     *
     * @type {Config}
     * @private
     */
    private _configs: Config | null = null;

    public static normalizeSchema(
        optionManager: OptionManager,
        schema: IOptionDefinition | { [optionName: string]: IOptionDefinition }
    ): IOptionDefinition | { [optionName: string]: IOptionDefinition }
    {
        if (typeof schema['type'] === 'string') {
            let parentTypeName = schema['type'];

            if (optionManager.hasType(parentTypeName)) {
                const parentTypeDefinition = Tools.copy(optionManager.getTypeDefinition(parentTypeName));

                parentTypeName = parentTypeDefinition.type;

                schema = Tools.extendDeep(parentTypeDefinition, schema);
                schema['type'] = parentTypeName;
            }

            for (const attrName in schema) {
                if (
                    schema.hasOwnProperty(attrName)
                    && Tools.isPlainObject(schema[attrName])
                ) {
                    schema[attrName] = this.normalizeSchema(optionManager, schema[attrName]);
                }
            }

        } else if (Tools.isPlainObject(schema)) {
            for (let optName in schema) {
                if (schema.hasOwnProperty(optName)) {
                    schema[optName] = this.normalizeSchema(optionManager, schema[optName]);
                }
            }
        }

        return schema;
    }

    public static types(): { [optName: string]: IOptionDefinition };
    public static types(customTypes: { [optName: string]: IOptionDefinition }): void
    public static types(customTypes?: { [optName: string]: IOptionDefinition }): { [optName: string]: IOptionDefinition } | void
    {
        if (customTypes) {
            this._types = Tools.extendDeep(this._types, customTypes);

        } else {
            return this._types;
        }
    }

    /**
     * @constructor
     */
    constructor(schema?: { [optName: string]: IOptionDefinition })
    {
        this._optionManager = new OptionManager((<typeof ConfIgniter>this.constructor).types());

        if (Tools.isPlainObject(schema)) {
            this._schemaDefinition = this.createSchemaDefinition(schema);
        }
    }

    /**
     * Returns option manager instance
     *
     * @returns {OptionManager}
     */
    public getOptionManager(): OptionManager
    {
        return this._optionManager;
    }

    // =============================== CONFIG SCHEMA ==============================

    private getSchemaDefinition(): { [optName: string]: IOptionDefinition }
    {
        if (!this._schemaDefinition) {
            this._schemaDefinition = this.createSchemaDefinition();
        }

        return this._schemaDefinition;
    }

    private createSchemaDefinition(schema: { [optName: string]: IOptionDefinition } = {}): { [optName: string]: IOptionDefinition }
    {
        for (const configurator of this._configurators) {
            let configuratorSchema = configurator.getSchema();

            // First normalization of schema
            configuratorSchema = configurator.normalizeSchema(configuratorSchema);

            // Altering schema
            configuratorSchema = configurator.alterSchema(configuratorSchema);

            // Second normalization of schema
            // Normalizes possible new schema parts, like 'options' in objectCollection type
            configuratorSchema = configurator.normalizeSchema(configuratorSchema);

            if (configurator.isPrivate()) {
                configurator.injectSchema(configuratorSchema, schema);
                continue;
            }

            if (OptionManager.isOptionDefinition(configuratorSchema)) {
                schema[configurator.getName()] = <IOptionDefinition>configuratorSchema;

            } else {
                for (let optName in configuratorSchema) {
                    if (configuratorSchema.hasOwnProperty(optName)) {
                        schema[optName] = Tools.copy(configuratorSchema[optName]);
                    }
                }
            }
        }

        schema = this.processSchemaDefinition(schema);
        schema = this.validateSchemaDefinition(schema);

        return schema;
    }

    /**
     * Process module configuration schema
     */
    private processSchemaDefinition(schema: { [optName: string]: IOptionDefinition }): { [optName: string]: IOptionDefinition }
    {
        for (const configurator of this._configurators) {
            const configuratorName = configurator.getName();
            const configuratorSchema = schema[configuratorName] || configurator.getSchema();

            configurator.processSchema(configuratorSchema, schema);
        }

        return schema;
    }

    /**
     * Validates module configuration schema
     */
    private validateSchemaDefinition(schema: { [optName: string]: IOptionDefinition }): { [optName: string]: IOptionDefinition }
    {
        for (const configurator of this._configurators) {
            const configuratorName = configurator.getName();
            const configuratorSchema = schema[configuratorName] || configurator.getSchema();

            configurator.validateSchema(configuratorSchema, schema);
        }

        return schema;
    }

    // ================================== CONFIGS =================================

    /**
     * Returns app configuration class instance
     *
     * @param {object} defaultConfigs Default configuration data
     *
     * @returns {Config}
     */
    public getConfigs(defaultConfigs?: object): any & Config
    {
        if (!this._configs) {
            this._configs = this.createConfigs(defaultConfigs);
        }

        return this._configs;
    }

    /**
     * Changes app configuration data
     *
     * @param {Object} configsData
     */
    public setConfigs(configsData: any): void
    {
        const configs = this.getConfigs();

        if (!configs) {
            throw new Error(`Trying to set app configs before it was created`);
        }

        configs.setData(configsData);
    }

    /**
     * Creates configs class
     *
     * @returns {Config}
     */
    private createConfigs(defaultConfigs: object = {}): Config
    {
        if (!Tools.isPlainObject(defaultConfigs)) {
            throw new Error(
                'Specified invalid app default configuration data! ' +
                'It should be a plain object'
            );
        }

        const configurators = this._configurators;

        // Creating config class instance

        const configs = this.getSchema().createInstance();
        const configsValues: any = {};

        for (const configurator of configurators) {
            Tools.extendDeep(configsValues, configurator.getValues());
        }

        // Performing configs processing

        for (const configurator of configurators) {
            const configuratorName = configurator.getName();
            const configuratorConfigs = configs.hasOption(configuratorName)
                ? configs[configuratorName]
                : {}
            ;

            configurator.processConfigs(
                configuratorConfigs,
                configs
            );
        }

        // Setting initial default data

        for (let optName in configsValues) {
            if (!configsValues.hasOwnProperty(optName)) {
                continue;
            }

            const opt = configs.getOption(optName);

            if (!opt) {
                throw new Error(
                    'Trying to set default value to undefined option ' +
                    '"' + optName + '" in ' + configs
                );
            }

            opt.getTypeDefinition().setValue(configsValues[optName]);
            opt.setValue(configsValues[optName]);
        }

        // Setting initial values data

        configs.setData(defaultConfigs);

        return configs;
    }

    /**
     * Returns module configuration class if it was created early
     * or creates and register configs class id it wasn't.
     *
     * @returns {ConfigSchema}
     */
    public getSchema(): ConfigSchema
    {
        if (!this._schema) {
            this._schema = new ConfigSchema(this, this.getSchemaDefinition());
        }

        return this._schema;
    }

    // =============================== CONFIGURATORS ==============================

    /**
     * Registers app configurator
     *
     * @param {Configurator} configurator
     */
    public add(configurator: Configurator): void
    {
        if (!(configurator instanceof Configurator)) {
            throw new Error(
                'Trying to register invalid configurator to ConfIgniter! ' +
                'It should be an instance of Configurator class'
            );
        }

        if (this.has(configurator.getName())) {
            throw new Error(
                'Trying to add already registered module configurator ' +
                'named "' + configurator.getName() + '"'
            );
        }

        configurator.setConfIgniter(this);

        this._configurators.push(configurator);
    }

    /**
     * Checks whether is set configurator with specified name
     *
     * @param {string} configuratorName
     * @returns {boolean}
     */
    public has(configuratorName: string): boolean
    {
        return this._configurators.some((configurator: Configurator) => {
            return configurator.getName() === configuratorName;
        });
    }
}