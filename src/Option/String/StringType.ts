import {OptionType, IOptionDefinition} from "../OptionType";
import {Tools} from "../../Tools/Tools";

export interface IStringOptionDefinition extends IOptionDefinition
{
    /**
     * Regular expression that property value will match
     */
    pattern: RegExp;

    /**
     * Specified max string length if it isn't null
     */
    maxLength: number;

    /**
     * Specifies min string length if it isn't null
     */
    minLength: number;
}

export class StringType extends OptionType
{
    public static getName(): string
    {
        return 'string';
    }

    public static getEmptyValue(): string
    {
        return '';
    }

    public validateValue(value: any): void
    {
        super.validateValue(value);

        if (value === null || value === undefined) {
            return;
        }
        let pattern = this.getPattern(),
            minLength = this.getMinLength(),
            maxLength = this.getMaxLength(),
            error = false;

        if (typeof value !== 'string') {
            error = true;
        }
        if (!error && pattern && !pattern.test(value)) {
            throw new Error(
                'The value "' + value + '" of the property ' + this + ' is not valid ' +
                'and should match the regular expression "' + pattern.toString() + '".'
            );
        }
        if (!error && minLength !== null && value.length < minLength) {
            throw new Error(
                'The value "' + value + '" of the property ' + this + ' is too short ' +
                'and should consist of at least ' + minLength + ' symbols.'
            );
        }
        if (!error && maxLength !== null && value.length > maxLength) {
            throw new Error(
                'The value "' + value + '" of the property "' + this + '" is too long ' +
                'and should be not longer than ' + maxLength + ' symbols.'
            );
        }
        if (error) {
            throw new Error(
                'Specified invalid value of option ' + this + '. ' +
                'It should be a string'
            );
        }
    }

    public generateValue(): string
    {
        let value = super.generateValue();

        if (this.isNullable() && value === null) {
            return value;
        }
        try {
            this.validateValue(value);

        } catch (e) {
            if (this.getMinLength() !== null && value.length < this.getMinLength()) {
                let diff = this.getMinLength() - value.length,
                    diffStr = '';

                for (let i = 0; i < diff; i++) {
                    diffStr += ' ';
                }
                return value += diffStr;

            } else if (this.getMaxLength() !== null && value > this.getMaxLength()) {
                return value.substr(0, this.getMaxLength());
            }
        }
        return value;
    }

    /**
     * Validates "pattern" attribute value
     *
     * @param {RegExp} pattern
     */
    public validatePattern(pattern: RegExp): void
    {
        if (
            pattern !== null
            && typeof pattern !== 'object'
            && !(<any>pattern instanceof RegExp)
        ) {
            throwInvalidOptionError('pattern', this, 'a RegExp instance or null');
        }
    }

    /**
     * Sets "maxLength" attribute value
     *
     * @param {(RegExp|null)} pattern
     */
    public setPattern(pattern: RegExp): void
    {
        this.validatePattern(pattern);
        (<IStringOptionDefinition>this.getDefinition()).pattern = pattern;
    }

    /**
     * Returns value of "pattern" attribute
     *
     * @returns {(RegExp|null)}
     */
    public getPattern(): RegExp
    {
        return (<IStringOptionDefinition>this.getDefinition()).pattern;
    }

    /**
     * Validates "maxLength" attribute value
     *
     * @param {*} maxLength
     */
    public validateMaxLength(maxLength: number): void
    {
        if (maxLength !== null && typeof maxLength !== 'number') {
            throwInvalidOptionError('maxLength', this, 'a number or null');
        }
    }

    /**
     * Sets "maxLength" attribute value
     *
     * @param {(number|null)} maxLength
     */
    public setMaxLength(maxLength: number): void
    {
        this.validateMaxLength(maxLength);
        (<IStringOptionDefinition>this.getDefinition()).maxLength = maxLength;
        this.validateMinMaxLengths();
    }

    /**
     * Returns value of "maxLength" attribute
     *
     * @returns {(number|null)}
     */
    public getMaxLength(): number
    {
        return (<IStringOptionDefinition>this.getDefinition()).maxLength;
    }

    /**
     * Validates "minLength" attribute value
     *
     * @param {*} minLength
     */
    public validateMinLength(minLength: number): void
    {
        if (minLength !== null && typeof minLength !== 'number') {
            throwInvalidOptionError('minLength', this, 'a number or null');
        }
    }

    /**
     * Sets "minLength" attribute value
     *
     * @param {(number|null)} minLength
     */
    public setMinLength(minLength: number): void
    {
        this.validateMinLength(minLength);
        (<IStringOptionDefinition>this.getDefinition()).minLength = minLength;
        this.validateMinMaxLengths();
    }

    /**
     * Returns value of "minLength" attribute
     *
     * @returns {(number|null)}
     */
    public getMinLength(): number
    {
        return (<IStringOptionDefinition>this.getDefinition()).minLength;
    }

    /**
     * Validates how minLength and maxLength are compatable
     */
    public validateMinMaxLengths(): void
    {
        let minLength = this.getMinLength(),
            maxLength = this.getMaxLength();

        if (minLength !== null && maxLength !== null && minLength > maxLength) {
            throw new Error(
                'The "maxLength" attribute value must be more than "minLength" attribute value ' +
                'in definition of property ' + this + ' must be number or null.'
            );
        }
    }

    public isCompatible(typeDef: OptionType): boolean
    {
        if (!super.isCompatible(typeDef)) {
            return false;
        }
        let testDef = <StringType>typeDef;

        if (this.getMaxLength() !== null && this.getMaxLength() < testDef.getMaxLength()) {
            return false;

        } else if (this.getMinLength() !== null && this.getMinLength() > testDef.getMinLength()) {
            return false;

        } else if (this.getPattern() !== null && this.getPattern() !== testDef.getPattern()) {
            return false;
        }
        return true;
    }

    /**
     * @inheritDoc
     */
    public getBaseDefinition(): IOptionDefinition
    {
        return Tools.extend(super.getBaseDefinition(), {

            /**
             * @inheritDoc
             */
            nullable: false,

            /**
             * Regular expression that property value will match
             * @type {(RegExp|null)}
             */
            pattern: null,

            /**
             * Specified max string length if it isn't null
             * @type {(number|null)}
             */
            maxLength: null,

            /**
             * Specifies min string length if it isn't null
             * @type {(number|null)}
             */
            minLength: null
        });
    }
}

function throwInvalidOptionError(optName: string, optionType: OptionType, expected: string): void
{
    throw new Error(
        'Specifeid invalid value of "' + optName + '" property in definition of option ' + optionType + '. ' +
        'It should be ' + expected
    );
}