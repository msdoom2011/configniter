import {ICollectionStorageConstructor} from "../CollectionStorage";
import {ObjectCollectionStorage} from "./ObjectCollectionStorage";
import {ObjectCollectionOption} from "./ObjectCollectionOption";
import {CollectionOption} from "../CollectionOption";
import {OptionMultiple} from "../../OptionMultiple";
import {CollectionType} from "../CollectionType";
import {Tools} from "../../../Tools/Tools";
import {Collection} from "../Collection";
import {Option} from "../../Option";
import {Map} from "../../Map/Map";

export class ObjectCollection extends Collection
{
    public options: any & Map;

    public static getCollectionStorageClass(): ICollectionStorageConstructor
    {
        return ObjectCollectionStorage;
    }

    constructor(option: CollectionOption)
    {
        super(option);

        // Defining options property

        Object.defineProperty(this, 'options', {
            enumerable: false,
            set: Option.generateSetter('options'),
            get: Option.generateGetter('options')
        });
    }

    public hasOption(optName: string|number): boolean
    {
        if (optName === 'options') {
            return true;
        }
        return super.hasOption(optName);
    }

    public getOption(): CollectionOption
    public getOption(optName: string|number): Option
    public getOption(optName?: string|number): Option | CollectionOption
    {
        if (!arguments.length) {
            return this._option;
        }
        if (optName === 'options') {
            return (<ObjectCollectionOption>this._option).getOptions();
        }
        return this.getStorage().get(String(optName));
    }

    public validateItems(items: { [optName: string]: any }): void
    {
        if (!Tools.isPlainObject(items)) {
            throw new Error(
                'Specified invalid value of object collection items in option ' + this.getOption() + '. ' +
                'It should be a a plain object with option definitions'
            );
        }
    }

    /**
     * @inheritDoc
     *
     * @param {string} key
     * @param {*} value
     */
    public add(key: string, value: any): void
    {
        if (!key || typeof key !== 'string') {
            throw new Error(
                'Specified invalid key for object collection item. ' +
                'It should be a string'
            );
        }
        if (arguments.length < 2) {
            throw new Error(
                'Method Subclass.Property.Type.Collection.ObjectCollection.ObjectCollection#add ' +
                'requires at least two arguments.'
            );
        }
        if (this.has(key)) {
            throw new Error(
                'Trying to add already existent collection item with key "' + key + '" ' +
                'to option ' + this.getOption() + '.'
            );
        }
        (<CollectionType>this.getOption().getTypeDefinition())
            .getProtoTypeDefinition()
            .validateValue(value)
        ;
        this.getStorage().add(key, value);

        if (!this.has(key)) {
            throw new Error(
                'Failed to add item "' + key + '" with value "' + value + '" ' +
                'in option ' + this.getOption()
            );
        }
    }

    public addItems(items: { [propName: string]: any }): void
    {
        this.validateItems(items);

        for (const itemName in items) {
            if (items.hasOwnProperty(itemName)) {
                this.add(itemName, items[itemName]);
            }
        }
    }

    /**
     * @inheritDoc
     */
    public setItems(items: { [propName: string]: any }): void
    {
        this.validateItems(items);

        for (const itemName in items) {
            if (items.hasOwnProperty(itemName)) {
                this.set(itemName, items[itemName]);
            }
        }
    }

    /**
     * Returns all collection items keys
     *
     * @returns {string[]}
     */
    public keys(): string[]
    {
        return Object.keys(this.getStorage().getItems());
    }

    /**
     * Sorts out all collection items using passed callback function
     *
     * @param {Function} callback
     *      Function that will perform each collection item
     *
     * @param {boolean} [reverse=false]
     */
    public forEach(callback: (itemValue?: any, itemKey?: string, item?: Option) => any, reverse: boolean = false): void
    {
        type ItemsArrElem = { item: Option, itemName: string, priority: number|string };

        let storage = this.getStorage(),
            collectionTypeDef = <CollectionType>this.getOption().getTypeDefinition();

        if (collectionTypeDef.getProto().type !== 'map') {
            if (typeof callback !== 'function') {
                throw new Error(
                    'Specified invalid callback! ' +
                    'It should be a function'
                );
            }
            let items = storage.getItems();

            for (let key in items) {
                if (!items.hasOwnProperty(key)) {
                    continue;
                }
                if (callback(items[key].getValue(), key, items[key]) === false) {
                    break;
                }
            }
            return;
        }
        if (typeof callback !== 'function') {
            throw new Error('Specified invalid callback! It should be a function');
        }
        let items = storage.getItems(),
            itemsArr: Array<ItemsArrElem> = [];

        for (let itemName in items) {
            if (items.hasOwnProperty(itemName)) {
                itemsArr.push(<ItemsArrElem>{
                    item: items[itemName],
                    itemName: itemName,
                    priority: items[itemName].getValue().priority
                })
            }
        }

        itemsArr.sort(function(a: ItemsArrElem, b: ItemsArrElem): number {
            let aPriority = parseInt(<string>a.priority),
                bPriority = parseInt(<string>b.priority);

            if (aPriority > bPriority) {
                return -1;
            } else if (aPriority < bPriority) {
                return 1;
            } else {
                return 0;
            }
        });

        for (let itemInfo of itemsArr) {
            let itemValue = itemInfo.item.getValue();

            if (callback.call(this, itemValue, itemInfo.itemName, itemInfo.item) === false) {
                return;
            }
        }
    }

    public filter(testCallback: (value?: any, key?: string, item?: Option) => any): {[key: string]: any}
    {
        if (!testCallback || typeof testCallback !== 'function') {
            throw new Error(
                'Specified invalid callback! ' +
                'It should be a function'
            );
        }
        let items = <any>{};

        this.forEach((itemValue: any, itemKey: string, item: Option) => {
            if (testCallback(itemValue, itemKey, item) === true) {
                items[itemKey] = itemValue;
            }
        });

        return items;
    }

    public getData<T>(valuesOnly: boolean = false): {[propName: string]: T}
    {
        const items = this.getStorage().getItems();
        const options = this.options;
        const optionsData = options.getData(valuesOnly);
        const data: any = {};

        if (!Tools.isEmpty(optionsData)) {
            data.options = optionsData;
        }

        for (let itemKey in items) {
            if (!items.hasOwnProperty(itemKey)) {
                continue;
            }

            const item = items[itemKey];
            const value = item.getValue(true);
            const valueDefault = item.getValueDefault(true);

            if (
                valuesOnly
                && value === undefined
                && valueDefault === undefined
            ) {
                continue;
            }

            const valueData = item.getValueData(valuesOnly);

            data[itemKey] = valueData !== undefined ? valueData : valueDefault;

            if (
                valuesOnly
                && item instanceof OptionMultiple
                && typeof data[itemKey] === 'object'
                && Tools.isEmpty(data[itemKey])
            ) {
                delete data[itemKey];
            }
        }

        return data;
    }
}