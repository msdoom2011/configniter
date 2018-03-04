import {ObjectCollectionOption} from "./ObjectCollectionOption";
import {IOptionDefinition, OptionType} from "../../OptionType";
import {ICollectionOptionDefinition} from "../CollectionType";
import {IMapOptionDefinition} from "../../Map/MapType";
import {CollectionType} from "../CollectionType";
import {Tools} from "../../../Tools/Tools";
import {MapType} from "../../Map/MapType";
import {Option} from "../../Option";

export interface IObjectCollectionOptionDefinition extends ICollectionOptionDefinition
{
    /**
     * Defines object collection options that will be applied to all collection of items.
     *
     * These options by default doesn't process by collection in any way.
     * You can use them in further manipulations with object collection.
     */
    options: {[optName: string]: IOptionDefinition };
}

export class ObjectCollectionType extends CollectionType
{
    private _optionsType: MapType;

    /**
     * @inheritDoc
     */
    public static getName(): string
    {
        return "objectCollection";
    }

    public static getOptionClass(): typeof Option
    {
        return ObjectCollectionOption;
    }

    public static getEmptyValue(): any
    {
        return {};
    }

    public getOptionsTypeDefinition(): MapType
    {
        return this._optionsType;
    }

    /**
     * Validates "options" attribute value
     *
     * @param {*} options
     */
    public validateOptions(options: {[optName: string]: IOptionDefinition}): void
    {
        if (!options || !Tools.isPlainObject(options)) {
            throw new Error(
                'Specifeid invalid value of "options" property in definition of option ' + this + '. ' +
                'It should be a plain object which contains option definitions'
            );
        }
    }

    /**
     * Sets "options" attribute value
     */
    public setOptions(options: {[optName: string]: IOptionDefinition}): void
    {
        let optionManager = this.getManager();
        this.validateOptions(options);
        (<IObjectCollectionOptionDefinition>this.getDefinition()).options = options;

        this._optionsType = optionManager.createType<MapType>(
            'options',                          // property name
            {
                type: "map",
                schema: options,                // property definition
                writable: this.isWritable()
            },
            this.getContext(),                  // context class
            this                                // context property
        );
    }

    /**
     * Returns object collection options
     */
    public getOptions(): {[optName: string]: IOptionDefinition }
    {
        return (<IObjectCollectionOptionDefinition>this.getDefinition()).options;
    }

    public findChildTypeDefinition<T extends OptionType>(optionName: string): T
    {
        const optNameParts = optionName.split('.');

        if (optNameParts[0] === 'options') {
            return this.getOptionsTypeDefinition().findChildTypeDefinition(optNameParts.slice(1).join('.'));
        }

        return super.findChildTypeDefinition<T>(optionName);
    }

    public validateValue(value: any): void
    {
        super.validateValue(value);

        if (value === null) {
            return;
        }

        if (!value || !Tools.isPlainObject(value)) {
            throw new Error(
                'Specified invalid value of option "' + this + '". ' +
                'It should be a plain object'
            );
        }

        const optionsTypeDefinition = this.getOptionsTypeDefinition();
        const protoTypeDefinition = this.getProtoTypeDefinition();

        for (let optName in value) {
            if (!value.hasOwnProperty(optName)) {
                continue;
            }

            if (optName === 'options') {
                optionsTypeDefinition.validateValue(value[optName]);
                continue;
            }

            protoTypeDefinition.validateValue(value[optName]);
        }
    }

    public setValue(value: any): void
    {
        super.setValue(value);

        if (value === null) {
            return;
        }

        const optionsTypeDefinition = this.getOptionsTypeDefinition();
        const protoTypeDefinition = this.getProtoTypeDefinition();

        for (let key in value) {
            if (!value.hasOwnProperty(key)) {
                continue;
            }

            if (key === 'options') {
                optionsTypeDefinition.setValue(value[key]);
                continue;
            }

            protoTypeDefinition.setValue(value[key]);
        }
    }

    /**
     * @inheritDoc
     */
    public getBaseDefinition(): IOptionDefinition
    {
        return Tools.extend(super.getBaseDefinition(), {

            /**
             * Collection options
             */
            options: {}
        });
    }

    /**
     * @inheritDoc
     */
    public processDefinition(): void
    {
        // Normalizing options

        let definition = <IObjectCollectionOptionDefinition>this.getDefinition(),
            options = definition.options;

        if (!options) {
            definition.options = {};
        }

        // Normalizing proto

        const proto = this.getProto();

        // Adding "priority" parameter to property "schema"
        // parameter if proto type is "map"

        if (proto.type === 'map') {
            let protoMap = <IMapOptionDefinition>proto;

            if (!protoMap.schema) {
                protoMap.schema = {};
            }
            if (!protoMap.schema.hasOwnProperty('priority')) {
                protoMap.schema['priority'] = { type: "number", nullable: false };
            }
        }

        super.processDefinition();
    }
}