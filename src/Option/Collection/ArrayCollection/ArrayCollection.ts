import {ICollectionStorageConstructor} from "../CollectionStorage";
import {ArrayCollectionStorage} from "./ArrayCollectionStorage";
import {OptionMultiple} from "../../OptionMultiple";
import {CollectionType} from "../CollectionType";
import {Tools} from "../../../Tools/Tools";
import {Collection} from "../Collection";
import {Option} from "../../Option";

export class ArrayCollection extends Collection
{
    /**
     * Returns constructor of collection items class
     *
     * @returns {typeof CollectionStorage}
     */
    public static getCollectionStorageClass(): ICollectionStorageConstructor
    {
        return ArrayCollectionStorage;
    }

    public validateItems(items: Array<any>): void
    {
        if (!Array.isArray(items)) {
            throw new Error(
                'Specified invalid value of array collection option ' + this.getOption() + '! ' +
                'It should be and array'
            );
        }
    };

    public addItems(items: Array<any>): void
    {
        if (!Array.isArray(items)) {
            throw new Error(
                'Specified invalid new value while adding new items to array collection option ' + this.getOption() + '. ' +
                'It should be an array'
            );
        }
        for (let key in items) {
            if (items.hasOwnProperty(key)) {
                this.add(items[key]);
            }
        }
    }

    public add(value?: any): void
    {
        if (arguments.length === 2) {
            value = arguments[1];
        }
        if (arguments.length) {
            let collectionTypeDef = <CollectionType>this.getOption().getTypeDefinition();
            collectionTypeDef.getProtoTypeDefinition().validateValue(value);
        }
        this.getStorage().add(String(this.getLength()), value);
    }

    public setItems(items: Array<any>): void
    {
        if (!Array.isArray(items)) {
            throw new Error(
                'Specified invalid argument while setting items to array collection option ' + this.getOption() + '. ' +
                'It should be an array'
            );
        }
        this.removeItems();

        for (let i = 0; i < items.length; i++) {
            this.add(items[i]);
        }
    }

    public set(value: any[]): void
    public set(key: number, value: any): void
    public set(key?: any, value?: any): void
    {
        if (arguments.length === 1) {
            return this.getOption().setValue(key, this.isParentWatchersInvoking());
        }
        let index = parseInt(String(key));

        if (isNaN(index)) {
            throw new Error(
                'Specified invalid value while setting item to array collection option ' + this.getOption() + '. ' +
                'It should be a number'
            );
        }
        if (this.length < index) {
            for (let i = this.length; i < index; i++) {
                this.add();
            }
        }
        return super.set(String(index), value);
    }

    /**
     * @inheritDoc
     */
    public get(): ArrayCollection
    public get(index: number): any
    public get(index?: any): any
    {
        if (!arguments.length) {
            return this;
        }
        if (!this.has(index)) {
            throw new Error(
                'Trying to get non existent array element with index "' + index + '" ' +
                'in array collection option ' + this.getOption() + '.'
            );
        }
        return this.getStorage().get(String(index)).getValue();
    }

    /**
     * Removes collection items
     *
     * @param {number} [indexStart]
     *      The index of collection item from which (including it)
     *      the other collection items further will be removed
     *
     * @param {number} [length]
     *      The length of collection items which will be removed
     *      from the indexStart (including collection item with start index)
     */
    public removeItems(indexStart?: number, length?: number): void
    {
        if (!arguments.length) {
            return super.removeItems();
        }
        if (!this.has(indexStart)) {
            return;
        }
        if (arguments.length === 1) {
            length = this.length;
        }
        if (length < 0) {
            throw new Error(
                'Specified invalid length of removing items in array collection option ' + this.getOption() + '! ' +
                'It should be a positive number'
            );
        }
        const indexEnd = indexStart + length - 1;

        if (indexEnd >= this.length - 1) {
            for (let i = this.length - 1; i >= indexStart; i--) {
                this.remove(i);
            }
        } else {
            for (let i = 0; i < length; i++) {
                this.remove(indexStart);
            }
        }
    }

