import { AstNode, getContainerOfType } from "langium"
import { integer } from "vscode-languageclient"
import { CoreDef, InstructionSet, BitField, BitValue, BoolConstant, BoolTypeSpecifier, CastExpression, CharacterConstant, ConditionalExpression, Declarator, Encoding, EntityReference, EnumTypeSpecifier, FloatConstant, FloatTypeSpecifier, FunctionCallExpression, FunctionDefinition, InfixExpression, IntegerTypeSpecifier, MemberAccessExpression, NamedEntity, ParenthesisExpression, PostfixExpression, PrefixExpression, StringConstant, StringLiteral, UserTypeSpecifier, VoidTypeSpecifier, isAssignmentExpression, isBitField, isBitValue, isBoolConstant, isBoolTypeSpecifier, isCastExpression, isCharacterConstant, isConditionalExpression, isDeclarator, isEncoding, isEntityReference, isEnumTypeSpecifier, isFloatConstant, isFloatTypeSpecifier, isFunctionCallExpression, isFunctionDefinition, isInfixExpression, isIntegerTypeSpecifier, isMemberAccessExpression, isNamedEntity, isParenthesisExpression, isPostfixExpression, isPrefixExpression, isStringConstant, isStringLiteral, isUserTypeSpecifier, isVoidTypeSpecifier, isArrayAccessExpression, ArrayAccessExpression, AssignmentExpression, isDeclaration, IntegerConstant, isIntegerConstant, Expression, isCoreDef, isInstructionSet, Declaration } from "./generated/ast"


type Type = 'VOID' | 'COMPOSITE' | 'INTEGRAL_SIGNED' | 'INTEGRAL_UNSIGNED' | 'FLOAT'


export class DataType {
    type: Type
    size: integer

    constructor(type: Type, size: integer) {
        this.type = type
        this.size = size
    }

    public toString(): string {
        return this.type + ' ' + this.size;
    }

}

export const boolType = new DataType('INTEGRAL_SIGNED', 1)

export class TypeProvider {

    public static isIntegral(dt: DataType) : boolean {
		return dt.size > 0 && (dt.type == 'INTEGRAL_SIGNED' || dt.type=='INTEGRAL_UNSIGNED')
    }

    static isComparable(left: DataType | undefined , right: DataType | undefined) : boolean{
        if (left === undefined || right == undefined) {
            return false;
        }
        if (left.size > 0 && right.size > 0) {
            if (left.type == 'FLOAT' && right.type == 'FLOAT')
                return true
            if (left.type == right.type)
                return true
        }
        return false
    }

    static typeForExpression(e: Expression) : DataType | undefined {
        var p : CoreDef | InstructionSet | undefined = getContainerOfType(e, isCoreDef)
        if (p === undefined) {
            p = getContainerOfType(e, isInstructionSet)
        }
        return TypeProvider.typeFor(e, p!)
    }

