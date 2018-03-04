import {OptionType} from "../OptionType";

export class ArrayType extends OptionType
{
    public static getName(): string
    {
        return "array";
    }

    public static getEmptyValue(): Array<any>
    {
        return [];
    }

    public validateValue(value: any): void
    {
        super.validateValue(value);

        if (value && !Array.isArray(value)) {
            throw new Error(
                'Specified invalid value of option "' + this + '". ' +
                'It should be an array'
            );
        }
    }
}
