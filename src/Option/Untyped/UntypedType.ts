import {OptionType} from "../OptionType";

export class UntypedType extends OptionType
{
    public static getName(): string
    {
        return "untyped";
    }

    public static getEmptyValue(): any
    {
        return null;
    }
}
