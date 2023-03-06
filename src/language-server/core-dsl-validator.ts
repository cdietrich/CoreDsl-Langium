import { ValidationAcceptor, ValidationChecks } from 'langium';
import {  CoreDslAstType, DescriptionContent, Expression, InfixExpression, isCastExpression, isInfixExpression, isPostfixExpression, isPrefixExpression, isPrimaryExpression } from './generated/ast';
import type { CoreDslServices } from './core-dsl-module';
import { TypeProvider } from './core-dsl-typesystem';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: CoreDslServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.CoreDslValidator;
    const checks: ValidationChecks<CoreDslAstType> = {
        DescriptionContent: validator.checkPersonStartsWithCapital,
        Expression: validator.checkType
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class CoreDslValidator {

    checkType(e: Expression, accept: ValidationAcceptor): void {
        if (isPrimaryExpression(e) || isPostfixExpression(e) || isPrefixExpression(e)) {
            let type = TypeProvider.typeForExpression(e)
            if (type === undefined) {
                // TODO this doesn't necessarily make sense as a location (no property)
                accept('error', 'incompatible types used.', { node: e });
            }
        } else if(isCastExpression(e)) {
            let type = TypeProvider.typeForExpression(e)
            if (type === undefined) {
                accept('error', 'illegal type used', { node: e, property: "targetType" });
            }
        } else if (isInfixExpression(e)) {
            let infix = e as InfixExpression
            switch(infix.operator) {
                case '<':
					case '>':
					case '<=':
					case '>=':
					case '==':
					case '!=': {
                        let l = TypeProvider.typeForExpression(infix.left)
                        let r = TypeProvider.typeForExpression(infix.right)
                        if (!TypeProvider.isComparable(l,r)) {
                            accept('error', 'incompatible types used', { node: e, property: "operator" });
                        }
                        break;
                    }
						
					case '||':
					case '&&':
					case '<<':
					case '>>':
					case '+':
					case '-':
					case '*':
					case '/':
					case '%':
					case '|':
					case '^':
					case '&': {
                        let l = TypeProvider.typeForExpression(infix.left)
                        let r = TypeProvider.typeForExpression(infix.right)
                        if (!TypeProvider.isComparable(l,r)) {
                            accept('error', 'incompatible types used', { node: e, property: "operator" });
                        }
                        break;
                    }
						
					default: {
					} // '::'
            }
        }
    }

    checkPersonStartsWithCapital(person: DescriptionContent, accept: ValidationAcceptor): void {
        // for (var d of person.definitions) {
        //     accept('error', 'xxxxxxxxx', { node: d, property: 'name' })
        // }
        
        //     if (person.name) {
        //         const firstChar = person.name.substring(0, 1);
        //         if (firstChar.toUpperCase() !== firstChar) {
        //             accept('warning', 'Person name should start with a capital.', { node: person, property: 'name' });
        //         }
        //     }
    }
}