    static typeFor(e: AstNode, ctx: CoreDef|InstructionSet|undefined) : DataType | undefined {
        if (ctx === undefined) {
            return undefined;
        }
        if (isBoolConstant(e)) {
            return TypeProvider.typeForBoolConstant(e as BoolConstant, ctx);
          } else if (isCharacterConstant(e)) {
            return TypeProvider.typeForCharacterConstant(e as CharacterConstant, ctx);
          } else if (isFloatConstant(e)) {
            return TypeProvider.typeForFloatConstant(e as FloatConstant, ctx);
          } else if (isIntegerConstant(e)) {
            return TypeProvider.typeForIntegerConstant(e as IntegerConstant, ctx);
          } else if (isStringConstant(e)) {
            return TypeProvider.typeForStringConstant(e as StringConstant, ctx);
          } else if (isBoolTypeSpecifier(e)) {
            return TypeProvider.typeForBoolTypeSpecifier(e as BoolTypeSpecifier, ctx);
          } else if (isEntityReference(e)) {
            return TypeProvider.typeForEntityReference(e as EntityReference, ctx);
          } else if (isEnumTypeSpecifier(e)) {
            return TypeProvider.typeForEnumTypeSpecifier(e as EnumTypeSpecifier, ctx);
          } else if (isFloatTypeSpecifier(e)) {
            return TypeProvider.typeForFloatTypeSpecifier(e as FloatTypeSpecifier, ctx);
          } else if (isIntegerTypeSpecifier(e)) {
            return TypeProvider.typeForIntegerTypeSpecifier(e as IntegerTypeSpecifier, ctx);
          } else if (isParenthesisExpression(e)) {
            return TypeProvider.typeForParenthesisExpression(e as ParenthesisExpression, ctx);
          } else if (isArrayAccessExpression(e)) {
            return TypeProvider.typeForArrayAccessExpression(e as ArrayAccessExpression, ctx);
          } else if (isAssignmentExpression(e)) {
            return TypeProvider.typeForAssignmentExpression(e as AssignmentExpression, ctx);
          } else if (isBitField(e)) {
            return TypeProvider.typeForBitField(e as BitField, ctx);
          } else if (isBitValue(e)) {
            return TypeProvider.typeForBitValue(e as BitValue, ctx);
          } else if (isCastExpression(e)) {
            return TypeProvider.typeForCastExpression(e as CastExpression, ctx);
          } else if (isConditionalExpression(e)) {
            return TypeProvider.typeForConditionalExpression(e as ConditionalExpression, ctx);
          } else if (isDeclarator(e)) {
            return TypeProvider.typeForDeclarator(e as Declarator, ctx);
          } else if (isFunctionCallExpression(e)) {
            return TypeProvider.typeForFunctionCallExpression(e as FunctionCallExpression, ctx);
          } else if (isFunctionDefinition(e)) {
            return TypeProvider.typeForFunctionDefinition(e as FunctionDefinition, ctx);
          } else if (isInfixExpression(e)) {
            return TypeProvider.typeForInfixExpression(e as InfixExpression, ctx);
          } else if (isMemberAccessExpression(e)) {
            return TypeProvider.typeForMemberAccessExpression(e as MemberAccessExpression, ctx);
          } else if (isPostfixExpression(e)) {
            return TypeProvider.typeForPostfixExpression(e as PostfixExpression, ctx);
          } else if (isPrefixExpression(e)) {
            return TypeProvider.typeForPrefixExpression(e as PrefixExpression, ctx);
          } else if (isUserTypeSpecifier(e)) {
            return TypeProvider.typeForUserTypeSpecifier(e as UserTypeSpecifier, ctx);
          } else if (isVoidTypeSpecifier(e)) {
            return TypeProvider.typeForVoidTypeSpecifier(e as VoidTypeSpecifier, ctx);
          } else if (isEncoding(e)) {
            return TypeProvider.typeForEncoding(e as Encoding, ctx);
          } else if (isNamedEntity(e)) {
            return TypeProvider.typeForNamedEntity(e as NamedEntity, ctx);
          } else if (isStringLiteral(e)) {
            return TypeProvider.typeForStringLiteral(e as StringLiteral, ctx);
          } else {
            // TODO
            return undefined
          }
    }

    static typeForEnumTypeSpecifier(e: EnumTypeSpecifier, ctx: CoreDef|InstructionSet) : DataType | undefined {
        return new DataType('INTEGRAL_SIGNED', 32)
    }

    static typeForUserTypeSpecifier(e: UserTypeSpecifier, ctx: CoreDef|InstructionSet) : DataType | undefined {
        return new DataType('COMPOSITE', 0)
    }
    
    static typeForVoidTypeSpecifier(e: VoidTypeSpecifier, ctx: CoreDef|InstructionSet) : DataType | undefined {
		return new DataType('VOID', 0)    	
    }
    
    static typeForFloatTypeSpecifier(e: FloatTypeSpecifier, ctx: CoreDef|InstructionSet) : DataType | undefined {
        if (e.shorthand == 'double') {
            return new DataType('FLOAT', 64)
        }
        return new DataType('FLOAT', 32)
    }
    
    static typeForBoolTypeSpecifier(e: BoolTypeSpecifier, ctx: CoreDef|InstructionSet) : DataType | undefined {
    	return new DataType('INTEGRAL_SIGNED', 1) 
    }

