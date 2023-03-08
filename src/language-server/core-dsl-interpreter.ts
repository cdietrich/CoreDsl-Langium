import { AstNode, getContainerOfType } from "langium"
import { CoreDslScopeProvider } from "./core-dsl-scope-computation"
import { BigDecimalWithSize, BigIntegerWithRadix, boolType, DataType, TypeProvider } from "./core-dsl-typesystem"
import { ArrayAccessExpression, AssignmentExpression, BitField, BitValue, BoolConstant, CastExpression, CharacterConstant, ConditionalExpression, CoreDef, DeclarationStatement, Declarator, EntityReference, Expression, ExpressionStatement, FloatConstant, FunctionCallExpression, FunctionDefinition, InfixExpression, InstructionSet, IntegerConstant, isArrayAccessExpression, isAssignmentExpression, isBitField, isBitValue, isBoolConstant, isCastExpression, isCharacterConstant, isConditionalExpression, isCoreDef, isDeclarationStatement, isDeclarator, isEntityReference, isExpression, isExpressionInitializer, isExpressionStatement, isFloatConstant, isFunctionCallExpression, isFunctionDefinition, isInfixExpression, isInstructionSet, isIntegerConstant, isMemberAccessExpression, isNamedEntity, isParenthesisExpression, isPostfixExpression, isPrefixExpression, isStringConstant, isStringLiteral, isTypeSpecifier, MemberAccessExpression, NamedEntity, ParenthesisExpression, PostfixExpression, PrefixExpression, Statement, StringConstant, StringLiteral, TypeSpecifier } from "./generated/ast"


export class Value {
    type?: DataType
    value?: number | BigIntegerWithRadix | BigDecimalWithSize | bigint

    constructor(type?: DataType, value?: number | BigIntegerWithRadix | BigDecimalWithSize | bigint) {
        this.type = type
        this.value = value
    }
}

export class EvaluationContext {
    definitionContext?: CoreDef | InstructionSet;
    parent?: EvaluationContext;
    values : Map<Declarator, Value> = new Map<Declarator, Value>();
    alreadyEvaluating = new Set<Expression>();
    expectedType?: DataType;

    public getValue(decl:Declarator) : Value | undefined{
        return this.values.get(decl)
    }

    public newValue(decl:Declarator, value: Value) : Value{
        this.values.set(decl,value)
        return value
    }
}

export class CoreDslInterpreter {

    public static valueFor(e: AstNode, ctx: EvaluationContext): Value | undefined {
        if (isBoolConstant(e)) {
            return CoreDslInterpreter.valueForBoolConstant(e, ctx);
        } else if (isCharacterConstant(e)) {
            return CoreDslInterpreter.valueForCharacterConstant(e, ctx);
        } else if (isFloatConstant(e)) {
            return CoreDslInterpreter.valueForFloatConstant(e, ctx);
        } else if (isIntegerConstant(e)) {
            return CoreDslInterpreter.valueForIntegerConstant(e, ctx);
        } else if (isStringConstant(e)) {
            return CoreDslInterpreter.valueForStringConstant(e, ctx);
        } else if (isEntityReference(e)) {
            return CoreDslInterpreter.valueForEntityReference(e, ctx);
        } else if (isParenthesisExpression(e)) {
            return CoreDslInterpreter.valueForParenthesisExpression(e, ctx);
        } else if (isArrayAccessExpression(e)) {
            return CoreDslInterpreter.valueForArrayAccessExpression(e, ctx);
        } else if (isAssignmentExpression(e)) {
            return CoreDslInterpreter.valueForAssignmentExpression(e, ctx);
        } else if (isBitField(e)) {
            return CoreDslInterpreter.valueForBitField(e, ctx);
        } else if (isBitValue(e)) {
            return CoreDslInterpreter.valueForBitValue(e, ctx);
        } else if (isCastExpression(e)) {
            return CoreDslInterpreter.valueForCastExpression(e, ctx);
        } else if (isConditionalExpression(e)) {
            return CoreDslInterpreter.valueForConditionalExpression(e, ctx);
        } else if (isDeclarator(e)) {
            return CoreDslInterpreter.valueForDeclarator(e, ctx);
        } else if (isFunctionCallExpression(e)) {
            return CoreDslInterpreter.valueForFunctionCallExpression(e, ctx);
        } else if (isFunctionDefinition(e)) {
            return CoreDslInterpreter.valueForFunctionDefinition(e, ctx);
        } else if (isInfixExpression(e)) {
            return CoreDslInterpreter.valueForInfixExpression(e, ctx);
        } else if (isMemberAccessExpression(e)) {
            return CoreDslInterpreter.valueForMemberAccessExpression(e, ctx);
        } else if (isPostfixExpression(e)) {
            return CoreDslInterpreter.valueForPostfixExpression(e, ctx);
        } else if (isPrefixExpression(e)) {
            return CoreDslInterpreter.valueForPrefixExpression(e, ctx);
        } else if (isExpression(e)) {
            return CoreDslInterpreter.valueForExpression(e, ctx);
        } else if (isNamedEntity(e)) {
            return CoreDslInterpreter.valueForNamedEntity(e, ctx);
        } else if (isStringLiteral(e)) {
            return CoreDslInterpreter.valueForStringLiteral(e, ctx);
        } else if (isTypeSpecifier(e)) {
            return CoreDslInterpreter.valueForTypeSpecifier(e, ctx);
        } else {
            // TODO
            return undefined
        }
    }

