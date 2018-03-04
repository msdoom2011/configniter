import { IOptionWatchersAware, OptionWatchersAwareMixin } from "./OptionWatchersAware";
import { IOptionContext, OptionContext } from "./OptionContext";
import { IConstructor } from '../Tools/Tools';

export interface IOptionContextRoot extends IOptionContext, IOptionWatchersAware
{
    // Some definitions
}

export class OptionContextRoot

    extends OptionWatchersAwareMixin(
        <IConstructor<OptionContext>>OptionContext
    )

    implements IOptionContextRoot
{
    /**
     * Should return one of two available values: "class" or "option"
     */
    public getContextType(): string
    {
        return "class";
    }
}