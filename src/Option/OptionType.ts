import {OptionLinksStorage} from "./OptionLinksStorage";
import {IOptionWatcherEvent} from "./OptionWatcherEvent";
import {IOptionContext} from "./OptionContext";
import {OptionManager} from "./OptionManager";
import {Tools} from "../Tools/Tools";
import {Option} from "./Option";

export interface IOptionDefinition
{
    [optName: string]: any;

    type: string;

    value?: any;

    link?: any;

    writable?: boolean;

    watcher?: ((event: IOptionWatcherEvent) => any) | null;

    nullable?: boolean;

    extends?: boolean;

    getter?: IOptionGetterAttrValue;

    setter?: IOptionSetterAttrValue;
}

export type IOptionGetterAttrValue = (originGetter?: () => any) => any;

export type IOptionSetterAttrValue = (value: any, originSetter?: (value: any) => any) => any;

export interface IOptionTypeConstructor
{
    new (optionManager: OptionManager, typeName: string, typeDefinition: IOptionDefinition): OptionType;

    getName: () => string;

    getOptionClass: () => typeof Option;

    getEmptyDefinition: () => IOptionDefinition;
}

export class OptionType
{
    private _manager: OptionManager;

    private _name: string;

    private _definition: IOptionDefinition;

    private _context: IOptionContext | null = null;

    private _contextType: OptionType | null = null;

    public static getName(): string
    {
        throw new Error(
            'Method getName(): string in option type class ' +
            'should be implemented!'
        );
    }

    public static getOptionClass(): typeof Option
    {
        return Option;
    }

    /**
     * Returns the empty definition of property
     *
     * @returns {(Object|boolean)}
     */
    public static getEmptyDefinition(): IOptionDefinition
    {
        return {
            type: this.getName()
        };
    }

    /**
     * Returns empty option value
     */
    public static getEmptyValue(): any
    {
        return;
    }

    constructor(optionManager: OptionManager, typeName: string, typeDefinition: IOptionDefinition)
    {
        if (!optionManager || !(optionManager instanceof OptionManager)) {
            throw new Error(
                'Specified invalid option manager argument! ' +
                'It should be an instance of OptionManager class'
            );
        }
        if (!typeName || typeof typeName !== 'string') {
            throw new Error(
                'Specified invalid option type (name)! ' +
                'It should be a string'
            );
        }
        if (!typeDefinition || !Tools.isPlainObject(typeDefinition)) {
            throw new Error(
                'Specified invalid option definition! ' +
                'It should be a plain object that is matches IOptionDefinition interface'
            );
        }
        this._name = typeName;
        this._manager = optionManager;
        this._definition = typeDefinition;
    }

    public initialize(): void
    {
        this.validateDefinition();
        this.processDefinition();
    }

    /**
     * Returns property manager instance
     *
     * @returns {Subclass.Property.PropertyManager}
     */
    public getManager(): OptionManager
    {
        return this._manager;
    }

    /**
     * Returns the name of data type
     *
     * @returns {*}
     */
    public getType(): string
    {
        return (<typeof OptionType>this.constructor).getName();
    }

    /**
     * Returns the name of property
     *
     * @returns {string}
     */
    public getName(): string
    {
        return this._name;
    }

    /**
     * Returns property name with names of context property
     *
     * @returns {string}
     */
    public getNameFull(): string
    {
        const propertyName = this.getName();
        const contextProperty = this.getContextType();
        let contextPropertyName = "";

        if (contextProperty) {
            contextPropertyName = contextProperty.getNameFull();
        }

        return (contextPropertyName && contextPropertyName + "." || "") + propertyName;
    }

    protected getCompatibleTypes(): string[]
    {
        return [(<typeof OptionType>this.constructor).getName()];
    }

    public isCompatible(typeDef: OptionType): boolean
    {
        return this.getCompatibleTypes().indexOf(typeDef.getType()) >= 0;
    }

    /**
     * Returns property definition
     *
     * @returns {Object}
     */
    public getDefinition(): IOptionDefinition
    {
        return this._definition;
    }

    /**
     * Sets the context class
     *
     * @param {Object} contextObject
     */
    public setContext(contextObject: IOptionContext | null): void
    {
        this._context = contextObject;
    }

    /**
     * Returns the context class
     *
     * @returns {Object}
     */
    public getContext(): IOptionContext | null
    {
        return this._context;
    }