    static valueForTypeSpecifier(e: TypeSpecifier, ctx: EvaluationContext): Value | undefined {
        let type = TypeProvider.typeFor(e, ctx.definitionContext)
        let result = new Value(type, undefined)
        return result;
    }

    static valueForExpression(e: Expression, ctx: EvaluationContext): Value | undefined {
        return undefined
    }

    static valueForAssignmentExpression(e: AssignmentExpression, ctx: EvaluationContext): Value | undefined {
        return CoreDslInterpreter.valueFor(e.value, ctx)
    }

    static valueForConditionalExpression(e: ConditionalExpression, ctx: EvaluationContext): Value | undefined {
        let condValue = CoreDslInterpreter.valueFor(e.condition, ctx)
        if (condValue === undefined) {
            return undefined
        }
        if (condValue.value != 0) {
            return CoreDslInterpreter.valueFor(e.thenExpression, ctx)
        } else {
            return CoreDslInterpreter.valueFor(e.elseExpression, ctx)
        }
    }

    static valueForInfixExpression(e: InfixExpression, ctx: EvaluationContext): Value | undefined {
        switch(e.operator) {
            case "||":
    case "&&":
    case "==":
    case "!=":
    case "<":
    case ">":
    case "<=":
    case ">=": {
        return new Value(boolType, undefined);
    }

    case '|':
    case "&":
    case "^":
    case "<<":
    case ">>": {
        let l = CoreDslInterpreter.valueFor(e.left,ctx)
        if (l === undefined || l.type == undefined) {
            return undefined;
        }
        return TypeProvider.isIntegral(l.type) ? l : undefined
    }



    case '+':
    case '-':
    case '*':
    case '/':  {
        let l = CoreDslInterpreter.valueFor(e.left, ctx)
        let r = CoreDslInterpreter.valueFor(e.right, ctx)
        if (l===undefined || r === undefined) {
            return undefined
        }
        if (!CoreDslInterpreter.isComputable(l,r)) {
            return undefined
        } else {
            switch (e.operator) {
                case '+': return new Value(l.type, CoreDslInterpreter.add(l.value,r.value))
                case '-': return new Value(l.type, CoreDslInterpreter.sub(l.value,r.value))
                case '*': return new Value(l.type, CoreDslInterpreter.mul(l.value,r.value))
                case '/': return new Value(l.type, CoreDslInterpreter.div(l.value,r.value))
                default: return undefined
            }
        }
    }
    case '%': {
        let l = CoreDslInterpreter.valueFor(e.left, ctx)
        let r = CoreDslInterpreter.valueFor(e.right, ctx)
        if (r === undefined || l === undefined || r.type === undefined || l.type === undefined) {
            return undefined
        }
        return TypeProvider.isIntegral(l.type) &&TypeProvider. isIntegral(r.type) ? new Value(l.type, CoreDslInterpreter.mod(l.value,r.value)) : undefined
    }
    default:
        return undefined
}
    }

