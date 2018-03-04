import {OptionMultipleValue} from "./OptionMultipleValue";
import {OptionMultiple} from "./OptionMultiple";
import {OptionType} from './OptionType';
import {Tools} from "../Tools/Tools";
import {Option} from "./Option";

export interface ILink
{
    value: string;

    params: any;
}

export interface ILinkParams
{
    /**
     * Priority of link value
     */
    priority?: number;
}

export interface ILinkInfo
{
    parentLevel: number;

    optionFullName: string;

    optionName: string;

    optionPath: string;

    relative: boolean;

    value: string;

    params: any;
}

export interface IFoundLinkInfo
{
    option: Option;

    info: ILinkInfo;

    params: any;
}

export class OptionLinksStorage
{
    private _option: Option;

    private _links: Array<ILink> = [];

    private _linkedOptions: Array<Option> = [];

    private _searchCache: { [linkValue: string]: IFoundLinkInfo } = {};

    private static _parseCache: { [linkValue: string]: ILinkInfo } = {};

    public static parseLink(linkValue: any): ILinkInfo
    {
        if (this._parseCache[linkValue]) {
            return this._parseCache[linkValue];
        }

        if (typeof linkValue !== 'string') {
            return;
        }

        const sourceOptResult = linkValue.match(/^\$(?:\.\/)?((?:\.{2}\/)*)([.a-z0-9_-]+)(\?priority=[-\d]+)?\$$/i);
        const params: any = {};

        if (sourceOptResult) {
            (sourceOptResult[3] || '')
                .replace(/^\?/i, '')
                .split('&')
                .map((param: string) => {
                    if (!param) {
                        return;
                    }

                    const parsedParam = param.match(/(^.+)=(.+)$/i);

                    params[parsedParam[1]] = parsedParam[2];

                    if (parsedParam[1] === 'priority') {
                        params[parsedParam[1]] = parseInt(params[parsedParam[1]]);
                    }
                })
            ;

            return this._parseCache[linkValue] = {
                parentLevel: sourceOptResult[1].length / 3,
                optionFullName: sourceOptResult[2],
                optionPath: sourceOptResult[2].replace(/\.[^.]+$/i, ''),
                optionName: sourceOptResult[2].match(/[^.]+$/i)[0],
                relative: !linkValue.match(/^\$[.a-z0-9_-]+(\?.+)?\$$/i),
                value: linkValue.replace(/\?.+(?=\$$)/i, ''),
                params: params
            };
        }
    }

    public static isLink(linkValue: any): boolean
    {
        return linkValue
            && typeof linkValue === 'string'
            && !!linkValue.match(/\$.+\$$/i)
        ;
    }

    constructor(option: Option)
    {
        this._option = option;
    }

    public getAll(): Array<ILink>
    {
        return this._links;
    }

    public add(linkValue: string, linkParams: any = {}): void
    {
        const parsedLinkValue = OptionLinksStorage.parseLink(linkValue);

        if (!OptionLinksStorage.isLink(linkValue)) {
            throw new Error(
                'Trying add not a link "' + linkValue + '" ' +
                'to OptionLinks storage of option ' + this._option
            );
        }

        if (this.has(linkValue)) {
            throw new Error(
                'Trying add already existent link "' + linkValue + '" ' +
                'to OptionLinks storage of option ' + this._option
            );
        }

        linkValue = parsedLinkValue.value;
        linkParams = Tools.extendDeep(parsedLinkValue.params, linkParams);

        const linkOptionTypeDefinition = this.findOptionTypeDefinition(linkValue);

        if (!linkOptionTypeDefinition) {
            return;
        }

        if (!this._option.getTypeDefinition().isCompatible(linkOptionTypeDefinition)) {
            throw new Error(
                `Specified incompatible option in default value link "${linkOptionTypeDefinition.getNameFull()}" ` +
                `in option definition ${this._option}`
            );
        }

        this._links.push({
            value: linkValue,
            params: linkParams
        });

        this._links.sort((a: ILink, b: ILink) => {
            const aPriority = parseInt(a.params.priority || 0);
            const bPriority = parseInt(b.params.priority || 0);

            if (aPriority > bPriority) {
                return -1;

            } else if (aPriority < bPriority) {
                return 1;

            } else {
                return 0;
            }
        });

        // Adding current option to the source option as linked

        const sourceOptionInfo = this.findOption(linkValue, linkParams);
        const sourceOption = sourceOptionInfo.option;

        if (sourceOption) {
            sourceOption.getLinksStorage().addLinkedOption(this._option);
        }
    }