    static typeForIntegerTypeSpecifier(e: IntegerTypeSpecifier, ctx: CoreDef|InstructionSet) : DataType | undefined {
        let isUnsigned = e.signedness == 'unsigned'
        if (e.size !== undefined) {
            // TODO
            //val sizeValue = e.size.valueFor(EvaluationContext.root(ctx))
            //if(sizeValue === null || !(sizeValue.value instanceof BigInteger)) return null
            let sizeInt =  10 // (sizeValue.value as BigInteger).intValue
            let result = isUnsigned ? new DataType('INTEGRAL_UNSIGNED', sizeInt) : new DataType('INTEGRAL_SIGNED', sizeInt) 
            return result
        } else {
            if ( e.shorthand == "char") {
                return isUnsigned ? new DataType('INTEGRAL_UNSIGNED', 8) : new DataType('INTEGRAL_SIGNED', 8) 
            } else if (e.shorthand == 'short') {
                return isUnsigned ? new DataType('INTEGRAL_UNSIGNED', 16) : new DataType('INTEGRAL_SIGNED', 16) 
            } else if (e.shorthand  == 'int') {
                return isUnsigned ? new DataType('INTEGRAL_UNSIGNED', 32) : new DataType('INTEGRAL_SIGNED', 32) 
            } else if (e.shorthand == 'long') {
                return isUnsigned ? new DataType('INTEGRAL_UNSIGNED', 64) : new DataType('INTEGRAL_SIGNED', 64) 
            } else {
                return undefined
                // TODO
            }
        }
   }

    static typeForAssignmentExpression(e: AssignmentExpression, ctx: CoreDef|InstructionSet) : DataType | undefined {
        return TypeProvider.typeFor(e.value, ctx);
    }

    static typeForConditionalExpression(e: ConditionalExpression, ctx: CoreDef|InstructionSet) : DataType | undefined {
        return TypeProvider.typeFor(e.thenExpression, ctx)
    }

    static typeForInfixExpression(e: InfixExpression, ctx: CoreDef|InstructionSet) : DataType | undefined {
        switch(e.operator) {
            case "||":
            case "&&":
            case "==":
            case "!=":
            case "<":
            case ">":
            case "<=":
            case ">=": {
                return boolType;
                break;
            }
            case "|":
            case "&":
            case "^": {
                let left = TypeProvider.typeFor(e.left, ctx)
                let right = TypeProvider.typeFor(e.right, ctx)
                if (left !== undefined && right !== undefined && this.isIntegral(left) && left.type == right.type) {
                    return new DataType(left!.type, left.size > right.size ? left.size : right.size)
                }
                return undefined
                break;
            }
            case "<<":
            case ">>": {
                let l = TypeProvider.typeFor(e.left, ctx)
                if (l !== undefined && TypeProvider.isIntegral(l)) {
                    return l
                }
                return undefined
                break;
            }
            case "+":
            case "-":
            case "*":
            case "/": {
                let l = TypeProvider.typeFor(e.left, ctx)
                let r = TypeProvider.typeFor(e.left, ctx)
                if (l == r) return l;
                return undefined;
                break;
            }
            case "%": {
                let l = TypeProvider.typeFor(e.left, ctx)
                let r = TypeProvider.typeFor(e.left, ctx)
                if (l !== undefined && TypeProvider.isIntegral(l) && l == r) return l;
                return undefined;
            }
            default:
                return undefined;
        }
    }

    static typeForCastExpression(e: CastExpression, ctx: CoreDef|InstructionSet) : DataType | undefined {
        let xx = e.$cstNode?.text
        console.log(xx)
        if (e.targetType !== undefined) {
            let tt = e.targetType!
            // check if possible
            let result = TypeProvider.typeFor(tt, ctx);
            return result;
        } else if (e.signedness !== undefined) {
            let sn = e.signedness!
            let o = e.operand
            let ot = TypeProvider.typeFor(o, ctx)
            if (ot !== undefined) {
                return new DataType(sn == 'unsigned' ? 'INTEGRAL_UNSIGNED' : 'INTEGRAL_SIGNED', ot.size)
            }
            
            // check if possible
        }
        return undefined
       
    }