    static add(left: number | bigint | BigIntegerWithRadix | BigDecimalWithSize | undefined, right: number | bigint | BigIntegerWithRadix | BigDecimalWithSize | undefined) : number | bigint | undefined {
        return this.op(left, right, (a,b)=>a+b,(a,b)=>a+b)
    }
    static sub(left: number | bigint | BigIntegerWithRadix | BigDecimalWithSize | undefined, right: number | bigint | BigIntegerWithRadix | BigDecimalWithSize | undefined) : number | bigint | undefined {
        return this.op(left, right, (a,b)=>a-b,(a,b)=>a-b)
    }
    static mul(left: number | bigint | BigIntegerWithRadix | BigDecimalWithSize | undefined, right: number | bigint | BigIntegerWithRadix | BigDecimalWithSize | undefined) : number | bigint | undefined {
        return this.op(left, right, (a,b)=>a*b,(a,b)=>a*b)
    }
    static div(left: number | bigint | BigIntegerWithRadix | BigDecimalWithSize | undefined, right: number | bigint | BigIntegerWithRadix | BigDecimalWithSize | undefined) : number | bigint | undefined {
        return this.op(left, right, (a,b)=>a/b,(a,b)=>a/b)
    }
    static mod(left: number | bigint | BigIntegerWithRadix | BigDecimalWithSize | undefined, right: number | bigint | BigIntegerWithRadix | BigDecimalWithSize | undefined) : number | bigint | undefined {
        return this.op(left, right, (a,b)=>a%b,(a,b)=>a%b)
    }

    static op(left: number | bigint | BigIntegerWithRadix | BigDecimalWithSize | undefined, 
        right: number | bigint | BigIntegerWithRadix | BigDecimalWithSize | undefined,
       o_number:(a:number, b:number) => number,
       o_bigint:(a:bigint, b:bigint) => bigint,
        ) : number | bigint | undefined {
        if (left === undefined || right === undefined) {
            return undefined
        }
        var realleft: number | bigint | undefined = undefined
        var realright: number | bigint | undefined = undefined
        
        if (left instanceof BigIntegerWithRadix) {
            realleft = left.value
        }
        if (right instanceof BigIntegerWithRadix) {
            realright = right.value
        }
        if (left instanceof BigDecimalWithSize) {
            realleft = left.value
        }
        if (right instanceof BigDecimalWithSize) {
            realright = right.value
        }
        if (typeof left  === 'bigint') {
            realleft = left
        } 
        if (typeof right  === 'bigint') {
            realright = right
        }
        if (realleft === undefined || realright == undefined) {
            return undefined
        }
        if (typeof realleft == 'bigint' && typeof realright === 'bigint') {
            return o_bigint(realleft as bigint, realright as bigint)
        }
        if (typeof realleft == 'number' && typeof realright === 'number') {
            return o_number(realleft as number, realright as number)
        }
        return undefined
    }

    static isComputable(left: Value| undefined, right: Value| undefined) : boolean {
        return left !== undefined && right !== undefined && left.type == right.type
    }

    static valueForCastExpression(e: CastExpression, ctx: EvaluationContext): Value | undefined {
        if (e.targetType === undefined) {
            return undefined
        }
        return CoreDslInterpreter.valueFor(e.targetType, ctx)
    }

    static valueForPrefixExpression(e: PrefixExpression, ctx: EvaluationContext): Value | undefined {
        // TODO in dont understand this impl
        switch(e.operator) {
            case "++":
            case "--": {
                return CoreDslInterpreter.valueFor(e.operand, ctx)
            }
            case "~":
                {
                    return CoreDslInterpreter.valueFor(e.operand, ctx)
                }
            case "!": {
                new Value(boolType, CoreDslInterpreter.valueFor(e.operand,ctx)!.value)
            }
            default: {
                 // missing 'case "&", case "*", case "+" , case "-":'
                return undefined
            }
        }  
    }

