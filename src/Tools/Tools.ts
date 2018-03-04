export type IConstructor<T> = new (...args: Array<any>) => T;

export class Tools
{
    /**
     * Extends target object or array with source object or array without recursion.<br /><br />
     *
     * Every property in the source object or array will replace
     * already existed property with the same name in the target object or array.
     *
     * @param {(Object|Array)} target
     *      An object which will receive properties from source object
     *
     * @param {(Object|Array)} source
     *      An object which properties will be transferred to the target object
     *
     * @returns {(Object|Array)}
     *      Returns the target object after it was extended
     */
    static extend(target: any, source: any): any
    {
        if (typeof target !== 'object' && typeof source !== 'object') {
            return target;
        }

        if (
            (!Array.isArray(target) && Array.isArray(source))
            || (Array.isArray(target) && !Array.isArray(source))
        ) {
            return target;
        }

        if (Array.isArray(target)) {
            for (const sourcePropValue of source) {
                target.push(sourcePropValue);
            }

        } else {
            for (const propName in source) {
                if (!source.hasOwnProperty(propName)) {
                    continue;
                }

                if (Array.isArray(source[propName])) {
                    target[propName] = [];
                    target[propName] = target[propName].concat(source[propName]);

                } else {
                    target[propName] = source[propName];
                }
            }
        }

        return target;
    }

    /**
     * Copies all properties from source to target with recursion call.<br /><br />
     *
     * Every property in the source object or array will replace
     * already existed property with the same name in the target object or array.
     *
     * @param {(Object|Array)} target
     *      Target object which will extended by properties from source object
     *
     * @param {(Object|Array)} source
     *      Source object which properties will added to target object
     *
     * @param {(Function|boolean)} [mergeArrays=false]
     * <pre>
     * If was passed true it means that elements from source array properties
     * will be added to according array properties in target.
     *
     * Else if it was passed false (by default) it means that array properties
     * from source object will replace array properties in target object.
     *
     * If was passed a function it means that will added all element from array
     * property in source to according array property in target if specified
     * function returns true.
     *
     * Example: function (targetArrayPropertyElement, sourceArrayPropertyElement) {
     *     return targetArrayPropertyElement.name != sourceArrayPropertyElement.name;
     * });
     * </pre>
     * @param {Function|boolean} [mergeArrays=false]
     */
    static extendDeep(target: any, source: any, mergeArrays: any = false): any
    {
        let comparator: any = false;

        if (
            !mergeArrays
            || (
                typeof mergeArrays !== "boolean"
                && typeof mergeArrays !== "function"
            )
        ) {
            mergeArrays = false;
        }

        if (typeof mergeArrays === 'function') {
            comparator = mergeArrays;
            mergeArrays = true;
        }

        // Handle case when target is a string or something

        if (typeof target !== "object" && typeof target !== 'function') {
            target = {};
        }

        // Extend the base object

        for (let propName in source) {
            let sourceItemIsArray: boolean;
            let clone: any;

            if (!source.hasOwnProperty(propName)) {
                continue;
            }

            // Prevent never-ending loop

            if (target === source[propName]) {
                continue;
            }

            // Recourse if we're merging plain objects or arrays

            if (
                source[propName]
                && (
                    this.isPlainObject(source[propName])
                    || (
                        mergeArrays
                        && (sourceItemIsArray = Array.isArray(source[propName]))
                    )
                )
            ) {
                // If copying array

                if (sourceItemIsArray && mergeArrays) {
                    sourceItemIsArray = false;
                    clone = [];

                    if (target[propName] && Array.isArray(target[propName])) {
                        for (const sourcePropValue of source[propName]) {
                            if (
                                !comparator
                                || (
                                    typeof comparator === 'function'
                                    && !isEqual(target[propName], sourcePropValue)
                                )
                            ) {
                                target[propName].push(sourcePropValue);
                            }
                        }

                        continue;
                    }

                    // If copying non array

                } else {
                    clone = target[propName] && this.isPlainObject(target[propName])
                        ? target[propName]
                        : {}
                    ;
                }

                // Never move original objects, clone them

                target[propName] = this.extendDeep.call(
                    this,
                    clone,
                    source[propName],
                    comparator || mergeArrays
                );

                // Don't bring in undefined values

            } else {
                target[propName] = source[propName];
            }
        }

        // Return the modified object

        return target;

        function isEqual(target: Array<any>, element: any): boolean {

            for (const targetElement of target) {
                if (comparator(targetElement, element)) {
                    return true;
                }
            }

            return false;
        }
    }