    public remove(linkValue: string): ILink
    {
        for (let i = 0; i < this._links.length; i++) {
            if (this._links[i].value !== linkValue) {
                continue;
            }

            const link = this._links[i];

            this._links.splice(i, 1);

            // Removing current option from the linked options list of the removing link source option

            const sourceOptionInfo = this.findOption(linkValue);
            const sourceOption = sourceOptionInfo.option;

            if (sourceOption) {
                sourceOption.getLinksStorage().removeLinkedOption(this._option);
            }

            return link;
        }
    }

    public has(linkValue: string): boolean
    {
        return this._links.some((link: ILink) => link.value === linkValue);
    }

    public addLinkedOption(linkedOption: Option): void
    {
        if (this.hasLinkedOption(linkedOption)) {
            throw new Error(
                'Trying to add already present linked option "' + linkedOption.getNameFull() + '" ' +
                'to the links storage of option "' + this._option.getNameFull() + '"'
            );
        }

        this._linkedOptions.push(linkedOption);
    }

    public removeLinkedOption(linkedOption: Option): number
    {
        const index = this._linkedOptions.indexOf(linkedOption);

        if (index >= 0) {
            this._linkedOptions.splice(index, 1);
        }

        return index;
    }

    public getLinkedOptions(): Array<Option>
    {
        return this._linkedOptions.filter((option: Option) => !!option.getContextRoot());
    }

    public hasLinkedOption(linkedOption: Option): boolean
    {
        return this._linkedOptions.indexOf(linkedOption) >= 0;
    }

    public findOptions(): Array<IFoundLinkInfo>
    {
        const links = this.getAll();
        const result: any[] = [];

        for (let link of links) {
            result.push(this.findOption(link.value, link.params));
        }

        return result;
    }

    public findOption(linkValue: string, linkParams: any = {}): IFoundLinkInfo
    {
        if (linkValue in this._searchCache) {
            return this._searchCache[linkValue];
        }

        if (!linkValue) {
            return <IFoundLinkInfo>{};
        }

        const parsedLinkValue = OptionLinksStorage.parseLink(linkValue);
        const option = this._option;

        let sourceOption: Option = null;
        let sourceContext: Option = option;
        let parentLevel = parsedLinkValue.parentLevel;

        const result = {
            option: sourceOption,
            params: linkParams,
            info: parsedLinkValue
        };

        // Relative path

        if (parsedLinkValue.relative) {
            parentLevel++;

            for (let i = 0; i < parentLevel; i++) {
                if (!sourceContext) {
                    return result;
                }

                sourceContext = sourceContext.getContextOption();
            }

            if (!sourceContext) {
                return result;
            }

            const requiredOptName = sourceContext.getName() + '.' + parsedLinkValue.optionFullName;

            sourceOption = sourceContext.getContext().getOption(requiredOptName);

        // Absolute path

        } else {
            sourceContext = option
                .getContextRoot()
                .getOption<OptionMultiple<OptionMultipleValue>>(parsedLinkValue.optionPath)
            ;

            if (!sourceContext) {
                return result;
            }

            const value = sourceContext.getValue();

            if (value) {
                sourceOption = value.getOption(parsedLinkValue.optionName);
            }
        }

        if (result.option = sourceOption) {
            this._searchCache[linkValue] = result;
        }

        return result;
    }

    public findOptionTypeDefinition<T extends OptionType>(linkValue: string): T
    {
        if (!linkValue) {
            return;
        }

        const parsedLinkValue = OptionLinksStorage.parseLink(linkValue);
        const option = this._option;

        let sourceContext: Option = option;
        let parentLevel = parsedLinkValue.parentLevel;

        // Relative path

        if (parsedLinkValue.relative) {
            parentLevel++;

            for (let i = 0; i < parentLevel; i++) {
                if (!sourceContext) {
                    return;
                }

                sourceContext = sourceContext.getContextOption();
            }

            if (!sourceContext) {
                return;
            }

            const requiredOptName = parsedLinkValue.optionFullName;
            const typeDefinition = sourceContext.getTypeDefinition();

            if (!('findChildTypeDefinition' in typeDefinition)) {
                return;
            }

            return (<any>typeDefinition).findChildTypeDefinition(requiredOptName);
        }

        // Absolute path

        const contextRoot = option.getContextRoot();

        if (!contextRoot.findChildTypeDefinition) {
            return;
        }

        return contextRoot.findChildTypeDefinition(parsedLinkValue.optionFullName);
    }
}