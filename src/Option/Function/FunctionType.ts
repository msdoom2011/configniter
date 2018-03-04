import {OptionType} from "../OptionType";

export class FunctionType extends OptionType
{
    public static getName(): string
    {
        return "function";
    }

    public static getEmptyValue(): Function
    {
        return function(): any {};
    }

    public validateValue(value: any): void
    {
        super.validateValue(value);

        if (value && typeof value !== 'function') {
            throw new Error(
                'Specified invalid value of option "' + this + '". ' +
                'It should be a function'
            );
        }
    }
}

