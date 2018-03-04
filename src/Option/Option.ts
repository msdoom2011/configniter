import { IOptionWatchersAware, OptionWatchersAware } from "./OptionWatchersAware";
import { ILink, OptionLinksStorage } from "./OptionLinksStorage";
import { IOptionWatcherEvent } from "./OptionWatcherEvent";
import { IOptionContextRoot } from "./OptionContextRoot";
import { IOptionContext } from "./OptionContext";
import { OptionType } from "./OptionType";
import { Tools } from "../Tools/Tools";

export interface IOptionWatcherInfo
{
    target: IOptionWatchersAware;

    newValue: any;

    oldValue: any;
}

export class Option extends OptionWatchersAware
{
    protected _name: string;

    protected _type: OptionType;

    protected _context: IOptionContext;

    protected _contextRoot: IOptionContextRoot | null = null;

    protected _linksStorage: OptionLinksStorage;

    protected _locked: boolean = false;

    protected _valueDefault: any;

    protected _value: any;

    /**
     * Generates property getter function
     *
     * @param {string} optionName
     * @returns {Function}
     */
    public static generateGetter(optionName: string): () => any
    {
        return function(this: IOptionContext): any {
            const option = this.getOption(optionName);

            if (!option) {
                return;
            }

            return option.getValue();
        };
    }

    /**
     * Generates setter for specified property
     *
     * @param {string} optionName
     *      The name of property for which you want to create setter
     *
     * @returns {function}
     */
    public static generateSetter(optionName: string): (value: any) => void
    {
        return function(this: IOptionContext, value: any): void {
            const option = this.getOption(optionName);

            if (!option) {
                return;
            }

            return option.setValue(value);
        };
    }

    constructor(optionName: string, optionType: OptionType, context: IOptionContext)
    {
        super();

        this._name = optionName;
        this._type = optionType;
        this._context = context;
        this._linksStorage = new OptionLinksStorage(this);
    }

    public initialize(): void
    {
        // Do something
    }

    public getName(): string
    {
        return this._name;
    }

    public getNameFull(): string
    {
        const optName = this.getName();
        const context = this.getContext();
        let parentName = "";

        //@TODO get rid of the getContextType method in option context object!!!!
        if (context.getContextType() === 'option') {
            const parentOption = context.getOption();

            if (parentOption) {
                parentName = parentOption.getNameFull();
            }
        }

        return (parentName && parentName + "." || "") + optName;
    }

    public getType(): string
    {
        return this.getTypeDefinition().getType();
    }

    public getTypeDefinition(): OptionType
    {
        return this._type;
    }

    public rename(newName: string): void
    {
        const context = this.getContext();
        const isAttached = this.isAttached();

        if (!newName || typeof newName !== 'string') {
            throw new Error(
                'Specified invalid new value argument while was called method rename in option ' + this + '. ' +
                'It must be a string.'
            );
        }

        if (isAttached && Object.isSealed(context)) {
            throw new Error(
                'Can\'t rename option ' + this + '. ' +
                'The context object is sealed.'
            );
        }

        if (isAttached) {
            this.detach();
            this._name = newName;
            this.attach(context);
        }
    }

    public getLinksStorage(): OptionLinksStorage
    {
        return this._linksStorage;
    }

    public hasLink(linkValue?: string): boolean
    {
        if (linkValue) {
            return this.getLinksStorage().has(linkValue);
        }

        return !!this.getLinksStorage().getAll().length;
    }

    public addLink(linkValue: string, linkParams: any = {}): void
    {
        this.getLinksStorage().add(linkValue, linkParams);
        this._valueDefault = undefined;
    }

    public getLinks(): Array<ILink>
    {
        return this.getLinksStorage().getAll();
    }

    public hasLinkedOption(option: Option): boolean
    {
        return this.getLinksStorage().hasLinkedOption(option);
    }

    public addLinkedOption(option: Option): void
    {
        return this.getLinksStorage().addLinkedOption(option);
    }

    public getLinkedOptions(): Array<Option>
    {
        return this.getLinksStorage().getLinkedOptions();
    }

    public isAttached(): boolean
    {
        return !!this.getContext() || !(this.getName() in this.getContext());
    }

