import {OptionType, IOptionDefinition} from "../OptionType";
import {Tools} from "../../Tools/Tools";

export interface IClassOptionDefinition extends IOptionDefinition
{
    class: IClassConstructor;
}

interface IClassConstructor
{
    new (...args: any[]): any
}

export class ClassType extends OptionType
{
    public static getName(): string
    {
        return "class";
    }

    public static getEmptyDefinition(): IOptionDefinition
    {
        return null;
    };

    public static getEmptyValue(): any
    {
        return null;
    }

    public setNullable(nullable: boolean): void
    {
        this.validateNullable(nullable);

        if (nullable === false) {
            throw new Error(
                'The "constructor" type option ' + this + ' ' +
                'should be always nullable.'
            );
        }
    }

    public validateValue(value: any): void
    {
        super.validateValue(value);

        let cls = this.getClass();

        if (
            value !== null
            && (
                typeof value !== 'object'
                || !(value instanceof cls)
            )
        ) {
            throw new Error(
                'Specified invalid value of option "' + this + '". ' +
                'It should be an object which is instance of constructor function ' + (<any>cls).name
            );
        }
    }

    /**
     * Validates "construct" option value
     *
     * @param {*} constructor
     */
    public validateClass(constructor: IClassConstructor): void
    {
        if (typeof constructor !== 'function') {
            throw new Error(
                'Specifeid invalid value of "class" property in definition of option ' + this + '. ' +
                'It should be a constructor function'
            );
        }
    }

    /**
     * Sets "construct" option
     *
     * @param {Function} constructor
     */
    public setClass(constructor: IClassConstructor): void
    {
        this.validateClass(constructor);
        (<IClassOptionDefinition>this.getDefinition()).class = constructor;
    }

    /**
     * Returns value of "construct" option
     *
     * @returns {Function}
     */
    public getClass(): IClassConstructor
    {
        return (<IClassOptionDefinition>this.getDefinition()).class;
    }

    public getRequiredAttributes(): string[]
    {
        return super.getRequiredAttributes().concat(['class']);
    }

    public isCompatible(typeDef: OptionType): boolean
    {
        if (!super.isCompatible(typeDef)) {
            return false;
        }
        let testDef = <ClassType>typeDef;

        return this.getClass() === testDef.getClass();
    }

    public getBaseDefinition(): IOptionDefinition
    {
        return Tools.extend(super.getBaseDefinition(), {

            /**
             * Is used to specify the constructor of object instances which current property should store.
             *
             * Every value you want to set to this value should satisfy the condition:
             * {yourObject} instanceof {constructorFunction}
             *
             * @type {IClassConstructor}
             */
            class: null
        });
    }
}
