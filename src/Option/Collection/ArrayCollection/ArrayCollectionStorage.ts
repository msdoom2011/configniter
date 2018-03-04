import {CollectionStorage} from "../CollectionStorage";

export class ArrayCollectionStorage extends CollectionStorage
{
    public initialize(defaultItems?: any[] | { [itemName: string]: any }): void
    {
        const data: any = {};

        if (Array.isArray(defaultItems)) {
            for (let i = 0; i < defaultItems.length; i++) {
                data[String(i)] = defaultItems[i];
            }
        }

        super.initialize(data);
    }
}