    /**
     * Attaches property to specified context
     *
     * @param {IOptionContext} accessorsContext
     */
    public attach(accessorsContext: IOptionContext): void
    {
        const constructor = <typeof Option>this.constructor;
        const optionName = this.getName();

        this.validateContext(accessorsContext);

        if (Object.isSealed(accessorsContext)) {
            throw new Error(
                'Can\'t attach option ' + this + ' because ' +
                'the context object is sealed.'
            );
        }

        Object.defineProperty(accessorsContext, optionName, {
            configurable: true,
            enumerable: true,
            get: constructor.generateGetter(optionName),
            set: constructor.generateSetter(optionName)
        });
    }

    /**
     * Detaches property from class instance
     */
    public detach(): void
    {
        const optionName = this.getName();
        const context = this.getContext();

        this._contextRoot = null;

        if (!context) {
            return;
        }

        if (Object.isSealed(context)) {
            const option = context.getOption(optionName);

            throw new Error(
                'Can\'t detach option ' + option + ' because ' +
                'the context object is sealed'
            );
        }

        delete context[optionName];
    }

    /**
     * Validates option context object
     *
     * @throws {Error}
     *      Throws error if specified invalid option context object
     *
     * @returns {Object} context object
     */
    protected validateContext(context: IOptionContext): IOptionContext
    {
        const requiredMethods = [
            'getOption',
            'getContextType'
        ];

        for (let methodName of requiredMethods) {
            if (
                !context
                || typeof context !== 'object'
                || typeof context[methodName] !== 'function'
            ) {
                throw new Error(
                    'Trying to attach option ' + this + ' to invalid context object. ' +
                    'The valid context object should implement methods: "' + requiredMethods.join('", "') + "."
                );
            }
        }

        return context;
    }

    public setContext(context: IOptionContext): void
    {
        this.validateContext(context);
        this._context = context;
    }

    /**
     * Returns option context object
     *
     * @returns {(Object|null)}
     */
    public getContext(): IOptionContext
    {
        return this._context;
    }

    /**
     * Return context root object
     *
     * @returns {IOptionContext}
     */
    public getContextRoot(): IOptionContextRoot | null
    {
        if (this._contextRoot) {
            return this._contextRoot;
        }

        const context = this.getContext();

        if (!context) {
            return this._contextRoot = null;
        }

        switch (context.getContextType()) {
            case 'option':
                const option = context.getOption();

                this._contextRoot = option ? option.getContextRoot() : null;
                break;

            case 'class':
                this._contextRoot = <IOptionContextRoot>context;
                break;

            default:
                this._contextRoot = null;
        }

        return this._contextRoot;
    }

    public getContextOption(): Option | undefined
    {
        const context = this.getContext();

        if (context.getContextType() === 'option') {
            return context.getOption();
        }
    }

    public isWritable(): boolean
    {
        return this.getTypeDefinition().isWritable();
    }

    /**
     * Makes current option locked
     */
    public lock(): void
    {
        this._locked = true;
    }

    /**
     * Makes current option unlocked
     */
    public unlock(): void
    {
        this._locked = false;
    }

    /**
     * Reports whether current option is locked
     *
     * @returns {boolean}
     */
    public isLocked(): boolean
    {
        if (this._locked) {
            return true;
        }

        const context = this.getContext();

        if (context && context.getContextType() === 'option') {
            const parentOption = context.getOption();

            if (!parentOption) {
                return false;
            }

            return parentOption.isLocked() || false;

        } else {
            return false;
        }
    }

    /**
     * @inheritDoc
     */
    public getWatchersContext(): IOptionContext
    {
        return this.getContext();
    }

    /**
     * @inheritDoc
     */
    public getWatchers(): Array<(event: IOptionWatcherEvent) => any>
    {
        const watcher = this.getTypeDefinition().getWatcher();
        const watchers = [];

        if (watcher) {
            watchers.push(watcher);
        }

        return Tools.extend(watchers, super.getWatchers());
    }