    /**
     * Sets the context property
     *
     * @param {OptionType} contextType
     */
    public setContextType(contextType: OptionType | null): void
    {
        this._contextType = contextType;
    }

    /**
     * Returns the context property
     *
     * @returns {OptionType}
     */
    public getContextType(): OptionType
    {
        return this._contextType;
    }

    /**
     * Creates the instance of property
     *
     * @param {string} optionName
     * @param {IOptionContext} [context]
     * @returns {Option}
     */
    public create<T extends Option>(optionName: string, context: IOptionContext): T
    {
        const constructor = <typeof OptionType>this.constructor;
        const optionConstructor = constructor.getOptionClass();
        const optionInst = <T>new optionConstructor(optionName, this, context);

        this.getLink() && optionInst.addLink(this.getLink());
        this.getValue() !== undefined && optionInst.setValueDefault(this.getValue());
        optionInst.initialize();

        return optionInst;
    }


    // =================================== VALUE ATTRIBUTE =================================

    /**
     * Validates "value" attribute value
     */
    public validateValue(value: any): void
    {
        if (value === null && !this.isNullable()) {
            throw new Error('The property ' + this + ' is not nullable.');
        }
    }

    /**
     * Sets the property value
     */
    public setValue(value: any): void
    {
        if (OptionLinksStorage.isLink(value)) {
            return this.setLink(value);
        }

        this.validateValue(value);
        this.getDefinition().value = value;
    }

    /**
     * Returns property value
     *
     * @returns {*}
     */
    public getValue(generateIfEmpty: boolean = false): any
    {
        let value = this.getDefinition().value;

        if (value === undefined && generateIfEmpty) {
            return this.generateValue();
        }
        return value;
    }

    /**
     * Returns empty property value
     *
     * @return {(null|*)}
     */
    public getEmptyValue(): any
    {
        return (<typeof OptionType>this.constructor).getEmptyValue();
    }

    public generateValue(): any
    {
        return this.getEmptyValue();
    }

    /**
     * Checks if property contains empty value
     *
     * @returns {boolean}
     */
    public isValueEmpty(value: any): boolean
    {
        return Tools.isEqual(this.getEmptyValue(), value);
    }


    // =================================== VALUE ATTRIBUTE =================================

    /**
     * Validates "link" attribute value
     *
     * @param {*} link
     */
    public validateLink(link: any): void
    {
        if (link !== null && !OptionLinksStorage.isLink(link)) {
            throwInvalidOptionError('link', this, 'a string');
        }
    }

    /**
     * Sets the option link
     */
    public setLink(link: string): void
    {
        this.validateLink(link);
        this.getDefinition().link = link;
    }

    /**
     * Returns option link
     *
     * @returns {*}
     */
    public getLink(): any
    {
        return this.getDefinition().link;
    }


    // ================================== WATCHER ATTRIBUTE ================================

    /**
     * Validates "watcher" attribute value
     *
     * @param {*} watcher
     */
    public validateWatcher(watcher: ((event: IOptionWatcherEvent) => any) | null): void
    {
        if (watcher !== null && typeof watcher !== 'function') {
            throwInvalidOptionError('watcher', this, 'a function or null');
        }
    }

    /**
     * Sets property watcher
     *
     * @param {(Function|null)} watcher
     */
    public setWatcher(watcher: ((event: IOptionWatcherEvent) => any) | null): void
    {
        this.validateWatcher(watcher);
        this.getDefinition().watcher = watcher;
    }

    /**
     * Returns watcher function or null
     *
     * @returns {(Function|null)}
     */
    public getWatcher(): ((event: IOptionWatcherEvent) => any) | null | undefined
    {
        return this.getDefinition().watcher;
    }


    // ================================= WRITABLE ATTRIBUTE ================================

    /**
     * Validates "writable" attribute value
     *
     * @param {*} isWritable
     */
    public validateWritable(isWritable: boolean): void
    {
        if (typeof isWritable !== 'boolean') {
            throwInvalidOptionError('writable', this, 'a boolean');
        }
    }

    /**
     * Set marker if current property is writable
     *
     * @param {boolean} isWritable
     */
    public setWritable(isWritable: boolean): void
    {
        this.validateWritable(isWritable);
        this.getDefinition().writable = isWritable;
    }

    /**
     * Checks if current property is writable
     *
     * @returns {boolean}
     */
    public getWritable(): boolean
    {
        return this.getDefinition().writable;
    }