    /**
     * Returns a copy of passed object or array
     *
     * @param {*} arg
     *      The argument which you want to copy
     *
     * @returns {*}
     *      The copy of passed argument
     */
    static copy(arg: any): any
    {
        let newObj: any;

        if (
            arg
            && typeof arg === 'object'
            && (
                arg.constructor === Object
                || Array.isArray(arg)
            )
        ) {
            newObj = !Array.isArray(arg) ? Object.create(Object.getPrototypeOf(arg)) : [];
            newObj = this.extendDeep(newObj, arg, true);

        } else {
            newObj = arg;
        }

        return newObj;
    }

    /**
     * Checks whether two arguments are equals
     *
     * @param {*} arg1
     *      The left side operand
     *
     * @param {*} arg2
     *      The right side operand
     */
    static isEqual(arg1: any, arg2: any): boolean
    {
        if (typeof arg1 === 'function' && typeof arg2 === 'function') {
            return true;
        }

        if (typeof arg1 !== 'object' && typeof arg2 !== 'object') {
            return arg1 === arg2;
        }

        if (typeof arg1 !== typeof arg2) {
            return false;
        }

        if ((!arg1 && arg2) || (arg1 && !arg2)) {
            return false;
        }

        if (!arg1 && !arg2) {
            return true;
        }

        if (arg1.constructor !== arg2.constructor) {
            return false;
        }

        if (Array.isArray(arg1)) {
            if (arg1.length !== arg2.length) {
                return false;
            }

            for (let i = 0; i < arg1.length; i++) {
                if (this.isEqual(arg1[i], arg2[i]) === false) {
                    return false;
                }
            }

            return true;
        }
        if (this.isPlainObject(arg1)) {
            if (Object.keys(arg1).length !== Object.keys(arg2).length) {
                return false;
            }

            for (const propName in arg1) {
                if (arg1.hasOwnProperty(propName)) {
                    if (this.isEqual(arg1[propName], arg2[propName]) === false) {
                        return false;
                    }
                }
            }

            return true;
        }

        return arg1 === arg2;
    }

    /**
     * Returns array with unique elements
     *
     * @param {Array} array
     *      The array which contains duplicate elements
     * @param {Function} [compareFunc]
     *      A function which compare elements of the array between each other
     */
    static unique(array: Array<any>, compareFunc?: Function): Array<any>
    {
        const uniqueArray = [];

        if (!Array.isArray(array)) {
            return array;
        }

        for (let item of array) {
            if (!compareFunc && uniqueArray.indexOf(item) < 0) {
                uniqueArray.push(item);

            } else if (compareFunc && typeof compareFunc === 'function') {
                for (let uniqItem of uniqueArray) {
                    if (compareFunc(item, uniqItem) !== true) {
                        uniqueArray.push(item);
                    }
                }
            }
        }

        return uniqueArray;
    }

    /**
     * Returns difference between newValue and oldValue
     * It is actual only if new value is a plain object or an array.
     * In other cases it will return just the same as getNewValue method.
     *
     * @returns {*}
     */
    public static diff(obj1: any, obj2: any): any
    {
        return defineDiffValue(obj1, obj2);

        function defineDiffValue(newValue: any, oldValue: any): any {
            let diff: any;

            if (
                Array.isArray(newValue)
                && Array.isArray(oldValue)
            ) {
                diff = [];

                for (let i = 0; i < newValue.length; i++) {
                    if (!Tools.isEqual(newValue[i], oldValue[i])) {
                        diff[i] = defineDiffValue(newValue[i], oldValue[i]);
                    }
                }

            } else if (
                Tools.isPlainObject(newValue)
                && Tools.isPlainObject(oldValue)
            ) {
                diff = {};

                for (let propName in newValue) {
                    if (newValue.hasOwnProperty(propName)) {
                        if (!Tools.isEqual(newValue[propName], oldValue[propName])) {
                            diff[propName] = defineDiffValue(newValue[propName], oldValue[propName]);
                        }
                    }
                }
            } else {
                diff = newValue;
            }

            return Tools.copy(diff);
        }
    }