    /**
     * Removes item with specified key from collection
     *
     * @param {number} key
     */
    public remove(key: number): void
    {
        const index = parseInt(String(key));
        const storage = this.getStorage();
        const items = storage.getItems();
        const length = this.length;

        this.forEach((itemValue: any, itemIndex: number) => {
            if (itemIndex === index) {
                super.remove(String(index));

            } else if (itemIndex > index) {
                const newIndex = String(itemIndex - 1);
                const itemProperty = storage.get(String(itemIndex));

                itemProperty.rename(newIndex);
                items[newIndex] = itemProperty;
            }
        });

        if (this.length === length) {
            this.pop();
        }
    }

    /**
     * @inheritDoc
     */
    public has(key: number): boolean
    {
        return this.getStorage().has(String(key));
    }

    /**
     * @alias Subclass.Property.Type.Collection.ArrayCollection#add
     */
    public push(value: any): void
    {
        this.add(value);
    }

    /**
     * Removes from array and returns the last item in collection
     *
     * @returns {(*|null)}
     */
    public pop(): any
    {
        const length = this.length;

        if (!length) {
            return;
        }
        return this.remove(length - 1);
    }

    /**
     * Removes from array and returns the first item in collection
     *
     * @returns {(*|null)}
     */
    public shift(): any
    {
        const length = this.length;

        if (!length) {
            return;
        }
        return this.remove(0);
    }

    /**
     * Adds new item to the start of array
     */
    public unshift(value: any): void
    {
        const storage = this.getStorage();
        const items = storage.getItems();

        this.forEach((itemValue: any, itemIndex: number) => {
            let newKey = String(itemIndex + 1),
                itemProperty = storage.get(String(itemIndex));

            itemProperty.rename(newKey);
            items[newKey] = itemProperty;
        }, true);

        storage.remove('0');
        this.set(0, value);
    }

    /**
     * Searches item in collection by the value or by the result of test function
     *
     * @param {(function|*)} value
     *      If value will passed then searching
     *      will compare specified value with value of every collection item
     *      until match is not successful.
     *
     *      If function will passed then every collection item value will
     *      tests by this testing function until it not returns true.
     *
     * @param {boolean} reverse
     *      If specified the searching item will start from the end of collection
     *
     * @returns {boolean}
     */
    public indexOf(value: any, reverse: boolean = false): number
    {
        const testCallback = typeof value === 'function' ? value : false;
        let key = -1;

        this.forEach((itemValue: any, itemKey: number, item: Option) => {
            if ((
                    testCallback
                    && (<Function> testCallback)(itemValue, itemKey, item) === true
                ) || (
                    !testCallback
                    && value === itemValue
                )
            ) {
                key = itemKey;
                return false;
            }
        }, reverse);

        return key;
    }

    /**
     * Searches item from the end of collection
     *
     * @param {*} value
     * @returns {number}
     */
    public lastIndexOf(value: any): number
    {
        return this.indexOf(value, true);
    }

    /**
     * Joins the elements of array collection into a string
     *
     * @param {string} separator
     * @returns {(*|string)}
     */
    public join(separator: string): string
    {
        let items = this.getData();
        return items.join.apply(items, arguments);
    }

    /**
     * Swaps collection items
     *
     * @param {number} key1
     * @param {number} key2
     */
    public swap(key1: number, key2: number): void
    {
        let storage = this.getStorage(),
            items = storage.getItems(),
            extraIndex = this.getLength(),
            index1 = parseInt(String(key1)),
            index2 = parseInt(String(key2));

        // Renaming item with index1 to extraIndex

        let itemProperty1 = storage.get(String(index1));
        itemProperty1.rename(String(extraIndex));
        items[String(extraIndex)] = itemProperty1;

        // Renaming item with index2 to index1

        let itemProperty2 = storage.get(String(index2));
        itemProperty2.rename(String(index1));
        items[String(index1)] = itemProperty2;

        // Renaming item with extraIndex to index2

        let itemPropertyExtra = storage.get(String(extraIndex));
        itemPropertyExtra.rename(String(index2));
        items[String(index2)] = itemPropertyExtra;

        // Removing collection item with extraIndex

        this.remove.call(this, extraIndex);
    }

