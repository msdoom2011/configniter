import {ObjectCollectionOptions} from "./ObjectCollectionOptions";
import {ICollectionConstructor} from "../Collection";
import {CollectionOption} from "../CollectionOption";
import {ObjectCollection} from "./ObjectCollection";
import {IOptionContext} from "../../OptionContext";
import {MapOption} from "../../Map/MapOption";
import {OptionType} from "../../OptionType";
import {Tools} from "../../../Tools/Tools";

export class ObjectCollectionOption extends CollectionOption
{
    private _options: ObjectCollectionOptions;

    public static getValueClass(): ICollectionConstructor
    {
        return ObjectCollection;
    }

    constructor(optionName: string, optionType: OptionType, context: IOptionContext)
    {
        super(optionName, optionType, context);
        this._options = new ObjectCollectionOptions(this);
        this._options.initialize();
    }

    public getOptions(): MapOption
    {
        return this._options.getOption('options');
    }

    public setValueOrigin(value: any, invokeParentWatchers: boolean = true): void
    {
        if (value && value.options) {
            this.getOptions().setValue(value.options, invokeParentWatchers);
            value = Tools.copy(value);
            delete value.options;
        }
        super.setValueOrigin(value, invokeParentWatchers);
    }

    public setValueDefault(value: any): void
    {
        if (value && value.options) {
            this.getOptions().setValueDefault(value.options);
            value = Tools.copy(value);
            delete value.options;
        }
        super.setValueDefault(value);
    }

    public getValueInstDefaultValues(): any
    {
        let value = this.getValue();

        if (!value) {
            return {};
        }
        let collectionItems = <any>{},
            items = value.getStorage().getItems();

        for (let itemName in items) {
            if (items.hasOwnProperty(itemName)) {
                collectionItems[itemName] = items[itemName].getValueDefault();
            }
        }

        return collectionItems;
    }
}