    static classify(str: string): string
    {
        str = String(str);

        if (!str) {
            return "";
        }

        str = str.replace(/[^a-z0-9]+/ig, '-');
        str = str.replace(/(^-)|(-$)/g, '');
        str = str.replace(/([a-z])([A-Z])/g, '$1-$2');
        str = str.replace(/^-+/i, '');

        return str.toLowerCase();
    }

    /**
     * Checks if passed value is empty
     *
     * @param {*} value
     *      The value you want to check if it's empty
     */
    static isEmpty(value: any): boolean
    {
        return (
            !value
            || (this.isPlainObject(value) && Object.keys(value).length === 0)
            || (Array.isArray(value) && value.length === 0)
        );
    }

    /**
     * Checks if passed value is a plain object
     *
     * @param {*} value
     *      The value you want to check if it's a plain object
     */
    static isPlainObject(value: any): boolean
    {
        return (
            value
            && typeof value === "object"
            && value.constructor === Object
        );
    }

    /**
     * Returns suffix that is next to parsed number in passed string.
     *
     * @param {string} numeric
     *      The value that contains not numbers at the end of string.
     */
    static getNumberSuffix(numeric: number|string): string
    {
        if (typeof numeric === 'number' || !numeric) {
            return "";
        }

        const result = (<string>numeric).match(/[^0-9]+$/);

        if (result && result.length) {
            return result[0];
        }

        return "";
    }

    /**
     * Returns the number precision
     *
     * @param {(string|number)} numeric
     *      The numeric string or number
     */
    static getNumberPrecision(numeric: string|number): number
    {
        if (isNaN(parseFloat(<string>numeric))) {
            return 0;
        }

        numeric = String(numeric);

        const result = (<string>numeric).match(/\.([0-9]+)/i);

        return result ? result[1].length : 0;
    }

    static roundNumber(num: number, precision?: number): number
    {
        if (typeof num !== 'number') {
            num = Number(num);
        }

        if (!precision) {
            return Math.round(num);
        }

        return parseFloat(num.toFixed(precision));
    }

    /**
     * Returns name of getter function for the class property with specified name
     *
     * @param {string} propertyName
     *      A name of the class typed property defined in $_properties parameter
     */
    static generateGetterName(propertyName: string): string
    {
        return this._generateAccessorName("get", propertyName);
    }

    /**
     * Returns name of setter function for the class property with specified name
     *
     * @param {string} propertyName
     *      A name of the class typed property defined in $_properties parameter
     */
    static generateSetterName (propertyName: string): string
    {
        return this._generateAccessorName("set", propertyName);
    }

    /**
     * Returns name of checker function for the class property with specified name
     *
     * @param {string} propertyName
     *      A name of the class typed property defined in $_properties parameter
     */
    static generateCheckerName(propertyName: string): string
    {
        return this._generateAccessorName("is", propertyName);
    }

    /**
     * Returns name of checker function for the class property with specified name
     *
     * @param {string} propertyName
     *      A name of the class typed property defined in $_properties parameter
     */
    static generateValidatorName(propertyName: string): string
    {
        return this._generateAccessorName("validate", propertyName);
    }

    /**
     * Generates class property accessor function name
     *
     * @param {string} accessorType
     *      Can be "get", "set", "is"
     *
     * @param {string} propertyName
     *      A name of the class typed property defined in $_properties parameter
     */
    private static _generateAccessorName(accessorType: string, propertyName: string): string
    {
        const propNameParts = propertyName.split(/[_-]/);

        for (let i = 0; i < propNameParts.length; i++) {
            if (propNameParts[i] !== "") {
                propNameParts[i] = propNameParts[i][0].toUpperCase() + propNameParts[i].substr(1);
            }
        }

        return accessorType + propNameParts.join("");
    }
}