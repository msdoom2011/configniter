import { OptionContextRoot } from "./OptionContextRoot";
import { IConstructor, Tools } from "../Tools/Tools";
import { IOptionContext } from "./OptionContext";
import { IOptionDefinition } from "./OptionType";
import { OptionManager } from "./OptionManager";
import { Option } from "./Option";

export interface IOptionableStatic
{
    getOptions(): { [optName: string]: IOptionDefinition };
}

export interface IOptionableConstructor extends IOptionableStatic
{
    new (...args: Array<any>): Optionable;
}

export interface IOptionable
{
    getOptionManager(): OptionManager;

    initializeOptions(optionsContext?: IOptionContext): void;

    isOpt(optionName: string): boolean;

    opt: {
        <T>(optName: string): T;
        (optName: string, optValue: any): void;
    };

    optOrigin: {
        <T>(optName: string): T;
        (optName: string, optValue: any): void;
    };

    getOption<T extends Option>(optName: string): T | undefined;

    setOptionsData(data: any & object, quetMode?: boolean): void;

    getOptionsData(): any & object;

    isMatchOptions (matchOptions: { [optName: string]: any }): boolean;

    lock(): void;

    unlock(): void;

    toggleLock(): void;

    isLocked(): boolean;

    toString(): string;
}

export const OptionableMixin = <
    T extends IConstructor<{}>>