    /**
     * Removes specified watcher callback
     *
     * @param {Function} callback
     */
    public removeWatcher(callback: (event: IOptionWatcherEvent) => any): void
    {
        super.removeWatcher(callback);

        if (this.getTypeDefinition().getWatcher() === callback) {
            this.getTypeDefinition().setWatcher(null);
        }
    }

    /**
     * Unbind all watchers from current option
     */
    public removeWatchers(): void
    {
        this.getTypeDefinition().setWatcher(null);

        super.removeWatchers();
    }

    /**
     * Returns new and old values of parent context options
     */
    protected getParentWatchersInfo(option: Option, newValue: any, oldValue: any): Array<IOptionWatcherInfo>
    {
        const context = option.getContext();
        let parents = <Array<IOptionWatcherInfo>>[];

        if (
            context
            && context.getContextType
            && context.getContextType() === 'option'
        ) {
            const parent = context.getOption();

            if (!parent) {
                return parents;
            }

            const parentTypeDef = parent.getTypeDefinition();
            const parentNewValue = parentTypeDef.getEmptyValue();
            const parentOldValue = parentTypeDef.getEmptyValue();

            parentNewValue[option.getName()] = newValue;
            parentOldValue[option.getName()] = oldValue;

            parents.push({
                target: parent,
                newValue: Object.freeze(parentNewValue),
                oldValue: Object.freeze(parentOldValue)
            });

            parents = parents.concat(this.getParentWatchersInfo(parent, parentNewValue, parentOldValue));

        } else if (
            context
            && context.getContextType
            && context.getContextType() === 'class'
        ) {
            parents.push({
                target: <IOptionContext & IOptionWatchersAware>context,
                newValue: null,
                oldValue: null
            });
        }

        return parents;
    }

    /**
     * Invokes all parent option watchers specified in "parents" argument
     */
    protected invokeParentWatchers(event: IOptionWatcherEvent, parents: Array<IOptionWatcherInfo>): void
    {
        for (let parentValues of parents) {
            if (event.isPropagationStopped()) {
                break;
            }

            const parentOption = parentValues.target;

            event = parentOption.createWatcherEvent(
                parentValues.newValue,
                parentValues.oldValue,
                true
            );

            parentOption.invokeWatchers(event);
        }
    }

    /**
     * Checks if option contains empty value
     *
     * @param {*} [value]
     * @returns {boolean}
     */
    public isEmpty(value?: any): boolean
    {
        if (!arguments.length) {
            value = this.getValue();
        }

        return this.getTypeDefinition().isValueEmpty(value);
    }

    /**
     * Checks whether is valid specified value
     *
     * @param {*} value
     * @returns {boolean}
     */
    public isValid(value: any): boolean
    {
        try {
            this.getTypeDefinition().validateValue(value);
            return true;

        } catch (e) {
            return false;
        }
    }

    public setValueData(value: any): void
    {
        this.getTypeDefinition().validateValue(value);
        this._value = value;
    }

    /**
     * Returns only data of current option
     *
     * @returns {*}
     */
    public getValueData(valuesOnly: boolean = false): any
    {
        return this.getValue(valuesOnly);
    }

    public setValue(value: any, invokeParentWatchers: boolean = true): void
    {
        const optionTypeDefinition = this.getTypeDefinition();
        const setter = this.setValueOrigin.bind(this);

        if (!this.isWritable()) {
            throw new Error('The option ' + this + ' is not writable.');
        }

        if (optionTypeDefinition.getSetter()) {
            optionTypeDefinition.getSetter().call(this, value, setter, invokeParentWatchers);

        } else {
            setter(value, invokeParentWatchers);
        }
    }

    /**
     * Sets option value
     *
     * @param {*} value
     * @param {boolean} [invokeParentWatchers=true]
     * @returns {*}
     */
    public setValueOrigin(value: any, invokeParentWatchers: boolean = true): void
    {
        if (this.isLocked()) {
            return console.warn(
                'Trying to set new value for the ' +
                'option ' + this + ' that is locked for write.'
            );
        }

        const oldValue = this._value !== undefined ? this._value : this.getValueData();
        const newValue = value;

        this.setValueData(value);

        if (!Tools.isEqual(newValue, oldValue)) {
            this.invokeValueWatchers(newValue, oldValue, false, invokeParentWatchers);
        }
    }

