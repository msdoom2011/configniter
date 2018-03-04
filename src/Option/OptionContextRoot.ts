import {IOptionWatchersAware, OptionWatchersAwareMixin} from "./OptionWatchersAware";
import {IOptionContext, OptionContext} from "./OptionContext";
import {EventableMixin, IEventable} from "../Event/Eventable";
import {OptionManager} from "./OptionManager";
import {Constructor} from '../Tools/Tools';

export interface IOptionContextRoot extends IOptionContext, IOptionWatchersAware, IEventable
{
    // Some definitions
}

export class OptionContextRoot

    extends OptionWatchersAwareMixin(
        EventableMixin(
            <Constructor<OptionContext>>OptionContext
        )
    )

    implements IOptionContextRoot
{
    constructor(optionManager: OptionManager)
    {
        super(optionManager);

        this
            .event('optionAdded')
            .event('optionRemoved')
        ;
    }

    /**
     * Should return one of two available values: "class" or "option"
     */
    public getContextType(): string
    {
        return "class";
    }
}