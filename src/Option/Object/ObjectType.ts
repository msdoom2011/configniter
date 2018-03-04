import {OptionType} from "../OptionType";
import {Tools} from "../../Tools/Tools";

export class ObjectType extends OptionType
{
    public static getName(): string
    {
        return "object";
    }

    public static getEmptyValue(): any
    {
        return {};
    }

    public validateValue(value: any): void
    {
        super.validateValue(value);

        if (value !== null && !Tools.isPlainObject(value)) {
            throw new Error(
                'Specified invalid value of option "' + this + '". ' +
                'It should be a plain object'
            );
        }
    }
}