    /**
     * Resets option value
     */
    public resetValue(): void
    {
        this._value = undefined;
    }

    public invokeValueWatchers(
        newValue: any,
        oldValue: any,
        bubbled: boolean = false,
        invokeParentWatchers: boolean = true
    ): void
    {
        const event = this.createWatcherEvent(newValue, oldValue, bubbled);
        const linkedOptions = this.getLinkedOptions();

        this.invokeWatchers(event);

        if (invokeParentWatchers) {
            this.invokeParentWatchers(event, this.getParentWatchersInfo(this, newValue, oldValue));
        }

        for (let linkedOption of linkedOptions) {
            if (linkedOption.getValue(true) === undefined && linkedOption !== this) {
                linkedOption.invokeValueWatchers(newValue, oldValue, bubbled, invokeParentWatchers);
            }
        }
    }

    public getValue(isRawData: boolean = false): any
    {
        if (isRawData) {
            return this._value;
        }

        const optionTypeDefinition = this.getTypeDefinition();
        const getter = this.getValueOrigin.bind(this);

        if (optionTypeDefinition.getGetter()) {
            return optionTypeDefinition.getGetter().call(this, getter);
        }

        return getter();
    }

    /**
     * Returns value of current option
     */
    public getValueOrigin(): any
    {
        if (this._value === undefined) {
            return this.getValueDefault();
        }

        return this._value;
    }

    /**
     * Sets option default value
     *
     * @param {*} value
     */
    public setValueDefault(value: any): void
    {
        this.getTypeDefinition().validateValue(value);

        this._valueDefault = value;
    }

    /**
     * Returns option default value
     *
     * @returns {*}
     */
    public getValueDefault(isRawData: boolean = false): any
    {
        const typeDefinition = this.getTypeDefinition();
        const defaultValue = this._valueDefault;

        if (isRawData || defaultValue !== undefined) {
            return defaultValue;

        } else if (this.hasLink()) {
            return this.getValueLinked();
        }

        return typeDefinition.getValue(true);
    }

    public getValueLinked(): any
    {
        const linkStorage = this.getLinksStorage();
        const sourceOptionsInfo = linkStorage.findOptions();

        let sourceOptionInfo;
        let sourceOption;

        // searching appropriate source option

        loop: for (let getterName of ['getValue', 'getValueDefault']) {
            for (let optionInfo of sourceOptionsInfo) {
                const option = optionInfo.option;

                if (option === this || !option) {
                    continue;
                }

                if (
                    option.hasLink()
                    && (<any>option)[getterName](true) === undefined
                ) {
                    continue;
                }

                sourceOption = option;
                sourceOptionInfo = optionInfo;

                break loop;
            }
        }

        // getting first option from search result if
        // appropriate option wasn't found

        if (
            !sourceOption
            && sourceOptionsInfo.length
            && sourceOptionsInfo[0].option
        ) {
            sourceOption = sourceOptionsInfo[0].option;
        }

        // If required source option doesn't exist return
        // value from option type definition

        if (!sourceOption || sourceOption === this) {
            return this.getTypeDefinition().getValue(true);
        }

        if (!sourceOptionInfo) {
            throw new Error(
                'The sourceOptionInfo is not found when trying to get ' +
                'linked value of option "' + this.getNameFull() + '"'
            );
        }

        if (!sourceOption) {
            throw new Error(
                'The source option by link value "' + sourceOptionInfo.info.optionFullName + '" ' +
                'can\'t be found for option "' + this.getNameFull() + '"!'
            );
        }

        return sourceOption.getValue();
    }

    public isCompatible(sourceOption: Option): boolean
    {
        return this.getTypeDefinition().isCompatible(sourceOption.getTypeDefinition());
    }

    /**
     * Return string implementation of option
     *
     * @returns {string}
     */
    public toString(): string
    {
        const optionName = this.getNameFull();
        const context = this.getContext();
        let contextClassName = "";

        if (context.getContextType() === 'class') {
            contextClassName = ' in ' + context.toString();
        }

        return '"' + optionName + '"' + contextClassName;
    }
}