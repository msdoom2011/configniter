import {IOptionDefinition, OptionType} from "./OptionType";
import {OptionMultiple} from "./OptionMultiple";
import {OptionManager} from "./OptionManager";
import {Option} from "./Option";

export interface IOptionContext
{
    [optName: string]: any;

    getContextType: () => string;

    initialize(options?: { [optName: string]: IOptionDefinition }): void;

    getOptions(): { [optName: string]: Option };

    getOption: <T extends Option>(optionName?: string) => T;

    hasOption: (optionName: string) => boolean;
}

export abstract class OptionContext implements IOptionContext
{
    protected _optionManager: OptionManager;

    protected _options: { [optName: string]: Option } = {};

    constructor(optionManager: OptionManager)
    {
        this._optionManager = optionManager;
    }

    public initialize(options: { [optName: string]: IOptionDefinition } = {}): void
    {
        for (let optionName in options) {
            if (!options.hasOwnProperty(optionName)) {
                continue;
            }

            const optionType = this.getOptionManager().createType(optionName, options[optionName], this);

            this._options[optionName] = optionType.create(optionName, this);
            this._options[optionName].attach(this);
        }
    }

    public getOptionManager(): OptionManager
    {
        return this._optionManager;
    }

    /**
     * Should return one of two available values: "class" or "option"
     */
    public getContextType(): string
    {
        return "option";
    }

    public getOptions(): { [optName: string]: Option }
    {
        return this._options;
    }

    /**
     * Returns option instance
     *
     * @param {string} optionName
     *     It is possible specify name of direct child options like "foo", "bar".
     *     Also it is possible specify name of deeper child options like "foo.opt1.opt2"
     */
    public getOption<T extends Option>(optionName?: string): T
    {
        const parts = optionName.split('.');
        let option: any;

        if (parts.length === 1) {
            return <T>this._options[optionName];
        }

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (i === 0) {
                option = this.getOption(part);

                continue;
            }

            if (!(option instanceof OptionMultiple)) {
                return;
            }

            const optionValueInst = (<OptionMultiple<any> & any>option).getValue();

            if (!optionValueInst) {
                return;
            }

            option = optionValueInst.getOption(part);
        }

        return <T>option;
    }

    /**
     * Checks whether option with specified name exists
     *
     * @param {string} optionName
     *     It is possible specify name of direct child options like "foo", "bar".
     *     Also it is possible specify name of deeper child options like "foo.opt1.opt2"
     */
    public hasOption(optionName: string): boolean
    {
        return !!this.getOptionDefinition(optionName);
    }

    /**
     * Returns option type definitions
     *
     * @param {string} optionName
     *     It is possible specify name of direct child options like "foo", "bar".
     *     Also it is possible specify name of deeper child options like "foo.opt1.opt2"
     */
    public getOptionDefinition<T extends OptionType>(optionName: string): T
    {
        const parts = optionName.split('.');
        let optionTypeDef: any;

        if (parts.length === 1) {
            const option = this._options[optionName];

            if (option) {
                return <T>option.getTypeDefinition();
            }
        }

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (i === 0) {
                if (!this.getOption(part)) {
                    return;
                }

                optionTypeDef = this.getOption(part).getTypeDefinition();

                continue;
            }

            if (!('getChildTypeDefinition' in optionTypeDef)) {
                return;
            }

            optionTypeDef = optionTypeDef.getChildTypeDefinition(part);
        }

        return optionTypeDef;
    }
}