import { ValidationAcceptor, ValidationChecks } from 'langium';
import { CoreDslAstType, DescriptionContent } from './generated/ast';
import type { CoreDslServices } from './core-dsl-module';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: CoreDslServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.CoreDslValidator;
    const checks: ValidationChecks<CoreDslAstType> = {
        DescriptionContent: validator.checkPersonStartsWithCapital
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class CoreDslValidator {

    checkPersonStartsWithCapital(person: DescriptionContent, accept: ValidationAcceptor): void {
    //     if (person.name) {
    //         const firstChar = person.name.substring(0, 1);
    //         if (firstChar.toUpperCase() !== firstChar) {
    //             accept('warning', 'Person name should start with a capital.', { node: person, property: 'name' });
    //         }
    //     }
    }

}
