import {IOptionWatchersAware} from "./OptionWatchersAware";

export interface IOptionWatcherEvent
{
    getTarget<T extends IOptionWatchersAware>(): T;

    stopPropagation(): void;

    isPropagationStopped(): boolean;

    preventDefault(): void;

    isDefaultPrevented(): boolean;

    setNewValue(newValue: any): void;

    getNewValue(): any;

    setOldValue(oldValue: any): void;

    getOldValue(): any;

    isBubbled(): boolean;
}

export class OptionWatcherEvent implements IOptionWatcherEvent
{
    /**
     * target option instance
     *
     * @type {Option}
     * @private
     */
    private _target: IOptionWatchersAware;

    /**
     * Reports whether propagation stopped
     *
     * @type {boolean}
     * @private
     */
    private _stopped: boolean = false;

    /**
     * Whether the current event has been prevented
     *
     * @type {boolean}
     * @private
     */
    private _prevented: boolean = false;

    /**
     * Reports whether propagation stopped
     *
     * @type {boolean}
     * @private
     */
    private _newValue: any;

    /**
     * Old property value before modification
     *
     * @type {*}
     * @private
     */
    private _oldValue: any;

    /**
     * Indicates whether current event was created by event bubbling
     *
     * @type {boolean}
     * @private
     */
    private _bubbled: boolean = false;

    constructor(target: IOptionWatchersAware, newValue: any, oldValue: any, bubbled: boolean)
    {
        this._target = target;
        this._newValue = newValue;
        this._oldValue = oldValue;
        this._bubbled = bubbled;
    }

    /**
     * Returns option watchers aware instance
     *
     * @returns {IOptionWatchersAware}
     */
    public getTarget<T extends IOptionWatchersAware>(): T
    {
        return <T>this._target;
    }

    /**
     * Stops event propagation
     */
    public stopPropagation(): void
    {
        this._stopped = true;
    }

    /**
     * Reports whether event propagation stopped
     *
     * @returns {boolean}
     */
    public isPropagationStopped(): boolean
    {
        return this._stopped;
    }

    /**
     * Prevents default behavior
     */
    public preventDefault(): void
    {
        this._prevented = true;
    }

    /**
     * Checks whether the default behavior is prevented
     *
     * @returns {boolean}
     */
    public isDefaultPrevented(): boolean
    {
        return this._prevented;
    }

    /**
     * Sets new option value
     *
     * @param {*} newValue
     */
    public setNewValue(newValue: any): void
    {
        this._newValue = newValue;
    }

    /**
     * Returns new option value
     *
     * @returns {*}
     */
    public getNewValue(): any
    {
        return this._newValue;
    }

    /**
     * Sets old option value
     *
     * @param {*} oldValue
     */
    public setOldValue(oldValue: any): void
    {
        this._oldValue = oldValue;
    }

    /**
     * Returns old option value
     *
     * @returns {*}
     */
    public getOldValue(): any
    {
        return this._oldValue;
    }

    /**
     * Whether the current event is bubbled
     *
     * @returns {*}
     */
    public isBubbled(): boolean
    {
        return this._bubbled;
    }
}