    /**
     * @alias Subclass.Property.PropertyDefinition
     */
    public isWritable(): boolean
    {
        return this.getWritable();
    }


    // ================================= NULLABLE ATTRIBUTE ================================

    /**
     * Validates "nullable" attribute value
     *
     * @param {*} isNullable
     */
    public validateNullable(isNullable: boolean): void
    {
        if (typeof isNullable !== 'boolean') {
            throwInvalidOptionError('nullable', this, 'a boolean');
        }
    }

    /**
     * Sets "nullable" attribute value
     *
     * @param {(boolean|null)} isNullable
     */
    public setNullable(isNullable: boolean): void
    {
        this.validateNullable(isNullable);
        this.getDefinition().nullable = isNullable;
    }

    /**
     * Checks if current property can store null value
     *
     * @returns {boolean}
     */
    public getNullable(): boolean
    {
        return this.getDefinition().nullable;
    }

    public isNullable(): boolean
    {
        return this.getNullable();
    }


    // ================================== EXTENDS ATTRIBUTE ================================

    /**
     * Validates "extends" attribute value
     *
     * @param {*} isExtends
     */
    public validateExtends(isExtends: boolean): void
    {
        if (typeof isExtends !== 'boolean') {
            throwInvalidOptionError('extends', this, 'a boolean');
        }
    }

    /**
     * Set marker if current property extends property
     * with the same name from the parent class
     *
     * @param {boolean} isExtends
     */
    public setExtends(isExtends: boolean): void
    {
        this.validateExtends(isExtends);
        this.getDefinition().extends = isExtends;
    }

    /**
     * Checks if current property extends property
     * with the same name from the parent class
     *
     * @returns {boolean}
     */
    public getExtends(): boolean
    {
        return this.getDefinition().extends;
    }

    /**
     * @alias {Subclass.Property.PropertyDefinition#getExtends}
     */
    public isExtends(): boolean
    {
        return this.getExtends();
    }


    // ================================== GETTER ATTRIBUTE ================================

    /**
     * Validates "getter" attribute value
     */
    public validateGetter(getter: IOptionGetterAttrValue): void
    {
        if (getter !== null && typeof getter !== 'function') {
            throwInvalidOptionError('getter', this, 'a function');
        }
    }

    /**
     * Sets "getter" attribute value
     *
     * @param {IOptionGetterAttrValue} getter
     */
    public setGetter(getter: IOptionGetterAttrValue): void
    {
        this.validateGetter(getter);
        this.getDefinition().getter = getter;
    }

    /**
     * Returns "getter" attribute value
     *
     * @returns {IOptionGetterAttrValue}
     */
    public getGetter(): IOptionGetterAttrValue
    {
        return this.getDefinition().getter;
    }


    // ================================== SETTER ATTRIBUTE ================================

    /**
     * Validates "setter" attribute value
     */
    public validateSetter(setter: IOptionSetterAttrValue): void
    {
        if (setter !== null && typeof setter !== 'function') {
            throwInvalidOptionError('setter', this, 'a function');
        }
    }

    /**
     * Sets "setter" attribute value
     *
     * @param {IOptionSetterAttrValue} setter
     */
    public setSetter(setter: IOptionSetterAttrValue): void
    {
        this.validateSetter(setter);
        this.getDefinition().setter = setter;
    }

    /**
     * Returns "setter" attribute value
     *
     * @returns {IOptionSetterAttrValue}
     */
    public getSetter(): IOptionSetterAttrValue
    {
        return this.getDefinition().setter;
    }


    // ================================ PROCESSING DEFINITION ==============================

    /**
     * Returns attributes that are required to filling
     *
     * @returns {string[]}
     */
    public getRequiredAttributes(): string[]
    {
        return ["type"];
    };

