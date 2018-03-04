import {OptionType, IOptionDefinition} from "../OptionType";
import {Tools} from "../../Tools/Tools";

export interface IMixedOptionDefinition extends IOptionDefinition
{
    allows: Array<IOptionDefinition>
}

export class MixedType extends OptionType
{
    /**
     * Array of data types
     *
     * @type {Array}
     * @private
     */
    private _allowedTypes: Array<OptionType> = [];

    public static getName(): string
    {
        return "mixed";
    }

    public static getEmptyDefinition(): IOptionDefinition
    {
        return null;
    }

    public getEmptyValue(): any
    {
        let allowedTypes = this.getAllowedTypes();

        if (!allowedTypes.length) {
            return;
        }

        return allowedTypes[0].getEmptyValue();
    }

    /**
     * Returns property instances according to allows parameter of property definition.
     *
     * @returns {OptionType[]}
     */
    public getAllowedTypes(): Array<OptionType>
    {
        return this._allowedTypes;
    }

    /**
     * Adds new allowed type that property can holds
     *
     * @param typeDefinition
     */
    public addAllowedType(typeDefinition: IOptionDefinition): void
    {
        if (typeDefinition.hasOwnProperty('value')) {
            console.warn(
                'The "value" attribute in description of allowed types ' +
                'in option ' + this + ' was ignored!'
            );
        }

        if (this.hasAllowedType(typeDefinition.type)) {
            throw new Error(
                'Unable specify several allowed type definitions ' +
                'of the same type in option ' + this
            );
        }

        this._allowedTypes.push(this.getManager().createType(
            "mixedOption",
            Tools.extend(typeDefinition, { nullable: true, value: null }),
            this.getContext(),
            this
        ));
    }

    public getAllowedType(typeName: string): OptionType
    {
        for (let typeDef of this._allowedTypes) {
            if (typeDef.getType() === typeName) {
                return typeDef;
            }
        }
    }

    public hasAllowedType(typeName: string): boolean
    {
        return !!this.getAllowedType(typeName);
    }

    /**
     * @inheritDoc
     */
    public validateValue(value: any): void
    {
        super.validateValue(value);

        if (value === null) {
            return;
        }

        const allowedTypes = this.getAllowedTypes();
        let error = true;

        for (let allowedType of allowedTypes) {
            try {
                allowedType.validateValue(value);
                error = false;
                break;

            } catch (e) {
                // Do nothing
            }
        }

        if (error) {
            throw new Error(
                'Specified invalid value of option "' + this + '". ' +
                'It should be one of the specified types: "' + this.getAllowsNames().join('", "') + '"'
            );
        }
    }

    /**
     * Validates "allows" attribute value
     *
     * @param {*} allows
     */
    public validateAllows(allows: Array<IOptionDefinition>): void
    {
        if (!allows || !Array.isArray(allows) || !allows.length) {
            throw new Error(
                'Specifeid invalid value of "allows" property in definition of option ' + this + '. ' +
                'It should be a not empty array with definitions of needed property types'
            );
        }

        for (let optDef of allows) {
            if (!Tools.isPlainObject(optDef)) {
                throw new Error(
                    'Specified not valid values in "allows" property in definition of option ' + this + '. ' +
                    'It must be an array of option definitions.'
                );
            }
        }
    }

    /**
     * Sets "allows" attribute of property definition
     *
     * @param {Array} allows
     */
    public setAllows(allows: Array<IOptionDefinition>): void
    {
        this.validateAllows(allows);

        (<IMixedOptionDefinition>this.getDefinition()).allows = allows;
    }

    /**
     * Returns value of "allows" attribute of property definition
     *
     * @returns {Array}
     */
    public getAllows(): Array<IOptionDefinition>
    {
        return (<IMixedOptionDefinition>this.getDefinition()).allows;
    }

    /**
     * Returns all allowed value types according to allows parameter of property definition.
     *
     * @returns {string[]}
     */
    public getAllowsNames(): string[]
    {
        const allows = this.getAllows();
        const typeNames = [];

        for (let optDef of allows) {
            typeNames.push(optDef.type);
        }

        return typeNames;
    }

    public getRequiredAttributes(): string[]
    {
        return super.getRequiredAttributes().concat(['allows']);
    }

    public isCompatible(typeDef: OptionType): boolean
    {
        if (!super.isCompatible(typeDef)) {
            return false;
        }

        const testDef = <MixedType>typeDef;
        const testAllowedTypes = testDef.getAllowedTypes();
        const currentAllowedTypes = this.getAllowedTypes();

        if (currentAllowedTypes.length !== testAllowedTypes.length) {
            return false;
        }

        for (let allowedTypeDef of currentAllowedTypes) {
            const testAllowedTypeDef = testDef.getAllowedType(allowedTypeDef.getType());

            if (!testAllowedTypeDef) {
                return false;
            }

            if (!allowedTypeDef.isCompatible(testAllowedTypeDef)) {
                return false;
            }
        }

        return true;
    }

    public getBaseDefinition(): IOptionDefinition
    {
        return Tools.extend(super.getBaseDefinition(), {

            /**
             * Allows to specify allowed types of property value.
             * Every value in array must be property definition of needed type
             *
             * @type {Object[]}
             */
            allows: []
        });
    }

    public processDefinition(): void
    {
        const allows = this.getAllows();

        if (allows && Array.isArray(allows)) {
            for (let optDef of allows) {
                if (Tools.isPlainObject(optDef)) {
                    this.addAllowedType(optDef);
                }
            }
        }

        const defaultValue = this.getValue();

        if (defaultValue === null && !this.isNullable()) {
            this.setValue(this.getEmptyValue);
        }

        super.processDefinition();
    }
}