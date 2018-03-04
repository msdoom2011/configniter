import {IOptionDefinition, OptionType} from "../OptionType";
import {Tools} from "../../Tools/Tools";

export class BooleanType extends OptionType
{
    public static getName(): string
    {
        return "boolean";
    }

    public static getEmptyValue(): boolean
    {
        return false;
    }

    public getBaseDefinition(): IOptionDefinition
    {
        return Tools.extend(super.getBaseDefinition(), {

            /**
             * @inheritDoc
             */
            nullable: false
        });
    }

    /**
     * @inheritDoc
     */
    public validateValue(value: any): void
    {
        super.validateValue(value);

        if (value !== null && typeof value !== 'boolean') {
            throw new Error(
                'Specified invalid value of option ' + this + '. ' +
                'It should be a boolean'
            );
        }
    }
}
