import { FormatOptions } from "date-fns";
import {
    create,
    all,
    MathNode,
    MathJsInstance,
    ConstantNode,
    SymbolNode,
} from "mathjs";

// Create and configure a math.js instance
const math: MathJsInstance = create(all, {});

// Import custom functions for base conversion.
math.import(
    {
        inHex: (val: FormatOptions) => math.format(val, { notation: "hex" }),
        inOctal: (val: FormatOptions) => math.format(val, { notation: "oct" }),
        inBinary: (val: FormatOptions) => math.format(val, { notation: "bin" }),
        inDecimal: (val: FormatOptions) => val,
    },
    { override: true },
);

function isConstantNode(node: MathNode): node is ConstantNode {
    return (node as ConstantNode).isConstantNode === true;
}

function isSymbolNode(node: MathNode): node is SymbolNode {
    return (node as SymbolNode).isSymbolNode === true;
}

/**
 * Check if a character is a Chinese character
 */
function isChineseChar(char: string): boolean {
    return /[\u4e00-\u9fa5]/.test(char);
}

/**
 * Check if a string contains Chinese characters
 */
function containsChinese(str: string): boolean {
    return /[\u4e00-\u9fa5]/.test(str);
}

/**
 * Check if a character is valid for variable names (including Chinese)
 */
// function isValidVariableChar(char: string): boolean {
//     return math.parse.isAlpha(char) || containsChinese(char) || char === '_' || char === ' ';
// }

// Type Definitions
export interface EvaluationResult {
    raw: any;
    formatted: string;
    isAssignment: boolean;
    variableName?: string;
}

// Pre-processing Engine
function preprocessExpression(expression: string): string {
    return (
        expression
            // Replace currency symbols with ISO codes (e.g., ￥ -> CNY)
            .replace(/￥/g, "CNY")
            .replace(/£/g, "GBP")
            .replace(/\$/g, "USD")
            .replace(/€/g, "EUR")
            // Convert "per" to division (e.g., "per hour" -> "/hour")
            .replace(/\s+per\s+/gi, "/")
            // Transform "X to Y" into a difference (Y - X)
            .replace(/(\d+)\s+to\s+(\d+)/g, "($2 - $1)")
            // Convert "to the power of" to "^"
            .replace(/\bto the power of\b/gi, "^")
            // Add spaces around "mod" for consistent parsing
            .replace(/\bmod\b/gi, " mod ")
            // Normalize feet and inches (e.g., "5 feet 6 inches" -> "(5 ft + 6 in)")
            .replace(
                /(\d+)\s*(?:foot|feet)\s*(\d+)\s*(?:inch|inches)/gi,
                "($1 ft + $2 in)",
            )
            // Normalize hours and minutes (e.g., "1 hour 30 minutes" -> "(1 hr + 30 min)")
            .replace(
                /(\d+)\s*(?:hr|hour|hours)\s*(\d+)\s*(?:min|minute|minutes)/gi,
                "($1 hr + $2 min)",
            )
            // Convert percentage phrases to formulas (e.g., "A as a % of B" -> "((A) / (B)) in %")
            .replace(/(.+) as a % of (.+)/gi, "(($1) / ($2)) in %")
            .replace(/(.+) as a % on (.+)/gi, "((($1) - ($2)) / ($2)) in %") // Percentage increase
            .replace(/(.+) as a % off (.+)/gi, "((($2) - ($1)) / ($2)) in %") // Percentage decrease
            // Standardize number base notations (e.g., "in hexadecimal" -> "inHex")
            .replace(/\s+in\s+(hexadecimal|hex)\b/gi, " inHex")
            .replace(/\s+in\s+octal\b/gi, " inOctal")
            .replace(/\s+in\s+binary\b/gi, " inBinary")
            .replace(/\s+in\s+decimal\b/gi, " inDecimal")
            // Sanitize "line N" references (e.g., "line 1" -> "_line1")
            .replace(/line (\d+)/gi, "_line$1")
    );
}

function formatResult(result: any): string {
    if (result instanceof Date) {
        const options: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        };
        if (
            result.getHours() === 0 &&
            result.getMinutes() === 0 &&
            result.getSeconds() === 0
        ) {
            delete options.hour;
            delete options.minute;
            delete options.second;
        }
        return result.toLocaleString(undefined, options);
    }

    if (typeof result === "function" || typeof result === "undefined") {
        return "";
    }

    return math.format(result, { precision: 14 });
}

export function evaluateLine(
    expression: string,
    scope: Record<string, any>,
): EvaluationResult | null {
    const trimmedExpression = expression.trim();
    if (!trimmedExpression) {
        return null;
    }

    try {
        const assignmentMatch = trimmedExpression.match(
            /^([\u4e00-\u9fa5a-zA-Z0-9\s_]+)\s*=\s*(.*)$/,
        );

        // Variable
        if (assignmentMatch) {
            const variableName = assignmentMatch[1].trim();
            const valueExpression = assignmentMatch[2];

            // Check if variable name is a pure number (should exclude Chinese variables)
            if (/^\d+$/.test(variableName.trim())) {
                return null;
            }

            const processedValue = preprocessExpression(valueExpression);

            // Handle Chinese variable names by replacing them with valid identifiers
            let finalExpression = processedValue;
            let tempScope = { ...scope };
            const chineseVarMap: Record<string, string> = {};

            // Find and replace Chinese variables in the expression
            if (containsChinese(processedValue)) {
                let varCounter = 0;
                finalExpression = processedValue.replace(/[\u4e00-\u9fa5a-zA-Z0-9_]+/g, (match) => {
                    if (containsChinese(match)) {
                        const tempVar = `_temp_var_${varCounter++}`;
                        chineseVarMap[match] = tempVar;
                        tempScope[tempVar] = scope[match] || 0;
                        return tempVar;
                    }
                    return match;
                });
            }

            const value = math.evaluate(finalExpression, tempScope);
            const formatted = formatResult(value);

            return {
                raw: value,
                formatted: formatted,
                isAssignment: true,
                variableName: variableName,
            };
        }

        const processedExpression = preprocessExpression(trimmedExpression);

        // Handle Chinese variables in non-assignment expressions
        let finalExpression = processedExpression;
        let tempScope = { ...scope };

        if (containsChinese(processedExpression)) {
            let varCounter = 0;
            finalExpression = processedExpression.replace(/[\u4e00-\u9fa5a-zA-Z0-9_]+/g, (match) => {
                if (containsChinese(match)) {
                    const tempVar = `_temp_var_${varCounter++}`;
                    tempScope[tempVar] = scope[match] || 0;
                    return tempVar;
                }
                return match;
            });
        }

        const node = math.parse(finalExpression);
        const result = node.evaluate(tempScope);

        if (typeof result === "function" || typeof result === "undefined") {
            return null;
        }

        const formatted = formatResult(result);

        if (isConstantNode(node)) {
            // It"s a single number (e.g. "100"), always show the result.
            return { raw: result, formatted, isAssignment: false };
        }

        if (isSymbolNode(node) && scope.hasOwnProperty(node.name)) {
            // It"s a variable that exists in our scope (e.g. "VAT"), always show the result.
            // After the type guard, TypeScript knows that "node" has a "name" property.
            return { raw: result, formatted, isAssignment: false };
        }

        // For complex expressions, don"t show a result if it"s just a restatement of the input
        // if (formatted.replace(/\s/g, "") === processedExpression.replace(/\s/g, "")) {
        //     return null;
        // }

        return { raw: result, formatted, isAssignment: false };
    } catch (error) {
        return null;
    }
}
