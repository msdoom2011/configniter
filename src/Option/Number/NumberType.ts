import {OptionType, IOptionDefinition} from "../OptionType";
import {Tools} from "../../Tools/Tools";

export interface INumberOptionDefinition extends IOptionDefinition
{
    /**
     * Specified max number value if it isn't null
     */
    maxValue: number;

    /**
     * Specifies min number value if it isn't null
     */
    minValue: number;
}

export class NumberType extends OptionType
{
    public static getName(): string
    {
        return "number";
    }

    public static getEmptyValue(): number
    {
        return 0;
    }

    public validateValue(value: any): void
    {
        super.validateValue(value);

        if (value === null || value === undefined) {
            return;
        }
        let minValue = this.getMinValue(),
            maxValue = this.getMaxValue(),
            error = false;

        if (typeof value !== 'number') {
            error = true;
        }
        if (!error && minValue !== null && value < minValue) {
            throw new Error(
                'The value of the property ' + this + ' is too small ' +
                'and must be more or equals the number ' + minValue + "."
            );
        }
        if (!error && maxValue !== null && value > maxValue) {
            throw new Error(
                'The value of the property ' + this + ' is too high ' +
                'and must be less or equals the number ' + maxValue + "."
            );
        }
        if (error) {
            throw new Error(
                'Specified invalid value of option ' + this + '. ' +
                'It should be a number'
            );
        }
    }

    public generateValue(): number
    {
        let value = super.generateValue();

        if (this.isNullable() && value === null) {
            return value;
        }
        try {
            this.validateValue(value);

        } catch (e) {
            if (this.getMinValue() !== null && value < this.getMinValue()) {
                return this.getMinValue();

            } else if (this.getMaxValue() !== null && value > this.getMaxValue()) {
                return this.getMaxValue();
            }
        }
        return value;
    }

    /**
     * Validates "maxValue" attribute value
     *
     * @param {*} maxValue
     */
    public validateMaxValue(maxValue: number): void
    {
        if (maxValue !== null && typeof maxValue !== 'number') {
            throwInvalidOptionError('maxValue', this, 'a number or null');
        }
    }

    /**
     * Sets "maxValue" attribute value
     *
     * @param {(number|null)} maxValue
     */
    public setMaxValue(maxValue: number): void
    {
        this.validateMaxValue(maxValue);
        (<INumberOptionDefinition>this.getDefinition()).maxValue = maxValue;
        this.validateMinMaxValues();
    }

    /**
     * Returns value of "maxValue" attribute
     *
     * @returns {(number|null)}
     */
    public getMaxValue(): number
    {
        return (<INumberOptionDefinition>this.getDefinition()).maxValue;
    }

    /**
     * Validates "minValue" attribute value
     *
     * @param {*} minValue
     */
    public validateMinValue(minValue: number): void
    {
        if (minValue !== null && typeof minValue !== 'number') {
            throwInvalidOptionError('minValue', this, 'a number or null');
        }
    }

    /**
     * Sets "minValue" attribute value
     *
     * @param {(number|null)} minValue
     */
    public setMinValue(minValue: number): void
    {
        this.validateMinValue(minValue);
        (<INumberOptionDefinition>this.getDefinition()).minValue = minValue;
        this.validateMinMaxValues();
    };

    /**
     * Returns value of "minValue" attribute
     *
     * @returns {(number|null)}
     */
    public getMinValue(): number
    {
        return (<INumberOptionDefinition>this.getDefinition()).minValue;
    };

    /**
     * Validates how minValue and maxValue are compatable
     */
    public validateMinMaxValues(): void
    {
        let minValue = this.getMinValue(),
            maxValue = this.getMaxValue();

        if (
            minValue !== null
            && maxValue !== null
            && minValue > maxValue
        ) {
            throw new Error(
                'The "maxLength" attribute value must be higher than "minLength" attribute value ' +
                'in definition of property ' + this + ' must be number or null.'
            );
        }
    };

    public isCompatible(typeDef: OptionType): boolean
    {
        if (!super.isCompatible(typeDef)) {
            return false;
        }
        let testDef = <NumberType>typeDef;

        if (this.getMaxValue() !== null && this.getMaxValue() < testDef.getMaxValue()) {
            return false;

        } else if (this.getMinValue() !== null && this.getMinValue() > testDef.getMinValue()) {
            return false;
        }
        return true;
    }

    public getBaseDefinition(): IOptionDefinition
    {
        return Tools.extend(super.getBaseDefinition(), {

            /**
             * Specified max number value if it isn't null
             * @type {(number|null)}
             */
            maxValue: null,

            /**
             * Specifies min number value if it isn't null
             * @type {(number|null)}
             */
            minValue: null,

            /**
             * @inheritDoc
             */
            nullable: false
        });
    }

    public validateDefinition(): void
    {
        super.validateDefinition();
        this.validateMinMaxValues();
    }
}

function throwInvalidOptionError(optName: string, optionType: OptionType, expected: string): void
{
    throw new Error(
        'Specifeid invalid value of "' + optName + '" property in definition of option ' + optionType + '. ' +
        'It should be ' + expected
    );
}