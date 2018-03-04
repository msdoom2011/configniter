import {OptionLinksStorage} from "../OptionLinksStorage";
import {OptionType, IOptionDefinition} from "../OptionType";
import {OptionMultipleType} from "../OptionMultipleType";
import {Tools} from "../../Tools/Tools";
import {MapOption} from "./MapOption";
import {Option} from "../Option";

export interface IMapOptionDefinition extends IOptionDefinition
{
    schema: { [optName: string]: IOptionDefinition };
}

export class MapType extends OptionMultipleType
{
    private _children: { [optName: string]: OptionType} = {};

    public static getName(): string
    {
        return "map";
    }

    public static getOptionClass(): typeof Option
    {
        return MapOption;
    }

    public static getEmptyValue(): any
    {
        return {};
    }

    /**
     * Returns list of children properties instances
     *
     * @returns {Object}
     */
    public getChildren(): { [optName: string]: OptionType}
    {
        return this._children;
    }

    /**
     * Adds children property to current
     *
     * @param {string} childName
     * @param {Object} childDefinition
     * @returns {Subclass.Property.PropertyType}
     */
    public addChild<T extends OptionType>(childName: string, childDefinition: IOptionDefinition): T & OptionType
    {
        return this._children[childName] = this.getManager().createType<T>(
            childName,
            childDefinition,
            this.getContext(),
            this
        );
    }

    /**
     * Returns children property instance
     *
     * @param {string} childPropName
     * @returns {Subclass.Property.PropertyType}
     */
    public getChild<T extends OptionType>(childPropName: string): T
    {
        return <T>this._children[childPropName];
    }

    /**
     * Checks if child property with specified name was registered
     *
     * @param {string} childPropName
     * @returns {boolean}
     */
    public hasChild(childPropName: string): boolean
    {
        return this._children.hasOwnProperty(childPropName);
    }

    public getChildrenTypeDefinitions(): { [propName: string]: OptionType }
    {
        return this.getChildren();
    }

    public getChildTypeDefinition<T extends OptionType>(childPropName: string): T
    {
        return this.getChild<T>(childPropName);
    }

    public findChildTypeDefinition<T extends OptionType>(optionName: string): T
    {
        const optNameParts = optionName.split('.');
        const childType = this.getChildTypeDefinition(optNameParts.shift());

        if (optNameParts.length === 0) {
            return <T>childType;
        }

        if (!(childType instanceof OptionMultipleType)) {
            return;
        }

        return <T>childType.findChildTypeDefinition(optNameParts.join('.'));
    }

    public validateValue(value: any): void
    {
        super.validateValue.call(this, value);

        let error = false;

        if (!value && this.isNullable() && value !== null) {
            error = true;
        }

        if (
            !error
            && value
            && (
                typeof value !== 'object'
                || !Tools.isPlainObject(value)
            )
        ) {
            error = true;
        }

        if (!error) {
            for (let propName in value) {
                if (!value.hasOwnProperty(propName)) {
                    continue;
                }
                if (!this.hasChild(propName)) {
                    let childrenProps = this.getChildren();

                    throw new Error(
                        'Trying to set not registered property "' + propName + '" ' +
                        'to not extendable map option ' + this + '. ' +
                        'Allowed properties are: "' + Object.keys(childrenProps).join('", "') + '".'
                    );

                } else if (!OptionLinksStorage.isLink(value[propName])) {
                    this
                        .getChild(propName)
                        .validateValue(value[propName])
                    ;
                }
            }
        }

        if (error) {
            throw new Error(
                'Specified invalid value of option ' + this + '. ' +
                'It should be a plain object'
            );
        }
    }

    public setValue(value: any): void
    {
        super.setValue(value);

        if (
            value !== null
            && !OptionLinksStorage.isLink(value)
        ) {
            for (let propName in value) {
                if (value.hasOwnProperty(propName)) {
                    this.getChild(propName).setValue(value[propName]);
                }
            }
        }
    }

    public getValue(generateIfEmpty: boolean = false, collectData: boolean = false): object
    {
        let value = super.getValue(generateIfEmpty);

        if (!collectData || value === null) {
            return value;
        }

        value = value || {};

        const children = this.getChildren();

        for (let childName in children) {
            if (!children.hasOwnProperty(childName)) {
                continue;
            }

            const childValue = children[childName].getValue(collectData);

            if (!Tools.isEmpty(childValue) || typeof childValue === 'boolean') {
                value[childName] = childValue;
            }
        }

        return value;
    }

    /**
     * Validates "schema" attribute value
     *
     * @param {*} schema
     */
    public validateSchema(schema: { [optName: string]: IOptionDefinition }): void
    {
        if (
            !schema
            || typeof schema !== 'object'
            || !Tools.isPlainObject(schema)
        ) {
            throw new Error(
                'Specifeid invalid value of "schema" property in definition of option ' + this + '. ' +
                'It should be a plain object with definitions of properties'
            );
        }
    }

    /**
     * Sets property schema
     *
     * @param {Object} schema
     */
    public setSchema(schema: { [optName: string]: IOptionDefinition }): void
    {
        this.validateSchema(schema);
        (<IMapOptionDefinition>this.getDefinition()).schema = schema;

        this._children = {};

        for (let optName in schema) {
            if (!schema.hasOwnProperty(optName)) {
                continue;
            }
            if (!this.isWritable()) {
                schema[optName].writable = false;
            }
            this.addChild(optName, schema[optName]);
        }
    }

    /**
     * Returns schema function or null
     *
     * @returns {Object}
     */
    public getSchema(): { [optName: string]: IOptionDefinition }
    {
        return (<IMapOptionDefinition>this.getDefinition()).schema;
    }

    public getRequiredAttributes(): string[]
    {
        return super.getRequiredAttributes().concat(['schema']);
    }

    public getBaseDefinition(): IOptionDefinition
    {
        return Tools.extend(super.getBaseDefinition(), {

            /**
             * Defines available properties in value
             * @type {null}
             */
            schema: null,

            /**
             * @inheritDoc
             */
            nullable: false
        });
    }
}