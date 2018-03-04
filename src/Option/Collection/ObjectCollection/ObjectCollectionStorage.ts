import {CollectionStorage} from "../CollectionStorage";
import {ILink} from '../../OptionLinksStorage';
import {MapOption} from "../../Map/MapOption";
import {MapType} from "../../Map/MapType";
import {Option} from "../../Option";

export class ObjectCollectionStorage extends CollectionStorage
{
    public add(option: Option): void;
    public add(key: string, value: any, isDefaultItem?: boolean): void;
    public add(key: string|Option, value?: any, isDefaultItem: boolean = false): void
    {
        let parentItemName: string;

        if (typeof key === 'string') {
            const links = this.getOption().getLinksStorage().getAll();

            for (let link of links) {
                addChildLinkValue(this._items[key], link);
            }
        }

        super.add.apply(this, arguments);

        if (!parentItemName) {
            return;
        }

        const itemOption = this.get<MapOption>(<string>key);
        const itemOptionValue = itemOption.getValue();
        const parentItemOption = this.get<MapOption>(parentItemName);
        const parentItemChildren = (<MapType>parentItemOption.getTypeDefinition()).getChildren();

        for (let childName in parentItemChildren) {
            if (parentItemChildren.hasOwnProperty(childName)) {
                itemOptionValue
                    .getOption(childName)
                    .addLink(`$../${parentItemName}.${childName}$`, { priority: -10 })
                ;
            }
        }

        function addChildLinkValue(child: Option, link: ILink): void {
            const valueDefault = link.value;
            const valueRelative = link.value.match(/^\$\./);
            const valuePath = valueDefault.replace(/^\$(\.\/)?|\$$/g, '');
            const childLinkValue = (valueRelative ? '$../' : '$') + valuePath + '.' + child.getName() + '$';

            if (child.getLinksStorage().has(childLinkValue)) {
                return;
            }

            child.addLink(
                childLinkValue,
                link.params
            );
        }
    }
}