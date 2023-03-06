import { AstNode, DiagnosticInfo, ValidationAcceptor, ValidationChecks } from 'langium';
import { Attribute, FunctionDefinition, Instruction ,Declaration, Declarator, CoreDef, CoreDslAstType, DescriptionContent, Expression, InfixExpression, InstructionSet, isCastExpression, isInfixExpression, isPostfixExpression, isPrefixExpression, isPrimaryExpression } from './generated/ast';
import type { CoreDslServices } from './core-dsl-module';
import { TypeProvider } from './core-dsl-typesystem';
import { integer } from 'vscode-languageclient';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: CoreDslServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.CoreDslValidator;
    const checks: ValidationChecks<CoreDslAstType> = {
        DescriptionContent: validator.checkPersonStartsWithCapital,
        CoreDef: validator.checkAttributeNamesISA,
        InstructionSet: validator.checkAttributeNamesISA,
        Instruction: validator.checkAttributeNamesInstruction,
        Declaration: validator.checkAttributeNamesDeclaration,
        Declarator: validator.checkAttributeNamesDeclarator,
        FunctionDefinition: validator.checkAttributeNamesFunctionDefinition
        // TODO is currently also disabled in Xtext variant Expression: validator.checkType
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */

type AttributeUsage = 'instruction' | 'function' | 'declaration'

const KnownAttributes = new Map<string, [integer, AttributeUsage]>([
    ["enable", [1, "instruction"]],
    ["hls", [0, "instruction"]],
    ["no_cont", [0, "instruction"]],
    ["cond", [0, "instruction"]],
    ["flush", [0, "instruction"]],
    ["do_not_synthesize", [0, "function"]],
    ["is_pc", [0, "declaration"]],
    ["is_main_reg", [0, "declaration"]],
    ["is_main_mem",[0,  "declaration"]],
    ["is_interlock_for", [1, "declaration"]],
    ["clk_budget", [1, "function"]],
    ["type", [1, "instruction"]]
])

export class CoreDslValidator {

    checkAttributeNamesISA(isa: CoreDef|InstructionSet, accept: ValidationAcceptor) : void {
		this.checkAttributes(isa.commonInstructionAttributes, 'instruction', accept, {node: isa, property: 'commonInstructionAttributes'});
	}

	checkAttributeNamesInstruction(instr: Instruction, accept: ValidationAcceptor) : void {
		this.checkAttributes(instr.attributes, 'instruction', accept, {node: instr, property: 'attributes'});
	}

	checkAttributeNamesDeclaration(decl: Declaration, accept: ValidationAcceptor) : void {
		this.checkAttributes(decl.attributes, 'declaration', accept, {node: decl, property: 'attributes'});
	}

	checkAttributeNamesDeclarator(decl: Declarator, accept: ValidationAcceptor) : void {
		this.checkAttributes(decl.attributes, 'declaration', accept, {node: decl, property: 'attributes'});
	}

	checkAttributeNamesFunctionDefinition(decl: FunctionDefinition, accept: ValidationAcceptor) : void {
		this.checkAttributes(decl.attributes, 'function', accept, {node: decl, property: 'attributes'});
	}

    

    checkAttributes<N extends AstNode>(attributes: Attribute[], expectedUsage: AttributeUsage, accept: ValidationAcceptor, feature: DiagnosticInfo<N>): void {
		for(var attribute of attributes) {
			let info = KnownAttributes.get(attribute.type);
			
			if(info === undefined || info[1] != expectedUsage) {
                accept('error', "unexpected attribute '" + attribute.type + "'", feature);
                return;
            }
			if(attribute.parameters.length != info[0])
                accept('error', "attribute '" + attribute.type + "' requires exactly " + info[0] + " parameter(s)", feature);
		}
	}



    checkType(e: Expression, accept: ValidationAcceptor): void {
        try {
            this.checkType2(e,accept)
        } catch(error) {
            console.log(error)
        }
    }

    checkType2(e: Expression, accept: ValidationAcceptor): void {
        if (isPrimaryExpression(e)) {
            let type = TypeProvider.typeForExpression(e)
            if (type === undefined) {
                // TODO this doesn't necessarily make sense as a location (no property)
                accept('error', 'incompatible types used.', { node: e, property: undefined });
            }
        } else if (isPostfixExpression(e)) {
            let type = TypeProvider.typeForExpression(e)
            if (type === undefined) {
                // TODO this doesn't necessarily make sense as a location (no property)
                accept('error', 'incompatible types used.', { node: e, property:'operator'});
            }
        } else if (isPrefixExpression(e)) {
            let type = TypeProvider.typeForExpression(e)
            if (type === undefined) {
                // TODO this doesn't necessarily make sense as a location (no property)
                accept('error', 'incompatible types used. ', { node: e, property: 'operator' });
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
                            accept('error', 'incompatible types used. ' + l + ' vs ' + r, { node: e, property: "operator" });
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
                            accept('error', 'incompatible types used. ' + l + ' vs ' + r, { node: e, property: "operator" });
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
