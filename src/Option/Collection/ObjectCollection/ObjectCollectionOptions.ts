import {ObjectCollectionOption} from "./ObjectCollectionOption";
import {ObjectCollectionType} from "./ObjectCollectionType";
import {IOptionContext} from "../../OptionContext";
import {MapOption} from "../../Map/MapOption";
import {Option} from "../../Option";

export class ObjectCollectionOptions implements IOptionContext
{
    private _option: ObjectCollectionOption;

    private _item: MapOption;

    public constructor(option: ObjectCollectionOption)
    {
        this._option = option;
    }

    public initialize(): void
    {
        let optionsTypeDef = (<ObjectCollectionType>this._option.getTypeDefinition()).getOptionsTypeDefinition();
        this._item = optionsTypeDef.create<MapOption>('options', this);
        this._item.attach(this);
    }

    public getContextType(): string
    {
        return 'option';
    }

    public getOptions(): { [optName: string]: Option }
    {
        return { 'options': this._item };
    }

    public getOption(): ObjectCollectionOption;
    public getOption(optionName: string): MapOption;
    public getOption(optionName?: string): MapOption | ObjectCollectionOption
    {
        if (!arguments.length) {
            return this._option;
        }

        if (optionName === 'options') {
            return this._item;
        }
    }

    public hasOption(optionName: string): boolean
    {
        return optionName === 'options';
    }
}