    static typeForPrefixExpression(e: PrefixExpression, ctx: CoreDef|InstructionSet) : DataType | undefined {
        switch (e.operator) {
            case "++":
            case "--":
            case "~": {
                return TypeProvider.typeFor(e.operand, ctx)
                break;
            }
            case "!": {
                return boolType;
                break;
            }
            default:
                return undefined
        }
    }

    static typeForPostfixExpression(e: PostfixExpression, ctx: CoreDef|InstructionSet) : DataType | undefined {
        return TypeProvider.typeFor(e.operand, ctx);
    }

    static typeForFunctionCallExpression(e: FunctionCallExpression, ctx: CoreDef|InstructionSet) : DataType | undefined {
        return undefined;
    }

    static typeForArrayAccessExpression(e: ArrayAccessExpression, ctx: CoreDef|InstructionSet) : DataType | undefined {
        return TypeProvider.typeFor(e.target, ctx);
    }

    static typeForMemberAccessExpression(e: MemberAccessExpression, ctx: CoreDef|InstructionSet) : DataType | undefined {
        return TypeProvider.typeFor(e.declarator.ref!, ctx);
    }

    static typeForParenthesisExpression(e: ParenthesisExpression, ctx: CoreDef|InstructionSet) : DataType | undefined {
        return TypeProvider.typeFor(e.inner, ctx);
    }
    
    static typeForEntityReference(e: EntityReference, ctx: CoreDef|InstructionSet) : DataType | undefined {
        let rx = e.target.ref!
        let res =  TypeProvider.typeFor(rx, ctx);
        return res
    }
    
    static typeForNamedEntity(e: NamedEntity, ctx: CoreDef|InstructionSet) : DataType | undefined {
        return undefined
    }

    static typeForFunctionDefinition(e: FunctionDefinition, ctx: CoreDef|InstructionSet) : DataType | undefined {
        return TypeProvider.typeFor(e.returnType, ctx);
    }

    static typeForDeclarator(e: Declarator, ctx: CoreDef|InstructionSet) : DataType | undefined {
        
        if (isDeclaration(e.$container)) {
            return TypeProvider.typeFor((e.$container as Declaration).type, ctx);
        }
        return undefined;
    }

    static typeForEncoding(list: Encoding, ctx: CoreDef|InstructionSet) : DataType | undefined {
        var size = 0
        for (var f of list.fields) {
            if (isBitField(f)) {
                let left = Number (f.startIndex.value)
                let right = Number (f.endIndex.value)
                size +=  (left>right?left-right:right-left)  + 1
            } else if (isBitValue(f)) {
                let iwr = BigIntegerWithRadix.fromString(f.value)
                if (iwr !== undefined) {
                    size += iwr.size
                }
            } else {
                // TODO
            }
        }
        return new DataType('INTEGRAL_UNSIGNED', size)
    }

    static typeForBitField(e: BitField, ctx: CoreDef|InstructionSet) : DataType | undefined {
        let left = Number(e.startIndex.value)
        let right =Number(e.endIndex.value)
        return new DataType('INTEGRAL_UNSIGNED', (left>right ? left-right : right-left) +1)
    }

    static typeForBitValue(e: BitValue, ctx: CoreDef|InstructionSet) : DataType | undefined {
        let iwr = BigIntegerWithRadix.fromString(e.value)
        if (iwr !== undefined) {
            return new DataType('INTEGRAL_UNSIGNED', iwr.size)
        }
        return undefined
    }

    static typeForIntegerConstant(e: IntegerConstant, ctx: CoreDef|InstructionSet) : DataType | undefined {
        let value = BigIntegerWithRadix.fromString(e.value)
        if (value !== undefined) {
            return new DataType(value.value >= 0 ? 'INTEGRAL_UNSIGNED' : 'INTEGRAL_SIGNED', value.size)
        }
        return undefined
    }

    static typeForFloatConstant(e: FloatConstant, ctx: CoreDef|InstructionSet) : DataType | undefined {
        let value = BigDecimalWithSize.fromString(e.value)
        if (value !== undefined) {
            return new DataType('FLOAT', value.size)
        }
        return undefined
    }

    static typeForBoolConstant(e: BoolConstant, ctx: CoreDef|InstructionSet) : DataType | undefined {
        return boolType;
    }

