import { ObjectCollectionType } from "./Collection/ObjectCollection/ObjectCollectionType";
import { ArrayCollectionType } from "./Collection/ArrayCollection/ArrayCollectionType";
import { OptionType, IOptionTypeConstructor, IOptionDefinition } from "./OptionType";
import { FunctionType } from "./Function/FunctionType";
import { BooleanType } from "./Boolean/BooleanType";
import { UntypedType } from "./Untyped/UntypedType";
import { IOptionContext } from "./OptionContext";
import { StringType } from "./String/StringType";
import { NumberType } from "./Number/NumberType";
import { ObjectType } from "./Object/ObjectType";
import { ArrayType } from "./Array/ArrayType";
import { MixedType } from "./Mixed/MixedType";
import { ClassType } from "./Class/ClassType";
import { EnumType } from "./Enum/EnumType";
import { MapType } from "./Map/MapType";
import { Tools } from "../Tools/Tools";

export class OptionManager
{
    private static _types: { [typeName: string]: IOptionTypeConstructor } = {};

    private _types: { [typeName: string]: OptionType } = {};

    private _typeDefinitions: { [typeName: string]: IOptionDefinition } = {};

    public static getTypes(): { [typeName: string]: IOptionTypeConstructor }
    {
        return this._types;
    }

    public static registerType(typeConstructor: IOptionTypeConstructor): void
    {
        if (!typeConstructor || !typeConstructor.getName) {
            throw new Error(
                'Specified invalid constructor of option data type. ' +
                'It should contain at least static method getType(): string'
            );
        }

        this._types[typeConstructor.getName()] = typeConstructor;
    }

    public static getType(typeName: string): IOptionTypeConstructor
    {
        if (!this.hasType(typeName)) {
            throw new Error(
                'Trying to get not registered option ' +
                'data type "' + typeName + '"'
            );
        }

        return this._types[typeName];
    }

    public static hasType(typeName: string): boolean
    {
        return this._types.hasOwnProperty(typeName);
    }

    public static isOptionDefinition(optionDefinition: any): boolean
    {
        if (
            Tools.isPlainObject(optionDefinition)
            && 'type' in optionDefinition
            && typeof optionDefinition.type === 'string'
        ) {
            if (!this.hasType(optionDefinition.type)) {
                console.warn(
                    'The object "' + optionDefinition.type + '" has been recognized as an option definition ' +
                    'as it has a "type" parameter. But this type isn\'t registered in option manager'
                );
            }

            return true;
        }

        return false;
    }

    public constructor(customOptionTypes: { [typeName: string]: IOptionDefinition } = {})
    {
        this.initializeTypeDefinitions(customOptionTypes);
        this.initializeTypes();
    }

    private initializeTypeDefinitions(customOptionTypes: { [typeName: string]: IOptionDefinition } = {}): void
    {
        const baseTypes = (<typeof OptionManager>this.constructor).getTypes();
        const baseTypeDefinitions = <any>{};

        for (const typeName in baseTypes) {
            if (!baseTypes.hasOwnProperty(typeName)) {
                continue;
            }

            const definition = baseTypes[typeName].getEmptyDefinition();

            if (definition) {
                baseTypeDefinitions[typeName] = definition;
            }
        }

        this._typeDefinitions = Tools.extend(baseTypeDefinitions, customOptionTypes);
    }

    private initializeTypes(): void
    {
        let typeDefinitions = this.getTypeDefinitions();

        // Initializing type definitions

        for (const typeName in typeDefinitions) {
            if (!typeDefinitions.hasOwnProperty(typeName)) {
                continue;
            }

            const typeDefinition = Tools.copy(typeDefinitions[typeName]);

            this._types[typeName] = this.createType(typeName, typeDefinition);
        }
    }

    /**
     * Validates data type definitions
     *
     * @param {Object.<Object>} definitions
     * @throws {Error}
     */
    public validateTypeDefinitions(definitions: { [optName: string]: IOptionDefinition }): void
    {
        try {
            if (!Tools.isPlainObject(definitions)) {
                throw 'error';
            }

            for (const typeName in definitions) {
                if (!definitions.hasOwnProperty(typeName)) {
                    continue;
                }

                if (!Tools.isPlainObject(definitions[typeName])) {
                    throw 'error';
                }
            }

        } catch (e) {
            if (e === 'error') {
                throw new Error(
                    'Specified invalid option definitions! ' +
                    'It should be a plain object that contains option definitions.'
                );

            } else {
                throw e;
            }
        }
    }

