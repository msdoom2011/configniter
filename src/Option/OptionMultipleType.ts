import {OptionType, IOptionDefinition} from "./OptionType";
import {Option} from "./Option";

export abstract class OptionMultipleType extends OptionType
{
    public static getOptionClass(): typeof Option
    {
        throw new Error(
            'The multiple option type should specify its own ' +
            'class for Option instances'
        );
    }

    public static getEmptyDefinition(): IOptionDefinition
    {
        return null;
    }

    public isCompatible(typeDef: OptionType): boolean
    {
        if (!super.isCompatible(typeDef)) {
            return false;
        }

        const testDef = <OptionMultipleType>typeDef;
        const testChildren = testDef.getChildrenTypeDefinitions();
        const currentChildren = this.getChildrenTypeDefinitions();

        let lessNumberChildren = currentChildren;
        let moreNumberChildren = testChildren;

        if (Object.keys(currentChildren).length > Object.keys(testChildren).length) {
            moreNumberChildren = currentChildren;
            lessNumberChildren = testChildren;
        }

        for (let childName in lessNumberChildren) {
            if (!lessNumberChildren.hasOwnProperty(childName)) {
                continue;
            }

            const testChild = moreNumberChildren[childName];

            if (!testChild) {
                return false;
            }

            if (!lessNumberChildren[childName].isCompatible(testChild)) {
                return false;
            }
        }

        return true;
    }

    abstract getChildrenTypeDefinitions(): { [propName: string]: OptionType };

    abstract getChildTypeDefinition<T extends OptionType>(childName: string): T;

    abstract findChildTypeDefinition<T extends OptionType>(optionName: string): T;
}