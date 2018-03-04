import {OptionMultipleType} from "../OptionMultipleType";
import {CollectionOption} from "./CollectionOption";
import {OptionMultiple} from "../OptionMultiple";
import {IOptionContext} from "../OptionContext";
import {CollectionType} from "./CollectionType";
import {Collection} from "./Collection";
import {Tools} from "../../Tools/Tools";
import {Option} from "../Option";

export interface ICollectionStorageConstructor
{
    new (collection: Collection): CollectionStorage;
}

export class CollectionStorage implements IOptionContext
{
    /**
     * @type {Collection}
     * @private
     */
    protected _collection: Collection;

    /**
     * @type {Object<Option>}
     * @private
     */
    protected _items: { [optName: string]: Option } = {};

    /**
     * @constructor
     * @param {Collection} collection
     */
    constructor(collection: Collection)
    {
        this._collection = collection;
    }

    public initialize(defaultItems?: { [itemName: string]: any }): void
    {
        if (defaultItems && Tools.isPlainObject(defaultItems)) {
            for (let itemName in defaultItems) {
                if (defaultItems.hasOwnProperty(itemName)) {
                    this.add(itemName, defaultItems[itemName]);
                }
            }
        }
    }

    public getOptions(): { [optName: string]: Option }
    {
        return this._items;
    }

    /**
     * Returns the instance of current option or the instance of its items
     */
    public getOption(): CollectionOption;
    public getOption<T extends Option>(itemKey: string): T;
    public getOption<T extends Option>(itemKey?: string): any
    {
        if (!arguments.length) {
            return this._collection.getOption();
        }

        const parts = itemKey.split('.');
        let option: any = this.getOption();

        if (parts.length === 1) {
            return <T>this._items[itemKey];
        }

        for (let i = 0; i < parts.length; i++) {
            if (!(option instanceof OptionMultiple)) {
                return;
            }

            const optionValueInst = (<OptionMultiple<any> & any>option).getValue();
            const part = parts[i];

            if (!optionValueInst) {
                return;
            }

            option = optionValueInst.getOption(part);
        }

        return <T>option;
    }

    /**
     * Checks whether the item option with specified name is exists
     *
     * @param {string} itemKey
     *      The name of child option
     *
     * @returns {boolean}
     */
    public hasOption(itemKey: string): boolean
    {
        const parts = itemKey.split('.');
        let optionTypeDef: any;

        if (parts.length === 1) {
            return itemKey in this._items;
        }

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (i === 0) {
                optionTypeDef = this.getOption(part).getTypeDefinition();
                continue;
            }

            if (!(optionTypeDef instanceof OptionMultipleType)) {
                return false;
            }

            optionTypeDef = optionTypeDef.getChildTypeDefinition(part);
        }
    }

    /**
     * Returns the type of children context
     *
     * @returns {string}
     */
    public getContextType(): string
    {
        return 'option';
    }

    public add(option: Option): void;
    public add(key: string, value: any): void;
    public add(key: string|Option, value?: any): void
    {
        if (typeof key === 'string') {
            if (this.has(key)) {
                throw new Error(
                    'Trying to add to collection item ' +
                    'with already existent key "' + key + '"'
                );
            }

            const collectionTypeDefinition = <CollectionType>this.getOption().getTypeDefinition();
            const collectionItemProtoDefinition = collectionTypeDefinition.getProtoTypeDefinition();

            this._items[key] = collectionItemProtoDefinition.create(key, this);
            this._items[key].attach(this);

            if (
                value !== undefined
                && !this._items[key].getLinksStorage().getAll().length
                && value !== null
            ) {
                this._items[key].setValueDefault(value);
            }

        } else {
            const option = key;

            option.setContext(this);

            if (this.has(option.getName())) {
                throw new Error(
                    'Trying to add to collection item ' +
                    'with already existent key "' + option.getName() + '"'
                );
            }

            this._items[option.getName()] = option;
            this._items[option.getName()].attach(this);
        }
    }

    /**
     * Returns all map option children
     *
     * @returns {Object<Option>}
     */
    public getItems(): {[optName: string]: Option}
    {
        return this._items;
    }

    /**
     * Returns collection item option
     *
     * @param {string} key
     * @returns {Option}
     */
    public get<T extends Option>(key: string): T
    {
        return <T>this.getOption(key);
    }

    /**
     * Checks whether collection item with specified key exists
     *
     * @param {(string)} key
     * @returns {boolean}
     */
    public has(key: string): boolean
    {
        return this.hasOption(key);
    }

    /**
     * Removes the collection item
     *
     * @param {string} key
     */
    public remove(key: string): void
    {
        if (this._items[key]) {
            this._items[key].detach();
        }

        delete this._items[key];
    }

    /**
     * Removes all collection items
     */
    public removeItems(): void
    {
        for (let key in this._items) {
            if (this._items.hasOwnProperty(key)) {
                this.remove(key);
            }
        }
    }

    /**
     * Returns the count of items in collection
     *
     * @returns {Number}
     */
    public getLength(): number
    {
        return Object.keys(this._items).length;
    }
}