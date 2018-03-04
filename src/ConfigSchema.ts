import {IOptionDefinition, OptionType} from './Option/OptionType';
import {OptionManager} from './Option/OptionManager';
import {ConfIgniter} from './ConfIgniter';
import {Tools} from './Tools/Tools';
import {Config} from "./Config";

export class ConfigSchema
{
    private _confIgniter: ConfIgniter;

    private _constructor: typeof Config;

    private _definition: { [optName: string]: IOptionDefinition };

    private _options: { [optName: string]: OptionType } = {};

    constructor(confIgniter: ConfIgniter, definition: { [optName: string]: IOptionDefinition })
    {
        if (!Tools.isPlainObject(definition)) {
            throw new Error(
                'Specified invalid config schema definition! ' +
                'It should be a plain object that should match IConfigSchemaDefinition interface'
            );
        }

        this._confIgniter = confIgniter;
        this._definition = definition;
    }

    public getConfIgniter(): ConfIgniter
    {
        return this._confIgniter;
    }

    public getOptionManager(): OptionManager
    {
        return this
            .getConfIgniter()
            .getOptionManager()
        ;
    }

    /**
     * Returns class definition object
     *
     * @returns {Object}
     */
    public getDefinition(): { [optName: string]: IOptionDefinition }
    {
        return this._definition;
    }

    /**
     * Returns class constructor
     *
     * @returns {*}
     */
    private getConstructor(): typeof Config
    {
        if (!this.isConstructorCreated()) {
            this.createConstructor();
        }

        return this._constructor;
    }

    /**
     * Checks whether class constructor is created
     *
     * @returns {boolean}
     */
    private isConstructorCreated(): boolean
    {
        return !!this._constructor;
    }

    /**
     * Generates and returns current class instance constructor
     *
     * @returns {function}
     */
    private createConstructor(): typeof Config
    {
        if (this.isConstructorCreated()) {
            return this._constructor;
        }

        // this.getDefinition().processData();

        const configConstructor = <typeof Config>class ConfigInst extends Config {};
        const schemaOptions = this.getOptions();

        this._constructor = configConstructor;

        for (let optName in schemaOptions) {
            if (schemaOptions.hasOwnProperty(optName)) {
                let optionTypeConstructor = (<typeof OptionType>schemaOptions[optName].constructor).getOptionClass();

                Object.defineProperty(configConstructor.prototype, optName, {
                    configurable: true,
                    enumerable: true,
                    get: optionTypeConstructor.generateGetter(optName),
                    set: optionTypeConstructor.generateSetter(optName)
                });
            }
        }

        return configConstructor;
    }

    /**
     * Creates class instance of current class type
     *
     * @returns {object} Class instance
     */
    public createInstance(): Config
    {
        const configConstructor = this.getConstructor();
        const config = new configConstructor(this);

        config.initialize();

        const schemaOptions = this.getOptions();

        // Attaching hashed typed options

        for (const optName in schemaOptions) {
            if (!schemaOptions.hasOwnProperty(optName)) {
                continue;
            }

            // Getting init value

            const option = config.getOption(optName);
            const optionDefinition = schemaOptions[optName];
            const initValue = optionDefinition.getValue();

            // Setting init value

            if (initValue !== undefined) {
                option.setValueDefault(initValue);
            }
        }

        Object.seal(config);

        return config;
    }

    /**
     * Returns all typed options in current class definition instance
     *
     * @returns {OptionType}
     */
    public getOptions(): {[propName: string]: OptionType}
    {
        return this._options;
    }

    /**
     * Returns option instance by its name
     *
     * @param {string} optionName
     * @returns {OptionType}
     * @throws {Error}
     */
    public getOption(optionName: string): OptionType
    {
        let options = this.getOptions();

        if (!options[optionName]) {
            throw new Error('Trying to call to non existent option "' + optionName + '"');
        }

        return options[optionName];
    }

    /**
     * Checks if option with specified name exists
     *
     * @param {string} optionName
     * @returns {boolean}
     */
    public hasOption(optionName: string): boolean
    {
        return !!this.getOptions()[optionName];
    }
}