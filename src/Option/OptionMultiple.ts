import {IOptionMultipleValueConstructor, OptionMultipleValue} from "./OptionMultipleValue";
import {OptionLinksStorage} from "./OptionLinksStorage";
import {ILinkParams} from "./OptionLinksStorage";
import {Option} from "./Option";

export abstract class OptionMultiple<ValueClassT extends OptionMultipleValue> extends Option
{
    public static getValueClass(): IOptionMultipleValueConstructor
    {
        throw new Error(
            'The static method OptionMultiple.getValueClass() is abstract ' +
            'and should be implemented!'
        );
    }

    public static convertValueToObject(optionName: any, optionValue: any): any
    {
        return getOptValue(String(optionName).split(/[\.\[\]]/));

        function getOptValue(parts: string[]): any {
            const optName = parts.shift();

            if (!optName) {
                return optionValue;
            }

            if (optName.match(/^\d+$/)) {
                return (<any[]>[])[parseInt(optName)] = getOptValue(parts);
            }

            return { [optName]: getOptValue(parts) };
        }
    }

    /**
     * Creates the collection instance
     */
    public createValueInst(): ValueClassT
    {
        const valueClass = (<typeof OptionMultiple>this.constructor).getValueClass();

        return <ValueClassT>new valueClass(this);
    }

    abstract initializeValueInst(value: ValueClassT, defaultValue?: any): ValueClassT;

    abstract getValueInstDefaultValues(): any;

    /**
     * Returns properties default value
     *
     * @returns {*}
     */
    public getValueDefault(isRawData: boolean = false): any
    {
        if (isRawData) {
            return this._valueDefault;
        }

        if (this._valueDefault === null) {
            return null;
        }

        const value = this.getValue();

        if (!value) {
            return this.getTypeDefinition().generateValue();
        }

        return this.getValueInstDefaultValues();
    }

    public setValueDefault(valueDefault: any): void
    {
        super.setValueDefault(valueDefault);

        if (!valueDefault) {
            return;
        }

        if (!this.getValue(true)) {
            return;
        }

        type ItemInfo = { priority: number, item: Option, itemName: string };

        const children = this.getValue().getOptions();
        const childrenInfo: Array<ItemInfo> = [];

        for (let childName in children) {
            if (children.hasOwnProperty(childName) && valueDefault.hasOwnProperty(childName)) {
                childrenInfo.push({
                    priority: children[childName] instanceof OptionMultiple ? 0 : 100,
                    item: children[childName],
                    itemName: childName
                });
            }
        }

        childrenInfo.sort((a: ItemInfo, b: ItemInfo) => {
            if (a.priority > b.priority) {
                return -1;

            } else if (a.priority < b.priority) {
                return 1;

            } else {
                return 0;
            }
        });

        for (let childInfo of childrenInfo) {
            childInfo.item.setValueDefault(valueDefault[childInfo.itemName]);
        }
    }

    public getValueOrigin(): ValueClassT
    {
        if (this._value === undefined) {
            let valueDefault = this._valueDefault;

            if (valueDefault === undefined) {
                valueDefault = <OptionMultipleValue>super.getValueDefault();

                if (
                    valueDefault
                    && typeof valueDefault === 'object'
                    && valueDefault instanceof OptionMultipleValue
                ) {
                    valueDefault = valueDefault.getData(true);
                }
            }

            if (!valueDefault && !this._value) {
                return valueDefault;
            }

            this._value = this.createValueInst();
            this._value = this.initializeValueInst(this._value, valueDefault);
        }

        if (this._value === undefined) {
            throw new Error(
                'Something went wrong! ' +
                'The value of option ' + this + ' can\'t be undefined!'
            );
        }

        return this._value;
    }

    public addLink(linkValue: string, linkParams: ILinkParams = {}): void
    {
        super.addLink(linkValue, linkParams);

        if (!this.getValue(true)) {
            return;
        }

        const parsedLinkValue = OptionLinksStorage.parseLink(linkValue);
        linkValue = parsedLinkValue.value;

        const sourceOpt = this.getLinksStorage().findOption(linkValue).option;
        const children = this.getValue().getOptions();
        const valuePath = linkValue.replace(/^\$(\.\/)?|\$$/g, '');

        if (!sourceOpt) {
            throw new Error(
                `Trying set invalid default value link "${linkValue}" to option ${this}. ` +
                `The option "${linkValue}" doesn't exist` +
                `${linkValue.match(/^\$\./) ? ' relative up to current option' : ''}`
            );
        }

        if (!this.isCompatible(sourceOpt)) {
            throw new Error(
                `Trying to set default link value "${linkValue}" to incompatible option ` +
                `in option ${this}`
            );
        }

        for (let childName in children) {
            if (children.hasOwnProperty(childName)) {
                const childLinkValue = '$' + (parsedLinkValue.relative ? '../' : '') + valuePath + '.' + childName + '$';

                children[childName].addLink(childLinkValue, parsedLinkValue.params);
            }
        }
    }

    abstract setValueOrigin(value: any, invokeParentWatchers?: boolean): void;

    abstract setValueData(value: any): void;

    /**
     * Returns data only of property value
     *
     * @returns {Object}
     */
    public getValueData(valuesOnly: boolean = false): any
    {
        const value = this.getValue();

        if (!value) {
            return value;
        }

        return value.getData(valuesOnly);
    }
}