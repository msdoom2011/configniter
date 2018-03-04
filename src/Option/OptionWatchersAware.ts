import {IOptionWatcherEvent, OptionWatcherEvent} from "./OptionWatcherEvent";
import {Constructor} from "../Tools/Tools";

export interface IOptionWatchersAware
{
    getWatchers(): Array<(event: IOptionWatcherEvent) => any>;

    addWatcher(callback: (event: IOptionWatcherEvent) => any): void;

    hasWatcher(callback: (event: IOptionWatcherEvent) => any): boolean;

    removeWatcher(callback: (event: IOptionWatcherEvent) => any): void;

    removeWatchers(): void;

    invokeWatchers(event: IOptionWatcherEvent): void;

    createWatcherEvent(newValue: any, oldValue: any, bubbled?: boolean): IOptionWatcherEvent;
}

export const OptionWatchersAwareMixin = <
    T extends Constructor<{}>>
(Base: T) => {

    return class extends Base implements IOptionWatchersAware
    {
        protected _watchers: Array<(event: IOptionWatcherEvent) => any> = [];

        public getWatchersContext(): any
        {
            return this;
        }

        /**
         * Returns all registered watchers
         *
         * @returns {Function[]}
         */
        public getWatchers(): Array<(event: IOptionWatcherEvent) => any>
        {
            return this._watchers;
        }

        /**
         * Adds new watcher
         *
         * @param {Function} callback Function, that takes two arguments:
         *      - newValue {*} New option value
         *      - oldValue {*} Old option value
         *
         *      "this" variable inside callback function will link to the option context
         */
        public addWatcher(callback: (event: IOptionWatcherEvent) => any): void
        {
            if (typeof callback !== "function") {
                throw new Error(
                    'Specified invalid watcher callback for option ' + this + '. ' +
                    'It should be a function'
                )
            }
            if (!this.hasWatcher(callback)) {
                this._watchers.push(callback);
            }
        }

        /**
         * Checks if specified watcher callback is registered
         *
         * @param {Function} callback
         * @returns {boolean}
         */
        public hasWatcher(callback: (event: IOptionWatcherEvent) => any): boolean
        {
            return this.getWatchers().indexOf(callback) >= 0;
        }

        /**
         * Removes specified watcher callback
         *
         * @param {Function} callback
         */
        public removeWatcher(callback: (event: IOptionWatcherEvent) => any): void
        {
            let watcherIndex;

            if ((watcherIndex = this._watchers.indexOf(callback)) >= 0) {
                this._watchers.splice(watcherIndex, 1);
            }
        }

        /**
         * Unbind all watchers from current option
         */
        public removeWatchers(): void
        {
            this._watchers.length = 0;
        }

        /**
         * Invokes all registered watcher functions
         *
         * @param {IOptionWatcherEvent} event
         */
        public invokeWatchers(event: IOptionWatcherEvent): void
        {
            const watchers = this.getWatchers();
            const context = this.getWatchersContext();

            for (let watcher of watchers) {
                watcher.call(context, event);
            }
        }

        public createWatcherEvent(newValue: any, oldValue: any, bubbled: boolean = false): IOptionWatcherEvent
        {
            return new OptionWatcherEvent(this, newValue, oldValue, bubbled);
        }
    }
};

export abstract class OptionWatchersAware extends OptionWatchersAwareMixin(class {}) implements IOptionWatchersAware
{
    // Nothing
}