    static valueForPostfixExpression(e: PostfixExpression, ctx: EvaluationContext): Value | undefined {
// postfix increment/decrement is not supported in constant expressions, because it has side effects
        return undefined
    }

    static valueForFunctionCallExpression(e: FunctionCallExpression, ctx: EvaluationContext): Value | undefined {
// postfix increment/decrement is not supported in constant expressions, because it can have side effects
        return undefined
    }

    static valueForArrayAccessExpression(e: ArrayAccessExpression, ctx: EvaluationContext): Value | undefined {
// TODO do we want to support this?
        return undefined
    }

    static valueForMemberAccessExpression(e: MemberAccessExpression, ctx: EvaluationContext): Value | undefined {
// TODO do we want to support this?
        return undefined
    }

    static valueForParenthesisExpression(e: ParenthesisExpression, ctx: EvaluationContext): Value | undefined {
        return CoreDslInterpreter.valueFor(e.inner, ctx)
    }

    static valueForEntityReference(e: EntityReference, ctx: EvaluationContext): Value | undefined {
        return CoreDslInterpreter.valueFor(e.target.ref!, ctx)
    }

    static valueForNamedEntity(e: NamedEntity, ctx: EvaluationContext): Value | undefined {
        return undefined
    }

    static valueForFunctionDefinition(e: FunctionDefinition, ctx: EvaluationContext): Value | undefined {
        return CoreDslInterpreter.valueFor(e.returnType, ctx)
    }

    static valueForDeclarator(e: Declarator, ctx: EvaluationContext): Value | undefined {
        let x = ctx.getValue(e)
        if (x !== undefined) {
            return x;
        }
        return CoreDslInterpreter.calculateValue(e, ctx)
        /**
ctx.getValue(e) ?: calculateValue(e, ctx)
*/
        return undefined
    }

    static allInstructionSets(core: InstructionSet) : Array<CoreDef|InstructionSet>  {
        let s = core.superType !== undefined ? CoreDslInterpreter.allInstructionSets(core.superType.ref!) : []
        s.push(core)
        return s
    }

    static allDefinitions(isa: CoreDef|InstructionSet) : Statement[]{
        if (isCoreDef(isa)) {
                if (isa.providedInstructionSets.length == 0) {
                    let result : Statement[] = []
                    for (var d of isa.declarations) {
                        result.push(d)
                    }
                    for (var d2 of isa.assignments) {
                        result.push(d2)
                    }
                    return result
                }
                    
                else {
                    let instrSets = isa.providedInstructionSets?.map((it) => CoreDslInterpreter.allInstructionSets(it.ref!)).flat()
                    let seen = new Set<CoreDef|InstructionSet>()
                    for (var x of instrSets) {
                        seen.add(x)
                    }
                    seen.add(isa)
                    let a: Array<CoreDef|InstructionSet> = []
                    for (var x of seen) {
                        a.push(x)
                    }
                    return a.map((it)=>{
                        let result: Statement[] = []
                        for (var x of it.declarations) {
                            result.push(x)
                        }
                        for (var x2 of it.assignments) {
                            result.push(x2)
                        }
                        return result}).flat()
                }
            } else if (isInstructionSet(isa)) {
                return CoreDslInterpreter.allInstructionSets(isa).map((it)=>{
                    let result: Statement[] = []
                    for (var x of it.declarations) {
                        result.push(x)
                    }
                    for (var x2 of it.assignments) {
                        result.push(x2)
                    }
                    return result}).flat()
            }
              return []  
    }

