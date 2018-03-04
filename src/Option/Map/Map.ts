import {OptionMultipleValue} from "../OptionMultipleValue";
import {OptionMultipleType} from "../OptionMultipleType";
import {OptionMultiple} from "../OptionMultiple";
import {ILink} from "../OptionLinksStorage";
import {Tools} from "../../Tools/Tools";
import {MapOption} from "./MapOption";
import {Option} from "../Option";

export class Map extends OptionMultipleValue
{
    [optName: string]: any; 

    private _children: {[propName: string]: Option} = {};

    public addChild(childName: string, childOption: Option, defaultValue?: any): void
    {
        const links = this.getOption().getLinksStorage().getAll();

        this._children[childName] = childOption;
        childOption.attach(this.constructor.prototype);

        for (let link of links) {
            addChildLinkValue(childOption, link);
        }

        if (
            defaultValue !== undefined
            && !childOption.getLinksStorage().getAll().length
            && defaultValue !== null
        ) {
            childOption.setValueDefault(defaultValue);
        }

        function addChildLinkValue(child: Option, link: ILink): void {
            const linkValue = link.value;
            const linkRelative = link.value.match(/^\$\./);
            const linkPath = linkValue.replace(/^\$(\.\/)?|\$$/g, '');
            const childLinkValue = (linkRelative ? '$../' : '$') + linkPath + '.' + child.getName() + '$';

            if (child.getLinksStorage().has(childLinkValue)) {
                return;
            }

            child.addLink(
                childLinkValue,
                link.params
            );
        }
    }

    /**
     * Returns all map property children
     *
     * @returns {Object<Option>}
     */
    public getChildren(): { [optName: string]: Option }
    {
        return this._children;
    }

    public getOptions(): { [optName: string]: Option }
    {
        return this.getChildren();
    }

    /**
     * Returns the instance of current property or the instance of its child
     */
    public getOption(): MapOption;
    public getOption<T extends Option>(optName: string, searchInDefault?: boolean): T
    public getOption<T extends Option>(optName?: string, searchInDefault: boolean = false): any
    {
        if (!arguments.length) {
            return <MapOption>this._option;
        }

        const parts = optName.split('.');
        let option: any = this._option;

        if (parts.length === 1) {
            return <T>this.getChildren()[optName];
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
     * Checks whether the child property with specified name is exists
     *
     * @param {string} childName
     *      The name of child property
     *
     * @returns {boolean}
     */
    public hasOption(childName: string): boolean
    {
        const parts = childName.split('.');
        let optionTypeDef: any;

        if (parts.length === 1) {
            return childName in this;
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

        return true;
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

    /**
     * Sort out all child properties using specified callback function
     *
     * @param {function} callback
     *      The callback function which receives three arguments:
     *      - the value of child property
     *      - the name of child property
     *      - the child property
     *
     *      Each call of callback function will be invoked in the Map property context
     */
    public forEach(callback: (value?: any, optName?: string, option?: Option) => any): void
    {
        let children = this.getChildren();

        for (let childName in children) {
            if (children.hasOwnProperty(childName)) {
                const child = children[childName];

                callback.call(this, child.getValue(), childName, child);
            }
        }
    }

    /**
     * Returns data of map property
     *
     * @returns {Object}
     */
    public getData(valuesOnly: boolean = false): any
    {
        const children = this.getChildren();
        const data: any = {};

        for (let childName in children) {
            if (!children.hasOwnProperty(childName)) {
                continue;
            }

            const child = children[childName];
            const value = child.getValue(true);
            const valueDefault = child.getValueDefault(true);

            if (
                valuesOnly
                && value === undefined
                && valueDefault === undefined
            ) {
                continue;
            }

            const valueData = child.getValueData(valuesOnly);

            data[childName] = valueData !== undefined ? valueData : valueDefault;

            if (
                valuesOnly
                && child instanceof OptionMultiple
                && typeof data[childName] === 'object'
                && Tools.isEmpty(data[childName])
            ) {
                delete data[childName];
            }
        }

        return data;
    }
}