    /**
     * Adds new type definitions
     *
     * @param {Object.<IOptionDefinition>} definitions
     */
    public addTypeDefinitions(definitions: { [optName: string]: IOptionDefinition }): void
    {
        this.validateTypeDefinitions(definitions);

        for (const typeName in definitions) {
            if (definitions.hasOwnProperty(typeName)) {
                this._typeDefinitions[typeName] = definitions[typeName];
            }
        }
    }

    /**
     * Returns definitions of custom types
     *
     * @returns {Object<IOptionDefinition>}
     */
    public getTypeDefinitions(): { [typeName: string]: IOptionDefinition }
    {
        return this._typeDefinitions;
    }

    /**
     * Returns definition of data type
     *
     * @param {string} typeName
     * @returns {Object}
     * @throws {Error}
     */
    public getTypeDefinition(typeName: string): IOptionDefinition
    {
        if (!this.hasType(typeName)) {
            throw new Error('Trying to get definition of non existent data type "' + typeName + '".');
        }

        return this.getTypeDefinitions()[typeName];
    }

    /**
     * Returns data types
     *
     * @returns {Object}
     */
    public getTypes(): { [typeName: string]: OptionType }
    {
        return this._types;
    }

    /**
     * Returns data type instance
     *
     * @param {string} typeName
     * @returns {OptionType}
     */
    public getType(typeName: string): OptionType
    {
        if (!this.hasType(typeName)) {
            throw new Error('Trying to get definition of non existent data type "' + typeName + '".');
        }

        return this.getTypes()[typeName];
    }

    /**
     * Checks if specified data type exists
     *
     * @param {string} typeName
     * @returns {boolean}
     */
    public hasType(typeName: string): boolean
    {
        return this.getTypeDefinitions().hasOwnProperty(typeName);
    }

    /**
     * Creates instance of specified type property
     *
     * @param {string} typeName
     *      A name of the property.
     *
     * @param {IOptionDefinition} typeDefinition
     *      A plain object which describes property.
     *
     * @param {*} [contextObject]
     *      A context object to which creating property will belongs to.
     *
     * @param {OptionType} [contextOptionType]
     *      A context option type instance to witch creating property will belongs to.
     *
     * @returns {OptionType}
     */
    public createType<T extends OptionType>(
        typeName: string,
        typeDefinition: IOptionDefinition,
        contextObject?: IOptionContext,
        contextOptionType?: OptionType
    ): T & OptionType
    {
        if (!Tools.isPlainObject(typeDefinition)) {
            throw new Error(
                'Tyring to create option type without specified its definition! ' +
                'It shold be a plain object that matches IOptionDefinition interface'
            );
        }

        const constructor = <typeof OptionManager>this.constructor;
        let parentTypeName = typeDefinition.type;

        if (this.hasType(parentTypeName)) {
            const parentTypeDefinition = Tools.copy(this.getTypeDefinition(parentTypeName));
            parentTypeName = parentTypeDefinition.type;

            typeDefinition = Tools.extendDeep(parentTypeDefinition, typeDefinition);
            typeDefinition.type = parentTypeName;
        }

        if (!constructor.hasType(parentTypeName)) {
            const optionFullName = (contextOptionType && contextOptionType.getNameFull() + "." || '') + typeName;

            throw new Error(
                'Trying to create option "' + optionFullName + '" of non existent type "' + parentTypeName + '"' +
                (contextObject ? ' in object "' + contextObject.toString() + '"' : '') + '.'
            );
        }

        const typeConstructor = constructor.getType(typeDefinition.type);
        const typeInst = new typeConstructor(this, typeName, typeDefinition);

        // Setting context class and property

        typeInst.setContext(contextObject || null);
        typeInst.setContextType(contextOptionType || null);
        typeInst.initialize();

        return <T & OptionType>typeInst;
    }
}

// Registering option types

OptionManager.registerType(ArrayType);
OptionManager.registerType(BooleanType);
OptionManager.registerType(ClassType);
OptionManager.registerType(ArrayCollectionType);
OptionManager.registerType(ObjectCollectionType);
OptionManager.registerType(EnumType);
OptionManager.registerType(FunctionType);
OptionManager.registerType(MapType);
OptionManager.registerType(MixedType);
OptionManager.registerType(NumberType);
OptionManager.registerType(ObjectType);
OptionManager.registerType(StringType);
OptionManager.registerType(UntypedType);