    static effectiveDeclarator(isa: CoreDef|InstructionSet, name: String) : Declarator | undefined{
        if(isCoreDef(isa)) {
            let decl:Statement = CoreDslInterpreter.allDefinitions(isa).filter((it)=>isDeclarationStatement(it)).map((it)=> it as DeclarationStatement) .filter((it)=>
	           	it.declaration.declarators.filter((x)=>x.name==name)[0]
            )[0]
            if(decl!==undefined) {
                return decl.declaration.declarators.filter((x)=>x.name==name)[0]
            }
            for(var contrib of isa.providedInstructionSets.reverse()) {
                let contribDecl = CoreDslInterpreter.effectiveDeclarator(contrib.ref!,name)
                if(contribDecl!==undefined)
                    return contribDecl
            }
        } else if(isInstructionSet(isa)){
            let decl = CoreDslScopeProvider.getStateDeclarators(isa).filter((it)=>it.name==name)[0]
            if(decl!==undefined) {
            	if(decl.initializer !== undefined)
	                return decl            	
            }
            
            let baseDecl = isa.superType === undefined ? undefined : CoreDslInterpreter.effectiveDeclarator(isa.superType.ref!,name)
            if(baseDecl!==undefined)
                return baseDecl
        }
        return undefined
    }
    

    private static calculateValue(e: Declarator, ctx: EvaluationContext) : Value | undefined {
        if (ctx.definitionContext !== undefined) {
        	
        	// gather all assignments to this declarator
            let assignments = CoreDslInterpreter.allDefinitions(ctx.definitionContext).filter((it)=>{
                if (isExpressionStatement(it)) {
                	let expr = it.expression
                    if(isAssignmentExpression(expr)) {
                        let entityRef = expr.target
                        if (isEntityReference(entityRef)) {
                            return entityRef.target.ref === e
                        }
                    }
                }
                return false
            }).map((it)=>(it as ExpressionStatement).expression as AssignmentExpression)
            
            if (assignments.length > 0) {
                let assignment = assignments[assignments.length-1];
                let res = CoreDslInterpreter.valueFor(assignment.value,ctx)
                if (res == undefined) {
                    return undefined
                }
                return ctx.newValue(e, res);
            }
        }
        if (e.initializer !== undefined) {
            if (isExpressionInitializer(e.initializer)) {
                let initializer = e.initializer;
                let r = CoreDslInterpreter.valueFor(initializer.value,ctx)
                if (r === undefined) {
                    return undefined
                }
                return ctx.newValue(e, r)
            } else {
                let ccc = e.$container.$container.$container
                if (isCoreDef(ccc)) {
                    if (ctx.definitionContext === undefined) return undefined;
                    let directDecl = CoreDslInterpreter.effectiveDeclarator(ctx.definitionContext,e.name)
                    if (directDecl === undefined) return undefined
                    return CoreDslInterpreter.evaluate(directDecl,ctx);
                } 
                if (isInstructionSet(ccc)) {
                    if (ctx.definitionContext === undefined) return undefined;
                    let directDecl = CoreDslInterpreter.effectiveDeclarator(ctx.definitionContext, e.name)
                    if (directDecl === undefined) return undefined
                    return CoreDslInterpreter.evaluate(directDecl,ctx);
                } 
            }
        }
        return undefined
    }

    static allStateAssignments(isa: CoreDef|InstructionSet|undefined) : ExpressionStatement[]{
        if (isCoreDef(isa)){
            return isa.assignments.concat(isa.providedInstructionSets!.map((it)=>CoreDslInterpreter.allStateAssignments(it.ref!)).flat())
        }
    else if (isInstructionSet(isa)) {
            return isa.assignments.concat(isa.superType === undefined ? [] : isa.superType.ref!.assignments)
        }
    return []
    }

    static allStateDeclarations(isa: CoreDef|InstructionSet|undefined) : DeclarationStatement[] {
        if (isCoreDef(isa)){
                return isa.declarations.concat(isa.providedInstructionSets!.map((it)=>CoreDslInterpreter.allStateDeclarations(it.ref!)).flat())
            }
        else if (isInstructionSet(isa)) {
                return isa.declarations.concat(isa.superType === undefined ? [] : isa.superType.ref!.declarations)
            }
        return []

    }


