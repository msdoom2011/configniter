import { IOptionDefinition } from './Option/OptionType';
import { Tools } from './Tools/Tools';

export interface IConvertSchemaRules
{
    /**
     * Selector
     *
     * It can be a name of option
     *
     * @example: "foo", "bar"...
     *
     * It is possible select by presence of specific attribute (ANY, not only "type" attribute!)
     *
     * @example: "[type=map]", "[type=string]"...
     *
     * Also it is possible specify several selectors separated by comma:
     *
     * @example: "foo, bar, [type=map], [type=string], [type=boolean]"
     *
     * And several values per attribute separated by "|" sign:
     *
     * @example: "[type=map|string|number]"
     *
     * Or mix several types of selectors:
     *
     * @example: "foo[value=10]"
     *
     * It also possible specify "*" key if you need to override attributes in all options in schema
     *
     * @example: "*"
     *
     * If you need override attributes in all option types except some special ones,
     * you can specify them after ANY valid selector using ":not(...)" construction.
     *
     * Notice:
     *
     * Inside the ":not(...)" construction allows use only selectors
     * without another ":not(...)" constructions
     *
     * @example: "*:not([type=map],[type=objectCollection],[type=arrayCollection])"
     */
    [selector: string]: {
        /**
         * attrName is name of attributes in IOptionDefinition object
         * If value of attribute specified undefined then it attribute
         * will be removed in all corresponding option type definitions
         * in specified schema
         */
        [attrName: string]: any;
    };
}

interface IRuleInfo
{
    selector: string;

    attrs: { [attrName: string]: any };

    priority: number;
}

export class ConfigSchemaConverter
{
    public static convert(
        optName: string,
        schema: IOptionDefinition | { [optName: string]: IOptionDefinition },
        rules: IConvertSchemaRules
    ): IOptionDefinition | { [optName: string]: IOptionDefinition }
    {
        const rulesNormalized = this.normalizeRules(rules);

        if (typeof schema['type'] === 'string') {
            for (const rule of rulesNormalized) {
                if (!this.isMatchSelector(optName, schema, rule.selector)) {
                    continue;
                }

                for (const attrName in rule.attrs) {
                    if (!rule.attrs.hasOwnProperty(attrName)) {
                        continue;
                    }

                    if (rule.attrs[attrName] === undefined) {
                        delete schema[attrName];

                    } else {
                        schema[attrName] = rule.attrs[attrName];
                    }
                }
            }

            for (const attrName in schema) {
                if (
                    schema.hasOwnProperty(attrName)
                    && Tools.isPlainObject(schema[attrName])
                ) {
                    schema[attrName] = this.convert(attrName, schema[attrName], rules);
                }
            }

        } else if (Tools.isPlainObject(schema)) {
            for (const optName in schema) {
                if (schema.hasOwnProperty(optName)) {
                    schema[optName] = this.convert(optName, schema[optName], rules);
                }
            }
        }

        return schema;
    }

    private static normalizeRules(rulesRaw: IConvertSchemaRules): Array<IRuleInfo>
    {
        const rules: Array<IRuleInfo> = [];

        // Normalizing rules

        for (const selector in rulesRaw) {
            if (!rulesRaw.hasOwnProperty(selector)) {
                continue;
            }

            const groups: Array<string> = [];
            const groupedSelector = selector.replace(/\([^\)]+\)/ig, function(group: string): string {
                groups.push(group);
                return "$group_" + (groups.length - 1);
            });
            const subSelectors = groupedSelector.split(/\s*,\s*/i);

            for (let subSelector of subSelectors) {
                const searchGroupResult = subSelector.match(/\$group_(\d+)/i);

                if (searchGroupResult) {
                    subSelector = subSelector.replace(/\$group_\d+/i, groups[Number(searchGroupResult[1])]);
                }

                rules.push({
                    selector: subSelector,
                    attrs: rulesRaw[selector],
                    priority: this.getSelectorPriority(subSelector)
                });
            }
        }

        // Sorting rules

        rules.sort((a: IRuleInfo, b: IRuleInfo) => {
            if (a.priority > b.priority) {
                return 1;

            } else if (a.priority < b.priority) {
                return -1;

            } else {
                return 0;
            }
        });

        return rules;
    }

    private static getSelectorPriority(selector: string): number
    {
        if (selector === "*") {
            return 0;

        } else if (selector.indexOf("*") > 0) {
            return 10;

        } else {
            return 100;
        }
    }

    private static isMatchSelector(
        optName: string,
        optDefinition: IOptionDefinition | { [optionName: string]: IOptionDefinition },
        selector: string
    ): boolean
    {
        const parsedSelector = this.parseSelector(selector);

        if (!parsedSelector) {
            return false;
        }

        if (parsedSelector.name && parsedSelector.name !== optName) {
            return false;
        }

        for (let attr of parsedSelector.attrs) {
            const attrParsedResult = attr.match(/^([a-z0-9_]+)\s*=\s*(.+)$/i);

            if (!attrParsedResult) {
                return false;
            }

            const attrName = attrParsedResult[1];
            const attrValue = attrParsedResult[2];

            if (!optDefinition.hasOwnProperty(attrName)) {
                return false;
            }

            if (attrValue && !attrValue.split('|').some((value: any) => Tools.isEqual(
                    String(value),
                    String(optDefinition[attrName])
                ))) {
                return false;
            }
        }

        for (let negationSelector of parsedSelector.negation) {
            if (this.isMatchSelector(optName, optDefinition, negationSelector)) {
                return false;
            }
        }

        return true;
    }

    private static parseSelector(selector: string): { name: string, attrs: string[], negation: string[] } | undefined
    {
        const matchResult = selector.match(/^([^:]+)(?::\s*not\s*\(([^\)]+(?=\))))?/i);

        let negation: string[] = [];
        let attrsSelector: string[] = [];
        let nameSelector: string = '';

        if (!matchResult) {
            return;
        }

        if (matchResult[1]) {
            const nameMatchResult = matchResult[1].match(/^[$a-z0-9_-]+/i);
            const attrsMatchResult = matchResult[1].match(/[^\]\[]+(?=\])+/ig);

            if (nameMatchResult) {
                nameSelector = nameMatchResult[0];
            }

            if (attrsMatchResult) {
                attrsSelector = <string[]>attrsMatchResult;
            }
        }

        if (matchResult[2]) {
            negation = matchResult[2].trim().split(/\s*,\s*/i);
        }

        return {
            name: nameSelector,
            attrs: attrsSelector,
            negation: negation
        };
    }
}