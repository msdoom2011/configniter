import {ICollectionConstructor} from "../Collection";
import {CollectionOption} from "../CollectionOption";
import {ArrayCollection} from "./ArrayCollection";

export class ArrayCollectionOption extends CollectionOption
{
    public static getValueClass(): ICollectionConstructor
    {
        return ArrayCollection;
    }

    public getValueInstDefaultValues(): any
    {
        let value = this.getValue();

        if (!value) {
            return [];
        }
        type ItemInfo = {index: number, value: any};

        let itemsInfo: ItemInfo[] = [],
            items = value.getStorage().getItems();

        for (let itemName in items) {
            if (items.hasOwnProperty(itemName)) {
                itemsInfo.push({
                    index: parseInt(itemName),
                    value: items[itemName].getValueDefault()
                });
            }
        }
        itemsInfo.sort((a: ItemInfo, b: ItemInfo) => {
            if (a.index > b.index) {
                return 1;
            } else if (a.index < b.index) {
                return -1;
            } else {
                return 0;
            }
        });

        return itemsInfo.map((item: ItemInfo) => item.value);
    }

    protected isWatcherEventBuggled(newValue: any): boolean
    {
        return false;
    }
}