    static evaluate(decl: Declarator, ctx: EvaluationContext) : Value | undefined {
        let context = ctx.definitionContext
        if (context === undefined) {
            if (isExpressionInitializer(decl.initializer))
                return CoreDslInterpreter.valueFor(decl.initializer.value, ctx)
            else
                return undefined
        }
        let a = CoreDslInterpreter.allStateDeclarations(context)
        .map((it)=>it.declaration.declarators).flat()
        .filter((it)=>it== decl && it.initializer !== undefined &&  isExpressionInitializer(it.initializer))
        .map((it)=>{
            if (isExpressionInitializer(it.initializer)) {
                return it.initializer.value
            }
            return undefined
            }).filter((x)=> isExpressionStatement(x))
            let b = CoreDslInterpreter.allStateAssignments(context)
            .map((it)=>it.expression)
            .filter((it)=> {
                if (isAssignmentExpression(it)) {
                    let x = CoreDslInterpreter.getPrimary(it.target)?.target?.ref
                    return x === decl
                }
                return false
                
            })
            .map((it)=>isAssignmentExpression(it) ? it.value : undefined)
        let c = a.concat(
                    b).filter((x)=>isExpression(x))
                
        let assignmentValues : Array<Expression> = []
        for (var cx of c) {
            if (cx !== undefined) {
                assignmentValues.push(cx)
            }
        }
        return assignmentValues.length > 0? CoreDslInterpreter.valueFor(assignmentValues[assignmentValues.length-1],ctx ): undefined
    }

    static getPrimary(expr:Expression) : EntityReference| undefined{
        if (isEntityReference(expr)) {
            if (expr.target !== undefined) {
                return expr
            }
            return undefined
        } else if (isCastExpression(expr)) {
            return CoreDslInterpreter.getPrimary(expr.operand)
        } else if (isArrayAccessExpression(expr)) {
            return CoreDslInterpreter.getPrimary(expr.target)
        } else {
            return undefined
        }
    }



    static valueForBitField(e: BitField, ctx: EvaluationContext): Value | undefined { 
        var p : CoreDef | InstructionSet | undefined = getContainerOfType(e, isCoreDef)
        if (p === undefined) {
            p = getContainerOfType(e, isInstructionSet)
        }
        let type = TypeProvider.typeFor(e, p!)
        return new Value(type, undefined);
    }

    static valueForBitValue(e: BitValue, ctx: EvaluationContext): Value | undefined {
        return new Value(new DataType('INTEGRAL_UNSIGNED', 1), 0)
    }

    static valueForIntegerConstant(e: IntegerConstant, ctx: EvaluationContext): Value | undefined {
        let type = TypeProvider.typeFor(e, ctx.definitionContext)
        return new Value(type, BigIntegerWithRadix.fromString(e.value))
    }

    static valueForFloatConstant(e: FloatConstant, ctx: EvaluationContext): Value | undefined {
        let type = TypeProvider.typeFor(e, ctx.definitionContext)
        return new Value(type, BigDecimalWithSize.fromString(e.value))
    }

    static valueForBoolConstant(e: BoolConstant, ctx: EvaluationContext): Value | undefined {
        return new Value(boolType, e.value ? 1 : 0)
    }

    static valueForCharacterConstant(e: CharacterConstant, ctx: EvaluationContext): Value | undefined {
        return new Value(new DataType('INTEGRAL_SIGNED', 8), BigInt(e.value.charAt(0)))
    }

    static valueForStringConstant(e: StringConstant, ctx: EvaluationContext): Value | undefined {
        return new Value(new DataType('INTEGRAL_SIGNED', 0), undefined)
        /**
new Value(new DataType(DataType.Type.INTEGRAL_SIGNED, 0), null) // TODO hä?
*/
    }

    static valueForStringLiteral(e: StringLiteral, ctx: EvaluationContext): Value | undefined {
        return new Value(new DataType('INTEGRAL_SIGNED', 0), undefined)
         /**
new Value(new DataType(DataType.Type.INTEGRAL_SIGNED, 0), null) // TODO hä?
*/
    }
}