    static typeForCharacterConstant(e: CharacterConstant, ctx: CoreDef|InstructionSet) : DataType | undefined {
        return  new DataType('INTEGRAL_SIGNED', 8);
    }
    
    static typeForStringConstant(e: StringConstant, ctx: CoreDef|InstructionSet) : DataType | undefined {
        return new DataType('INTEGRAL_SIGNED', 0);
    }
    
    static typeForStringLiteral(e: StringLiteral, ctx: CoreDef|InstructionSet) : DataType | undefined {
        return new DataType('INTEGRAL_SIGNED', 0);
    }
    
}

type BigIntegerWithRadix_TYPE = 'UNDEF' | 'SIGNED' | 'UNSIGNED'

export class BigIntegerWithRadix {
    value: bigint
    radix: integer
    size = 0
    type: BigIntegerWithRadix_TYPE = 'UNDEF'

    constructor(v: string, radix: integer, size: integer, type: BigIntegerWithRadix_TYPE) {
        this.value = BigInt(Number.parseInt(v, radix)); // TODO
		this.radix=radix;
		this.size=size;
		this.type = type;
	}

    static fromString(stringValue: string) : BigIntegerWithRadix | undefined {
        if (stringValue.length != 0) {
            if (stringValue.includes("'")) {
                // Verilog-style literal <size>'<radix><value>
                let lowercase = stringValue.toLowerCase()
                if (lowercase.includes("u") || lowercase.includes("l")) {
                    // TODO throw new ValueConverterException("Verilog literals cannot have 'u' and 'l' suffixes", node, null);
                }
                let token = stringValue.split("'")
                let lit = token[1].substring(1)
                let size = +token[0]
                switch(token[1].charAt(0)) {
                    case "h": return new BigIntegerWithRadix(lit, 16, size, 'UNDEF')
                    case "b": return new BigIntegerWithRadix(lit, 2, size, 'UNDEF')
                    case "o": return new BigIntegerWithRadix(lit, 8, size, 'UNDEF')
                    default: return new BigIntegerWithRadix(lit, 10, size, 'UNDEF')
                }
            } else {
                // C-style literal
                let type : BigIntegerWithRadix_TYPE = 'SIGNED'
                if (stringValue.includes("u") || stringValue.includes("U")) {
                    type = 'UNSIGNED'
                }
                let s = stringValue.toLowerCase().replace(/[uU]/g, "")
                var size = 32
                if (s.endsWith("ll")) {
                    size = 128
                } else if (s.endsWith("l")) {
                    size = 64
                } else if (s.startsWith("0x")) {
                    size = s.length-2 * 4
                } else if (s.startsWith("0b")) {
                    size = s.length - 2
                } else if (s.length > 1 && s.startsWith("0")) {
                    size = s.length-1*3
                }
                if(s.startsWith("0x")){
					return new BigIntegerWithRadix(stringValue.substring(2), 16, size, type);
				} else if(s.startsWith("0b")){
					return new BigIntegerWithRadix(stringValue.substring(2), 2, size, type);
				} else if(s.length>1 && s.startsWith("0")){
					return new BigIntegerWithRadix(s, 8, size, type);
				} else {
					return new BigIntegerWithRadix(s, 10, size, type);
				}
            }
        } else {
            // TODO hrow new ValueConverterException("Couldn't convert empty string to an integer value.", node, null);
        }
        return undefined;
    }

}


export class BigDecimalWithSize {
    value: number
    size: integer

    constructor(v: string, s: integer = 0) {
        this.value = Number(v)
        this.size = s
    }

    static fromString(stringValue: string) : BigDecimalWithSize | undefined {
        if (stringValue.length == 0) {
            // TODO new ValueConverterException("Couldn't convert empty string to a float value.", node, null);
        } else {
            var s = stringValue.toLowerCase().replace(/[_]/g, "")
            var size = 64
            if (s.endsWith("l")) {
                size = 128
                s = s.substring(0, s.length-1)
            } else if (s.endsWith("f")) {
                size = 32
                s = s.substring(0, s.length-1)
            }
            return new BigDecimalWithSize(s, size)
        }
        return undefined
    }
}