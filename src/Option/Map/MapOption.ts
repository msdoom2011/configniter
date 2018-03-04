import {OptionMultipleType} from "../OptionMultipleType";
import {OptionMultiple} from "../OptionMultiple";
import {OptionType} from "../OptionType";
import {Tools} from "../../Tools/Tools";
import {MapType} from "./MapType";
import {Map} from "./Map";

export class MapOption extends OptionMultiple<Map>
{
    private _backupValue: Map;

    public static getValueClass(): typeof Map
    {
        return Map;
    }

    /**
     * Creates map instance
     */
    public createValueInst(): Map
    {
        const valueClass = (<typeof MapOption>this.constructor).getValueClass();
        const mapConstructor = class MapValue extends valueClass {};
        const map = new mapConstructor(this);

        map.initialize();

        return map;
    }

    public initializeValueInst(map: Map, defaultValues: any = {}): Map
    {
        type OrderedChild = { priority: number, optionName: string, optionType: OptionType };

        const childrenDefinitions = (<MapType>this.getTypeDefinition()).getChildren();
        const childrenOrdered: Array<OrderedChild> = [];
        const children: any = {};

        for (let childName in childrenDefinitions) {
            if (childrenDefinitions.hasOwnProperty(childName)) {
                childrenOrdered.push({
                    priority: childrenDefinitions[childName] instanceof OptionMultipleType ? 0 : 100,
                    optionType: childrenDefinitions[childName],
                    optionName: childName
                });
            }
        }

        childrenOrdered.sort((a: OrderedChild, b: OrderedChild) => {
            if (a.priority > b.priority) {
                return -1;

            } else if (a.priority < b.priority) {
                return 1;

            } else {
                return 0;
            }
        });

        for (let child of childrenOrdered) {
            children[child.optionName] = child.optionType.create(child.optionName, map);

            map.addChild(
                child.optionName,
                children[child.optionName],
                defaultValues[child.optionName]
            );
        }

        return Object.seal(map);
    }

    public getValueInstDefaultValues(): any
    {
        const value = this.getValue();

        if (!value) {
            return {};
        }

        const children = value.getChildren();
        const data: any = {};

        for (let propName in children) {
            if (children.hasOwnProperty(propName)) {
                data[propName] = children[propName].getValueDefault();
            }
        }

        return data;
    }

    public setValueOrigin(value: any, invokeParentWatchers: boolean = true): void
    {
        if (this.isLocked()) {
            return console.warn(
                'Trying to set new value for the ' +
                'option ' + this + ' that is locked for write.'
            );
        }

        const oldValue = this.getValueData(true);
        const newValue = value;
        let changed = false;

        this.setValueData(newValue);

        if (Tools.isPlainObject(newValue) && Tools.isPlainObject(oldValue)) {
            for (let propName in newValue) {
                if (
                    newValue.hasOwnProperty(propName)
                    && !Tools.isEqual(newValue[propName], oldValue[propName])
                ) {
                    changed = true;
                    break;
                }
            }

        } else {
            changed = !Tools.isEqual(oldValue, newValue);
        }

        // Invoking watchers

        if (changed) {
            this.invokeValueWatchers(
                newValue,
                oldValue,
                !Tools.isEmpty(newValue),
                invokeParentWatchers
            );
        }

        if (newValue === null || oldValue === null) {
            const linkedOptions = this.getLinkedOptions();

            for (let linkedOption of linkedOptions) {
                if (linkedOption !== this) {
                    linkedOption.setValue(newValue, invokeParentWatchers);
                }
            }
        }
    }

    public setValueData(value: any): void
    {
        this.getTypeDefinition().validateValue(value);

        if (Tools.isPlainObject(value)) {
            if (this._backupValue) {
                this._value = this._backupValue;
            }

            if (!this._value) {
                this._value = this.createValueInst();
                this._value = this.initializeValueInst(this._value);
            }

            for (let childName in value) {
                if (value.hasOwnProperty(childName)) {
                    this._value.getOption(childName).setValue(
                        value[childName],
                        false
                    );
                }
            }

        } else {
            if (value === null) {
                this._backupValue = this._value;
            }

            this._value = value;
        }
    }

    public getValueLinked(): any
    {
        const linkedValue = super.getValueLinked();

        if (
            linkedValue
            && typeof linkedValue === 'object'
            && linkedValue instanceof Map
        ) {
            const defaultData = (<MapType>this.getTypeDefinition()).getValue(false, true);
            const linkedData = linkedValue.getData(true);

            if (!defaultData) {
                return linkedData;
            }

            return Tools.extendDeep(
                Tools.copy(defaultData),
                linkedData
            );
        }

        return linkedValue;
    }
}