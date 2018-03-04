import {OptionType, IOptionDefinition} from "../OptionType";
import {Tools} from "../../Tools/Tools";

export interface IEnumOptionDefinition extends IOptionDefinition
{
    allows: Array<number|string|boolean>;
}

export class EnumType extends OptionType
{
    public static getName(): string
    {
        return "enum";
    }

    public static getEmptyDefinition(): IOptionDefinition
    {
        return null;
    }

    public getEmptyValue(): number|string|boolean
    {
        return this.getAllows()[0];
    }

    public validateValue(value: any): void
    {
        super.validateValue(value);

        if (value === null || value === undefined) {
            return;
        }
        let allows = this.getAllows();

        if (allows.indexOf(value) < 0) {
            throw new Error(
                'Specified invalid value of option "' + this + '". ' +
                'It should be one of the specified values [' + allows.join(", ") + ']'
            );
        }
    }

    /**
     * Validates "allows" attribute value
     *
     * @param {*} allows
     */
    public validateAllows(allows: Array<string|number|boolean>): void
    {
        if (!allows || !Array.isArray(allows) || !allows.length) {
            throw new Error(
                'Specifeid invalid value of "allows" property in definition of option ' + this + '. ' +
                'It should be a not empty array with items of a certain types: "string", "number", "boolean" or null.'
            );
        }

        let allowedTypes = ['string', 'number', 'boolean'];

        for (let value of allows) {
            if (allowedTypes.indexOf(typeof value) < 0 && value !== null) {
                throw new Error(
                    'Specified not valid values in "allows" parameter in definition of option ' + this + '. ' +
                    'Allowed types are: ' + allowedTypes.join(", ") + '" or null.'
                );
            }
        }
    }

    /**
     * Sets "allows" attribute of property definition
     *
     * @param {Array} allows
     */
    public setAllows(allows: Array<string|number|boolean>): void
    {
        this.validateAllows(allows);
        (<IEnumOptionDefinition>this.getDefinition()).allows = allows;
    }

    /**
     * Returns value of "allows" attribute of property definition
     *
     * @returns {Array}
     */
    public getAllows(): Array<number|string|boolean>
    {
        return (<IEnumOptionDefinition>this.getDefinition()).allows;
    }

    /**
     * @inheritDoc
     */
    public getRequiredAttributes(): string[]
    {
        return super.getRequiredAttributes().concat(['allows']);
    }

    public isCompatible(typeDef: OptionType): boolean
    {
        if (!super.isCompatible(typeDef)) {
            return false;
        }
        let testDef = <EnumType>typeDef,
            testAllowedValues = testDef.getAllows(),
            currentAllowedValues = this.getAllows();

        if (currentAllowedValues.length !== testAllowedValues.length) {
            return false;

        } else if (Tools.unique(currentAllowedValues.concat(testAllowedValues)).length !== currentAllowedValues.length) {
            return false;
        }
        return true;
    }

    /**
     * @inheritDoc
     */
    public getBaseDefinition(): IOptionDefinition
    {
        return Tools.extend(super.getBaseDefinition(), {

            /**
             * Allows to specify allowed property values.
             * Every value in array must belongs to one of the types: "number", "string", "boolean"
             *
             * @type {Array}
             */
            allows: null
        });
    }
}
