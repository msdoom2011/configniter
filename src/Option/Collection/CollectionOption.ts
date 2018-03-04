import {OptionMultiple} from "../OptionMultiple";
import {Collection} from "./Collection";
import {Tools} from "../../Tools/Tools";

export abstract class CollectionOption extends OptionMultiple<Collection>
{
    private _backupValue: Collection;

    public initializeValueInst(collection: Collection, defaultItems?: { [propName: string]: any }): Collection
    {
        collection.getStorage().initialize(defaultItems);
        return Object.seal(collection);
    }

    public setValueOrigin(value: any, invokeParentWatchers: boolean = true): void
    {
        if (this.isLocked()) {
            return console.warn(
                'Trying to set new value for the ' +
                'property ' + this + ' that is locked for write.'
            );
        }

        const oldValue = this.getValueData(true);
        const newValue = value;

        this.setValueData(value);

        // Invoking watchers

        if (!Tools.isEqual(oldValue, newValue)) {
            this.invokeValueWatchers(
                newValue,
                oldValue,
                this.isWatcherEventBuggled(newValue),
                invokeParentWatchers
            );
        }
    }

    public setValueData(value: any): void
    {
        this.getTypeDefinition().validateValue(value);

        if (value !== null) {
            if (this._backupValue) {
                this._value = this._backupValue;
            }

            if (!this._value) {
                this._value = this.createValueInst();
                this._value = this.initializeValueInst(this._value);
            }

            this._value.stopParentWatchersInvoking();
            this._value.setItems(value);
            this._value.startParentWatchersInvoking();

        } else {
            this._backupValue = this._value;
            this._value = null;
        }
    }

    protected isWatcherEventBuggled(newValue: any): boolean
    {
        return !Tools.isEmpty(newValue);
    }
}
