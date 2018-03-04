import {OptionType, IOptionDefinition} from "../OptionType";
import {OptionMultipleType} from "../OptionMultipleType";
import {Tools} from "../../Tools/Tools";

export interface ICollectionOptionDefinition extends IOptionDefinition
{
    proto: IOptionDefinition;
}

export abstract class CollectionType extends OptionMultipleType
{
    /**
     * @type {OptionType}
     * @protected
     */
    protected _protoType: OptionType;

    /**
     * Returns the property instance of collection item
     *
     * @returns {OptionType}
     */
    public getProtoTypeDefinition(): OptionType
    {
        return this._protoType;
    }

    /**
     * Validates "proto" attribute value
     *
     * @param {*} proto
     */
    public validateProto(proto: IOptionDefinition): void
    {
        if (!proto || !Tools.isPlainObject(proto)) {
            throw new Error(
                'Specifeid invalid value of "proto" property in definition of option ' + this + '. ' +
                'It should be a plain object (an option definition)'
            );
        }
    }

    /**
     * Sets property proto
     *
     * @param {(Function|null)} proto
     */
    public setProto(proto: IOptionDefinition): void
    {
        let optionManager = this.getManager();

        this.validateProto(proto);
        (<ICollectionOptionDefinition>this.getDefinition()).proto = proto;

        if (!this.isWritable()) {
            proto.writable = false;
        }
        this._protoType = optionManager.createType(
            'collectionItem',        // property name
            proto,                   // property definition
            this.getContext(),       // context class
            this                     // context property
        );
    }

    /**
     * Returns proto function or null
     *
     * @returns {IOptionDefinition}
     */
    public getProto(): IOptionDefinition
    {
        return (<ICollectionOptionDefinition>this.getDefinition()).proto;
    }

    public getChildrenTypeDefinitions(): { [propName: string]: OptionType }
    {
        let protoTypeDef = this.getProtoTypeDefinition();

        if (protoTypeDef instanceof OptionMultipleType) {
            return protoTypeDef.getChildrenTypeDefinitions();
        }
        return {};
    }

    public getChildTypeDefinition<T extends OptionType>(childPropName: string): T
    {
        let protoTypeDef = this.getProtoTypeDefinition();

        if (protoTypeDef instanceof OptionMultipleType) {
            return protoTypeDef.getChildTypeDefinition<T>(childPropName);
        }
    }

    public findChildTypeDefinition<T extends OptionType>(optionName: string): T
    {
        const optNameParts = optionName.split('.');
        let childType = this.getChildTypeDefinition(optNameParts.shift());

        if (optNameParts.length === 0) {
            return <T>this.getProtoTypeDefinition();
        }

        if (!childType) {
            childType = this.getChildTypeDefinition(optNameParts.shift());
        }

        if (!childType || !(childType instanceof OptionMultipleType)) {
            return;
        }

        return <T>childType.findChildTypeDefinition(optNameParts.join('.'));
    }

    public getRequiredAttributes(): string[]
    {
        return super.getRequiredAttributes().concat(['proto']);
    }

    /**
     * @inheritDoc
     */
    public getBaseDefinition(): IOptionDefinition
    {
        return Tools.extend(super.getBaseDefinition(), {

            /**
             * @inheritDoc
             */
            nullable: false,

            /**
             * The definition of property to which every collection element should match.
             * @type {null}
             */
            proto: null
        });
    }
}