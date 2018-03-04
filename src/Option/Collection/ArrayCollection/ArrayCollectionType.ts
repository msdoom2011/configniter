import {ArrayCollectionOption} from "./ArrayCollectionOption";
import {CollectionType} from "../CollectionType";
import {Option} from "../../Option"

export class ArrayCollectionType extends CollectionType
{
    public static getName(): string
    {
        return "arrayCollection";
    }

    public static getOptionClass(): typeof Option
    {
        return ArrayCollectionOption;
    }

    public static getEmptyValue(): Array<any>
    {
        return [];
    }

    public validateValue(value: any): void
    {
        super.validateValue(value);

        if (value === null) {
            return;
        }
        if (!value || typeof value !== 'object' || !Array.isArray(value)) {
            throw new Error(
                'Specified invalid value of option ' + this + '. ' +
                'It should be an array'
            );
        }

        const protoTypeDefinition = this.getProtoTypeDefinition();

        for (let optValue of value) {
            protoTypeDefinition.validateValue(optValue);
        }
    }

    public setValue(value: any): void
    {
        super.setValue(value);

        if (value === null) {
            return;
        }

        const protoTypeDefinition = this.getProtoTypeDefinition();

        for (let optValue of value) {
            protoTypeDefinition.setValue(optValue);
        }
    }
}