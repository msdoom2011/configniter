import {ICollectionStorageConstructor, CollectionStorage} from "./CollectionStorage";
import {OptionMultipleValue} from "../OptionMultipleValue";
import {CollectionOption} from "./CollectionOption";
import {OptionMultiple} from "../OptionMultiple";
import {Tools} from "../../Tools/Tools";
import {Option} from "../Option";

export interface ICollectionConstructor
{
    new (option: CollectionOption): Collection;
}

export abstract class Collection extends OptionMultipleValue
{
    public length: number;

    /**
     * Instance of items collection manager
     *
     * @type {Object<CollectionStorage>}
     * @protected
     */
    protected _storage: CollectionStorage;

    /**
     * Whether parent option watchers should be invoked
     * after changing values of collection items
     *
     * @type {boolean}
     * @protected
     */
    protected _invokeParentWatchers: boolean = true;

    /**
     * Returns constructor of collection items class
     *
     * @returns {typeof CollectionStorage}
     */
    public static getCollectionStorageClass(): ICollectionStorageConstructor
    {
        return CollectionStorage;
    }

    /**
     * @constructor
     * @param {CollectionOption} option
     */
    constructor(option: CollectionOption)
    {
        super(option);
        this._storage = this.createStorage();

        Object.defineProperty(this, 'length', {
            set: (value: any) => {},
            get: () => this.getLength()
        });
    }

    public getOptions(): { [optName: string]: Option }
    {
        return this.getStorage().getItems();
    }

    public getOption(optName?: string|number): any
    {
        if (!arguments.length) {
            return this._option;
        }
        return this.getStorage().get(String(optName));
    }

    public hasOption(optName: string|number): boolean
    {
        return this.getStorage().has(String(optName));
    }

    /**
     * Resets the collection items creating the new collection items class instance
     *
     * @private
     */
    public createStorage(): CollectionStorage
    {
        let itemsConstructor = (<typeof Collection>this.constructor).getCollectionStorageClass();
        return new itemsConstructor(this);
    }

    public getStorage(): CollectionStorage
    {
        return this._storage;
    }

    public startParentWatchersInvoking(): void
    {
        this._invokeParentWatchers = true;
    }

    public stopParentWatchersInvoking(): void
    {
        this._invokeParentWatchers = false;
    }

    public isParentWatchersInvoking(): boolean
    {
        return this._invokeParentWatchers;
    }

    /**
     * Validates collection items
     *
     * @throws {Error}
     *      Throws error if specified value is invalid
     *
     * @param {*} items
     * @returns {boolean}
     */
    abstract validateItems(items: any): void;

    /**
     * Adds new item to collection
     */
    abstract add(...args: Array<any>): void;

    /**
     * Adds new items to collection
     *
     * @param {Object} items
     */
    abstract addItems(items: any): void;

    /**
     * Sets collection item. If item with specified key already exists, it will be replaced.
     */
    public set(value: any): void
    public set(key: any, value: any): void
    public set(key: any, value?: any): void
    {
        if (arguments.length === 1) {
            return this.getOption().setValue(key, this.isParentWatchersInvoking());
        }
        if (!key) {
            throw new Error(
                'Trying to set value using invalid key "' + key + '" in option ' + this.getOption() + '. ' +
                'It should be either string or number.'
            );
        }
        let firstKeyPart = String(key).match(/^[$a-z0-9_-]+/i)[0],
            storage = this.getStorage();

        if (!this.has(firstKeyPart)) {
            storage.add(String(key), value);
        }
        this
            .getOption(Object.keys(OptionMultiple.convertValueToObject(key, value))[0])
            .setValue(value, this.isParentWatchersInvoking())
        ;
    }

    /**
     * Sets collection items. If items with specified keys already exist, they will be replaced.
     *
     * @param items
     */
    abstract setItems(items: any): void

    /**
     * Replaces collection items by the new items
     *
     * @param {Object} items
     */
    public replaceItems(items: any): void
    {
        this.validateItems(items);
        this.removeItems();
        this.setItems(items);
    }

    /**
     * Removes item with specified key from collection
     *
     * @param {(number|string)} key
     */
    public remove(key: string|number): void
    {
        this.getStorage().remove(String(key));
    }

    /**
     * Removes and returns all items from collection
     *
     * @returns {Object}
     */
    public removeItems(): void
    {
        this._storage = this.createStorage();
    }

    /**
     * Sorts out all collection items using passed callback function
     *
     * @param {Function} callback
     *      Function that will perform each collection item
     */
    abstract forEach(callback: (value?: any, key?: number|string, item?: Option) => any): void;

    /**
     * Filters collection using passed callback function.
     *
     * @param {function} testCallback
     *      The callback function. The first argument is item value.
     *      The second is item key. If this callback function will
     *      return TRUE then current item will put into filter result.
     *
     * @returns {Object}
     */
    abstract filter(testCallback: (value: any, key: number|string, item?: Option) => any): any;

    /**
     * Searches collection items by specified options
     *
     * @param {*} options
     *      It can be a whole value or just a part of value.
     *
     *      For example, if this is collection of strings
     *      then you can specify some string value
     *      which is contained in this collection.
     *
     *      Example:
     *      let result = stringCollection.find('str1');
     *
     *      If this is, for example, collection of map objects
     *      then you can specify a plain object with
     *      allowed by map property keys and its values what you
     *      searching for, something like this:
     *
     *      let result = mapCollection.find({ opt1: val1, opt2: val2 });
     *
     * @returns {Object}
     */
    public find(options: {[propName: string]: any}): any
    {
        const storage = this.getStorage();

        return this.filter((value: any, key: string|number) => {
            const item = storage.get(String(key));
            const itemData = item.getValueData();

            if (Tools.isPlainObject(options)) {
                for (let optionName in options) {
                    if (
                        !options.hasOwnProperty(optionName)
                        || itemData[optionName] !== options[optionName]
                    ) {
                        return false;
                    }
                }

                return true;

            } else if (Tools.isEqual(itemData, options)) {
                return true;
            }

            return false;
        });
    }

    /**
     * Returns length of collection
     *
     * @returns {Number}
     */
    public getLength(): number
    {
        return this.getStorage().getLength();
    }
}