(Base: T) => {

    abstract class OptionableMixin extends Base implements IOptionable
    {
        protected _options: IOptionContext;

        protected _locked: boolean = false;

        /**
         * Returns definitions of options
         *
         * @example
         *
         * return {
         *    type: { type: "string", value: construct.type, required: true, nullable: false },
         *    template: { type: "string", value: '', required: false, nullable: false },
         *    id: { type: "string", value: null, required: false, nullable: true },
         * }
         */
        public static getOptions(): { [optName: string]: IOptionDefinition }
        {
            return {};
        }

        abstract getOptionManager(): OptionManager;

        /**
         * Is a point of entry. You have to call this method when initializing
         * your optionable class instance. Options should be initialized
         * before you set data to optionable instance.
         *
         * Initializing can caught an error for some reason.
         *
         * The best practice is to cover initializeOptions call into the
         * try...catch construction thus you can observe in what part
         * of you code exception has been thrown.
         *
         * @example
         *
         * ...
         *  try {
         *      this.initializeOptions();
         *  } catch (e) {
         *      console.error('Error: Initializing of user object failed.\n');
         *      Subclass.Error.create(e);
         *  }
         *  ...
         */
        public initializeOptions(optionsContext?: IOptionContext): void
        {
            if (!optionsContext) {
                const constructor = <typeof OptionableMixin>this.constructor;
                const options = constructor.getOptions();

                optionsContext = new OptionContextRoot(this.getOptionManager());
                optionsContext.initialize(options);
            }

            this._options = optionsContext;
        }

        public isOptionsInitialized(): boolean
        {
            return !Tools.isEmpty(this._options);
        }

        /**
         * Validates options values after the data has been set
         *
         * To ensure that all required fields have been filled then
         * you have to call this method right after you've set data
         * to optionable class instance
         *
         * @example
         *
         * ...
         * optionable.setData(data);
         * optionable.validateRequiredOptions();
         * ...
         */
        public validateRequiredOptions(): void
        {
            const emptyOptions = this.getEmptyRequiredOptions();

            if (emptyOptions.length) {
                throw new Error(
                    'There some required to fill options that are left ' +
                    'after data has been set:\n- ' + emptyOptions.join('\n- ')
                )
            }
        }

        /**
         * Validates options values after the data has been set
         */
        public getEmptyRequiredOptions(): string[]
        {
            const constructor = <typeof OptionableMixin>this.constructor;
            const options = constructor.getOptions();
            const emptyOptions = [];

            for (let optionName in options) {
                if (
                    options.hasOwnProperty(optionName)
                    && options[optionName].required
                    && (
                        options[optionName].type !== 'boolean'
                        || options[optionName].nullable
                    )
                    && Tools.isEmpty(this.opt(optionName))
                ) {
                    emptyOptions.push(optionName);
                }
            }

            return emptyOptions;
        }

        public isOpt(optionName: string): boolean
        {
            if (!this._options) {
                return false;
            }

            return this._options.hasOption(optionName);
        }

        /**
         * Options getter/setter method.
         *
         * Returns or sets options values with ability to redefine
         * getters or setters by creating appropriate methods
         * in current collection class.
         *
         * Example:
         *
         * We have option named "myOpt" in collection of type "my-collection".
         * To redefine getter we should create method "getMyOpt" in this collection type class.
         * To redefine setter we should in turn create method "setMyOpt".
         *
         * Lets see it in code:
         *
         * function MyCollection() {
         *     ...
         * }
         *
         * MyCollection.type = 'my-collection';
         * MyCollection.getOptions = function()
         * {
         *     let options = super.getOptions();
         *     options.myOpt = { "type": "number", "value": 10 };
         *     return options;
         * };
         *
         * MyCollection.prototype = {
         *
         *     ...
         *     getMyOpt: function()
         *     {
         *         let value = this.optOrigin('myOpt');
         *
         *         // Your manipulations with value
         *         ...
         *
         *         return value;
         *     },
         *
         *     setMyOpt: function(value)
         *     {
         *         // Your manipulations with value
         *         ...
         *
         *         this.optOrigin('myOpt', value);
         *     },
         *     ...
         * }
         */
        public opt<T>(optName: string): T;
        public opt(optName: string, optValue: any): void;
        public opt<T>(optName: string, ...args: any[]): any
        {
            if (optName.indexOf('.') < 0) {
                const methodType = arguments.length > 1 ? 'Setter' : 'Getter';
                const methodName = (<any>Tools)['generate' + methodType + 'Name'](optName);

                if (methodName in this && typeof (<any>this)[methodName] === 'function') {
                    if (methodType === 'Setter' && this.isLocked()) {
                        return;
                    }

                    return (<any>this)[methodName](...args);
                }
            }

            return <T>this.optOrigin.apply(this, arguments);
        }

        /**
         * Invokes origin accessor functions
         */
        public optOrigin<T>(optName: string): T
        public optOrigin(optName: string, optValue: any): void
        public optOrigin<T>(optName: string, optValue?: any): T | void
        {
            const options = this._options;
            const option = options.getOption(optName);

            if (!option && arguments.length > 1) {
                throw new Error(
                    'Trying to set value of not ' +
                    'registered option "' + optName + '"'
                );

            } else if (!option) {
                return;
            }

            if (arguments.length > 1) {
                if (this.isLocked()) {
                    return;
                }

                option.setValue(optValue);

            } else {
                return option.getValue();
            }
        }

        public getOption<T extends Option>(optName: string): T | undefined
        {
            return this._options.getOption(optName);
        }

        /**
         * Sets data to options
         */
        public setOptionsData(data: any & Object, quetMode: boolean = false): void
        {
            if (this.isLocked()) {
                return;
            }

            for (let optName in data) {
                if (data.hasOwnProperty(optName)) {
                    try {
                        this.opt(optName, data[optName]);

                    } catch (e) {
                        if (!quetMode) {
                            throw new Error(e);
                        }
                    }
                }
            }
            //
            //// validating required to fill options
            //
            //this.validateRequiredOptions();
        }

        /**
         * Returns options data
         */
        public getOptionsData(): any & Object
        {
            const options = this._options.getOptions();
            const data = <any>{};

            for (let optName in options) {
                if (options.hasOwnProperty(optName)) {
                    data[optName] = Tools.copy(this.opt(optName));
                }
            }

            return data;
        }

        /**
         * Checks whether or not current collection item matches by specified options
         *
         * The special options:
         *      group: string|string[]
         *      notEmpty: string[]
         *      empty: string[]
         */
        public isMatchOptions(matchOptions: { [optName: string]: any }): boolean
        {
            for (let optName in matchOptions) {
                if (!matchOptions.hasOwnProperty(optName)) {
                    continue;
                }

                if (!Array.isArray(matchOptions[optName])) {
                    matchOptions[optName] = [matchOptions[optName]];
                }

                if (!this.isOpt(optName)) {
                    return false;
                }

                const optValues = matchOptions[optName];
                const actualOptValue = this.opt(optName);
                let result = false;

                for (let i = 0; i < optValues.length; i++) {
                    if (actualOptValue === optValues[i]) {
                        result = true;
                        break;
                    }
                }

                if (!result) {
                    return false;
                }
            }

            return true;
        }

        // ========================= LOCKING HANDLING ==========================

        /**
         * Locks current collection item
         */
        public lock(): void
        {
            this._locked = true;
        }

        /**
         * Un locks current collection item
         */
        public unlock(): void
        {
            this._locked = false;
        }

        /**
         * Toggles locking of current collection item
         */
        public toggleLock(): void
        {
            this._locked ? this.unlock() : this.lock();
        }

        /**
         * Checks whether or not current collection item is locked
         */
        public isLocked(): boolean
        {
            return this._locked;
        }

        public toString(): string
        {
            return "" + this;
        }
    }

    return OptionableMixin;
};

export abstract class Optionable extends OptionableMixin(class
{
})
{
    // Nothing
}