    /**
     * Changes the order of array collection items to opposite
     */
    public reverse(): void
    {
        let length = this.getLength(),
            lengthHalf = Math.ceil(length / 2);

        this.forEach((itemValue: any, itemIndex: number) => {
            if (itemIndex >= lengthHalf) {
                return false;
            }
            let oppositeIndex = length - itemIndex - 1;
            this.swap(itemIndex, oppositeIndex);
        });
    }

    /**
     * Sorts items
     *
     * @param {Function} [compareFn]
     */
    public sort(compareFn?: (a: any, b: any) => number): void
    {
        let items: Array<any> = [],
            itemsOrder: Array<any> = [],
            orderedIndexes = [];

        this.forEach((item: any, index: number) => {
            items[index] = item;
            itemsOrder[index] = item;
        });

        items.sort.apply(items, arguments);

        for (let i = 0; i < items.length; i++) {
            let newIndex = i,
                oldIndex = itemsOrder.indexOf(items[i]);

            if (
                orderedIndexes.indexOf(newIndex) >= 0
                || orderedIndexes.indexOf(oldIndex) >= 0
            ) {
                continue;
            }
            orderedIndexes.push(newIndex);
            orderedIndexes.push(oldIndex);
            this.swap(newIndex, oldIndex);
        }
    }

    /**
     * Selects a part of an array, and returns the new array with selected items
     *
     * @param {number} start
     * @param {number} end
     * @returns {Array}
     */
    public slice(start: number, end: number): Array<any>
    {
        let items: Array<any> = [];

        this.forEach((item: any, index: number) => {
            items[index] = item;
        });

        return items.slice.apply(items, arguments);
    };

    /**
    * Filters collection using passed callback function
    *
    * @param testCallback
    * @returns {(Array|Object)}
    */
    public filter(testCallback: (value: any, index: number, item: Option) => any): Array<any>
    {
        if (!testCallback || typeof testCallback !== 'function') {
            throw new Error(
                'Specified invalid filter testing callback! ' +
                'It should be a function'
            );
        }
        let items: Array<any> = [];

        this.forEach((itemValue: any, itemIndex: number, item: Option) => {
            if (testCallback(itemValue, itemIndex, item) === true) {
                items.push(itemValue);
            }
        });

        return items;
    };

    /**
     * Sorts out all collection items using passed callback function
     *
     * @param {boolean} [reverse]
     * @param {Function} callback
     */
    public forEach(callback: (value: any, index: number, item: Option) => any, reverse: boolean = false): void
    {
        if (typeof callback !== 'function') {
            throw new Error(
                'Specified invalid forEach callback! ' +
                'It should be a function'
            );
        }
        if (reverse !== true) {
            reverse = false;
        }
        let storage = this.getStorage();
        let keys = Object
            .keys(storage.getItems())
            .map((key: string) => parseInt(key))
        ;
        keys.sort();

        if (reverse) {
            keys.reverse();
        }
        keys.every((index: number) => {
            return callback(storage.get(String(index)).getValue(), index, storage.get(String(index))) !== false
        });
    }

    public getData<T>(valuesOnly: boolean = false): Array<T>
    {
        const items = this.getStorage().getItems();
        const data: any = [];
        let i = 0;

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

            data[i] = valueData !== undefined ? valueData : valueDefault;

            if (
                valuesOnly
                && item instanceof OptionMultiple
                && typeof data[i] === 'object'
                && Tools.isEmpty(data[i])
            ) {
                data.pop();
                i--;
            }
            i++;
        }

        return data;
    }
}