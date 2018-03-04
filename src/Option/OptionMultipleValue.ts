import {OptionMultiple} from "./OptionMultiple";
import {IOptionContext} from "./OptionContext";
import {Option} from "./Option";

export interface IOptionMultipleValueConstructor
{
    new (option: any): OptionMultipleValue;
}

export abstract class OptionMultipleValue implements IOptionContext
{
    protected _option: OptionMultiple<OptionMultipleValue>;

    constructor(option: OptionMultiple<OptionMultipleValue>)
    {
        this._option = option;
    }

    public initialize(): void
    {
        // Do nothing
    }

    abstract getOptions(): { [optName: string]: Option };

    abstract getOption(): OptionMultiple<OptionMultipleValue>
    abstract getOption<T extends Option>(optName: any, searchInDefault?: boolean): T;

    abstract hasOption(optName: any): boolean;

    public getContextType(): string
    {
        return "option";
    }

    /**
     * Checks whether specified option chain is defined in config
     *
     * @param {string} optionName
     * @returns {boolean}
     */
    public has(optionName: any): boolean
    {
        try {
            this.get(optionName);
            return true;

        } catch (e) {
            return false;
        }
    }

    public get(): OptionMultipleValue
    public get<T>(optionName: any): T
    public get(optionName?: any): any
    {
        if (arguments.length === 0) {
            return this;
        }

        const parts = optionName.split(/[\.\[\]]/);
        let oldValue: any = this;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (!oldValue.hasOption(part)) {
                throw new Error(
                    'Trying to get undefined option value "' + parts.slice(0, i + 1).join('.') + '" ' +
                    'in option ' + this.getOption()
                );
            }
            oldValue = oldValue.getOption(part).getValue();
        }

        return oldValue;
    }

    /**
     * Sets value of specified option chain
     */
    public set(value: any, force?: boolean): void
    public set(optionName: string|number, optionValue: any, force?: boolean): void
    public set(optionName: any, optionValue?: any, force?: boolean): void
    {
        if (arguments.length === 1) {
            return this.getOption().setValue(optionName)
        }

        if (
            arguments.length === 2
            && typeof optionName === 'object'
            && typeof optionValue === 'boolean'
        ) {
            force = optionValue;
            optionValue = optionName;
        }

        if (force) {
            if (arguments.length === 2) {
                return this.getOption().setValueData(optionValue);
            }
            this.getOption().setValueData(OptionMultiple.convertValueToObject(optionName, optionValue));
        }

        this.getOption().setValue(OptionMultiple.convertValueToObject(optionName, optionValue));
    }

    /**
     * Allows to loop over all multiple value children
     */
    abstract forEach(callback: (value?: any, optName?: any, option?: Option) => any): void;

    /**
     * Returns plain data of current option multiple value.
     *
     * If valuesOnly specified as true then it will return
     * only options which values are not default
     */
    abstract getData(valuesOnly?: boolean): any;

    /**
     * Returns string representation of current option multiple value
     */
    public toString(): string
    {
        return this.getData().toString();
    }

    /**
     * Returns valueOf value
     */
    public valueOf(): any
    {
        return this.getData();
    }
}