import {OptionContextRoot} from './Option/OptionContextRoot';
import {ConfigSchema} from "./ConfigSchema";
import {Tools} from './Tools/Tools';
import {OptionType} from './Option/OptionType';

export class Config extends OptionContextRoot
{
    [optName: string]: any;

    private _schema: ConfigSchema;

    constructor(configSchema: ConfigSchema)
    {
        super(configSchema.getOptionManager());

        const allSchemaOptions = configSchema.getOptions();

        this._schema = configSchema;

        for (let optionName in allSchemaOptions) {
            if (allSchemaOptions.hasOwnProperty(optionName)) {
                this._options[optionName] = allSchemaOptions[optionName].create(optionName, this);
            }
        }
    }

    /**
     * Sets value of specified option chain
     *
     * @param {string} optionName
     * @param value
     */
    public set(optionName: string, value: any): void
    {
        this.setData(getOptValue(optionName.split(/[\.\[\]]/)));

        function getOptValue(parts: string[]): any {
            const optName = parts.shift();

            if (!optName) {
                return value;
            }

            if (optName.match(/^\d+$/)) {
                return (<any[]>[])[parseInt(optName)] = getOptValue(parts);
            }

            return { optName: getOptValue(parts) };
        }
    }

    /**
     * Returns option by chain of option names
     *
     * @param {string} optionName
     * @returns {*}
     */
    public get<T>(optionName: string): T
    {
        const parts = optionName.split(/[\.\[\]]/);
        let value: any = this;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (!value.hasOption(part)) {
                throw new Error(
                    'Trying to get undefined config ' +
                    'option "' + parts.slice(0, i + 1).join('.') + '"'
                );
            }

            value = value.getOption(part).getValue();
        }

        return <T>value;
    }

    /**
     * Checks whether specified option chain is defined in config
     *
     * @param {string} optionName
     * @returns {boolean}
     */
    public has(optionName: string): boolean
    {
        try {
            this.get(optionName);
            return true;

        } catch (e) {
            return false;
        }
    }

    public getDefinition<T extends OptionType>(optionName: string): T
    {
        const nameParts = optionName.split('.');
        const optionType = this.getSchema().getOption(nameParts.shift());

        if (nameParts.length === 0) {
            return <T>optionType;
        }

        if (!optionType || !('findChildTypeDefinition' in optionType)) {
            return;
        }

        return (<any>optionType).findChildTypeDefinition<T>(nameParts.join('.'));
    }

    public findChildTypeDefinition<T extends OptionType>(optionName: string): T
    {
        return <T>this.getDefinition(optionName);
    }

    public forEach(callback: (optValue: any, optName: string) => any | boolean): void
    {
        for (let optName in this._options) {
            if (!this._options.hasOwnProperty(optName)) {
                continue;
            }

            if (callback(this._options[optName], optName) === false) {
                break;
            }
        }
    }

    /**
     * Returns class definition instance
     *
     * @returns {ConfigSchema}
     */
    public getSchema(): ConfigSchema
    {
        return this._schema;
    }

    /**
     * Sets values
     *
     * @param {Object} values
     */
    public setData(values: {[optName: string]: any}): void
    {
        if (!values || !Tools.isPlainObject(values)) {
            throw new Error(
                'Specified invalid values for config of schema. ' +
                'It should ba plain object'
            );
        }

        // Setting new data to config options

        for (let optName in values) {
            if (values.hasOwnProperty(optName)) {
                const option = this.getOption(optName);

                if (!option) {
                    throw new Error(
                        'Trying to set default value to undefined option ' +
                        '"' + optName + '"'
                    );
                }

                option.setValue(values[optName], false);
            }
        }

        // Invoking watcher callbacks

        const event = this.createWatcherEvent(null, null);

        this.invokeWatchers(event);
    }

    /**
     * Returns object with all config options with current values
     *
     * @returns {{}}
     */
    public getData(): { [optName: string]: any }
    {
        const options = this.getSchema().getOptions();
        const values = <any>{};

        for (let optName in options) {
            if (options.hasOwnProperty(optName)) {
                values[optName] = this.getOption(optName).getValueData();
            }
        }

        return values;
    }
}