    /**
     * Modifies class definition
     *
     * @returns {object}
     */
    public getBaseDefinition(): IOptionDefinition
    {
        return {

            /**
             * Type of property data
             *
             * @type {string}
             */
            type: (<typeof OptionType>this.constructor).getName(),

            /**
             * Default value of option.
             * It is also possible specify link value using "value" attribute
             *
             * @type {*}
             */
            value: undefined,

            /**
             * Allows specify link to another option value.
             *
             * It is extremely useful when option should have by default
             * the same value as someone else specific option.
             *
             * To be recognized as a link value it should be a string
             * and match the pattern: /^\$(?:\.\/)?((?:\.{2}\/)*)([$.a-z0-9_-]+)(\?priority=[-\d]+)?\$$/i
             *
             * Values examples:
             *
             *     // matches the absolute path of option
             *     // "color" then contains in "bar" in "foo"
             *     // options
             *
             *     "$foo.bar.color$
             *
             *     // matches option value with name "color"
             *     // that is a sibling of current option
             *
             *     "$./color$"
             *
             *     // matches option value with name "color"
             *     // that contains in parent option relative
             *     // to current option
             *
             *     "$../color$"
             *
             *     // matches option value with name "color"
             *     // that contains in parent of parent option
             *     // relative to current option
             *
             *     "$../../color$
             *
             * Also it is possible specify priority of specified link value
             * by adding '?priority=number' to the end of link value.
             *
             * By Default priority is 0.
             *
             * Values examples:
             *
             *      "$foo.bar.color?priority=-1000"
             *      "$foo.bar.color?priority=20"
             *
             * @example
             *
             * let mapOptDef = { type: "map", schema: {
             *     color: { type: "string", value: "#999" },
             *     textColor: { type: "string", link: "$color$",
             *     label: { type: "map", schema: {
             *         color: { type: "string", link: "$../color$" }
             *     }
             * }
             */
            link: null,

            /**
             * Defines whether or not current option value can be changed
             *
             * @type {boolean}
             */
            writable: true,

            /**
             * Callback function that triggers when trying to set property value.
             *
             * It takes three arguments:
             * - the new value;
             * - the old value of property;
             * - the current property object instance
             *
             * Pay attention, that you may access current property context
             * directly in watcher function (it may be the class instance
             * or the map type property etc.) where this one is defined
             * using by "this" property.
             *
             * @type {(function|null)}
             */
            watcher: null,

            /**
             * Indicates that current property can hold null value or not.
             *
             * If null as a value of current parameter was specified it means
             * that value of current parameter will defined in accordance with
             * the default settings of each property type.
             *
             * @type {(boolean|null)}
             */
            nullable: true,

            /**
             * Influences on behaviour of property definition when the class
             * to which it belongs, extends another class which contains
             * property with the same name.
             *
             * If it's true the property definition in child class should
             * extend the property with the same name in parent class.
             * Otherwise the the definition in child should replace definition
             * of the same property in parent class by the new definition.
             *
             * @type {boolean}
             */
            extends: false,

            /**
             * A function which will be called instead default option value getter
             *
             * It takes one argument:
             *  - originGetter  {() => any}  To get option value you can call
             *                               origin getter function without arguments
             */
            getter: null,

            /**
             * A function which will be called instead default option value setter
             *
             * It takes two arguments:
             *   - newValue      {any}                   The new option value
             *   - originSetter  {(value: any) => void}  To set option value you can call
             *                                           origin setter function with
             *                                           the single value argument
             */
            setter: null
        };
    };

    /**
     * Validating property definition
     */
    public validateDefinition(): void
    {
        let requiredAttrs = this.getRequiredAttributes(),
            definition = this.getDefinition();

        for (let attrName of requiredAttrs) {
            let optName = attrName;

            if (!definition.hasOwnProperty(optName)) {
                throw new Error(
                    'Missed required option "' + optName + '" ' +
                    'in definition of the property ' + this + '.'
                );
            }
        }
    }

    /**
     * Processing property definition
     */
    public processDefinition(): void
    {
        let definition = Tools.copy(this.getDefinition());
        this._definition = this.getBaseDefinition();

        for (let attrName in definition) {
            if (!definition.hasOwnProperty(attrName) || attrName === 'value') {
                continue;
            }
            let setterMethod = "set" + attrName[0].toUpperCase() + attrName.substr(1);

            if (setterMethod in this) {
                (<any>this)[setterMethod](definition[attrName] as any);
            }
        }

        // Setting value

        if (definition.hasOwnProperty('value')) {
            this.setValue(definition.value);
        }
    }

    /**
     * Return string implementation of property
     *
     * @returns {string}
     */
    public toString(): string
    {
        let propertyName = this.getNameFull(),
            contextClassName = this.getContext()
                ? (' in context object "' + this.getContext().toString() + '"')
                : "";

        return 'definition "' + propertyName + '"' + contextClassName;
    };
}

function throwInvalidOptionError(optName: string, optionType: OptionType, expected: string): void
{
    throw new Error(
        'Specifeid invalid "' + optName + '" parameter value in definition of option ' + optionType + '. ' +
        'It should be ' + expected
    );
}