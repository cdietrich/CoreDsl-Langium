import { equalURI, stream, getDocument, EMPTY_SCOPE, getContainerOfType, AstNodeDescription, DefaultScopeComputation, DefaultScopeProvider, LangiumDocument, LangiumServices, ReferenceInfo, Scope, streamAllContents, StreamScope, AstNode } from "langium";
import { URI, Utils } from "vscode-uri";
import {isDeclarator, isBitField, isDescriptionContent, isInstructionSet, Import, InstructionSet, isStatement, Statement, isCompoundStatement, Declaration, isPrimaryExpression, isCoreDef, CoreDef, isDeclarationStatement, NamedEntity, Declarator, isEntityReference, isFunctionDefinition, isInstruction, isForLoop} from './generated/ast'

export class CoreDslScopeComputation extends DefaultScopeComputation {
    constructor(services: LangiumServices) {
        super(services);
    }

    override async computeExports(document: LangiumDocument): Promise<AstNodeDescription[]> {
        const exportedDescriptions: AstNodeDescription[] = [];
        for (const childNode of streamAllContents(document.parseResult.value)) {
            // if (isNamedEntity(childNode)) {
            //     const fullyQualifiedName = childNode.name;
            //     // `descriptions` is our `AstNodeDescriptionProvider` defined in `DefaultScopeComputation`
            //     // It allows us to easily create descriptions that point to elements using a name.
            //     exportedDescriptions.push(this.descriptions.createDescription(childNode, fullyQualifiedName, document));
            // } else
            if (isInstructionSet(childNode)) {
                const fullyQualifiedName = childNode.name;
                // `descriptions` is our `AstNodeDescriptionProvider` defined in `DefaultScopeComputation`
                // It allows us to easily create descriptions that point to elements using a name.
                exportedDescriptions.push(this.descriptions.createDescription(childNode, fullyQualifiedName, document));
            }
        }
        return exportedDescriptions;
    }
}

export class CoreDslScopeProvider extends DefaultScopeProvider {
    override getScope(context: ReferenceInfo): Scope {
        return this.getScopeInternal(context, context.container)        
    }



    protected variablesList(isa: InstructionSet, seen: string[]):NamedEntity[][] {
        seen.push(isa.name)
        if (isa.superType !== undefined && seen.indexOf(isa.superType.ref!.name) == -1) {
            let ret = this.variablesList(isa.superType.ref!, seen)
            return ret.concat(this.variables(isa))
        } else {
            return [this.variables(isa)]
        }
    }

    private variables(isa: CoreDef|InstructionSet):NamedEntity[] {
        let fx : NamedEntity[] = isa.functions
        let dx: NamedEntity[] = this.getStateDeclarators(isa)
        return dx.concat(fx)
    }

    private getStateDeclarators(isa: CoreDef|InstructionSet):Declarator[] {
        return isa.declarations.flatMap((it) => it.declaration.declarators)
    }


    /**
     * 
     * @param refInfo switch(context){
                PrimaryExpression:
                    scopeForVariable(containingStatement(context),reference)
                Statement:
                    scopeForVariable(context, reference)
                InstructionSet:
                    Scopes.scopeFor(variables(context), context.superType !== null? scopeForVariable(context.superType, reference) : IScope.NULLSCOPE)
                CoreDef:
                    Scopes.scopeFor(variables(context), outerScope(context.providedInstructionSets))
                default:
                    getScopeInternal(context.eContainer, reference)
            }
     * @param context 
     * @returns 
     */


    private getScopeInternal(refInfo: ReferenceInfo, context?: AstNode): Scope {
        if (context != undefined && refInfo.property === 'target' && isEntityReference(refInfo.container)) {
            if(isPrimaryExpression(context)) {
                let smt = this.containingStatement(context)
                if (smt !== undefined) {
                    let result = this.scopeForVariable(refInfo,smt)
                    return result
                }
                return EMPTY_SCOPE
            } else if(isStatement(context)) {
                return this.scopeForVariable(refInfo,context)
            } else if(isInstructionSet(context)) {
                let outer =
                    context.superType !== undefined ? this.scopeForVariable(refInfo, context.superType.ref!) : EMPTY_SCOPE;
                let vars = this.variables(context)
                return this.createScopeForNodes(vars, outer)
            } else if(isCoreDef(context)) {
                let outer = this.outerScope(context.providedInstructionSets.map((e) => e.ref!))
                let inner = this.variables(context)
                return this.createScopeForNodes(inner, outer)
            } else {
                return this.getScopeInternal(refInfo, context.$container)
            }
        }
        return super.getScope(refInfo);
    }



    private outerScope(isas: InstructionSet[]): Scope {
    	var seen : string[] = []
        var declsList = isas.map((it) =>
        	this.variablesList(it,seen)
        ).flat().filter((it) => it.length>0)
        return this.asScopes(declsList)
    }

    private asScopes(list: NamedEntity[][]):Scope {
		if(list.length == 0)
			return EMPTY_SCOPE
		else {
            return this.createScopeForNodes(list[list.length - 1],this.asScopes(list.slice(0, -1)))
        }
			
	}

    protected containingStatement(obj: AstNode): Statement|undefined {
        if (isStatement(obj)) {
            return obj
        } else if (obj.$container !== undefined) {
            return this.containingStatement(obj.$container)
        }
        return undefined
    }

    protected declarationsBefore(object: AstNode, decl:Statement): Declaration[] {
        if (isCompoundStatement(object)) {

            /**
             * val result = object.statements.takeWhile [
                    it !== decl
                ].filter[it instanceof DeclarationStatement].map[(it as DeclarationStatement).declaration]
                
             */

            let smts = this.takeWhile(object.statements, (s) => {
                return s != decl;
            });
            let result = smts.filter(isDeclarationStatement).map((e=>e.declaration))
            return result
        } else if (isInstructionSet(object)) {
            return this.takeWhile(this.allDeclarations(object), (e:Declaration) =>{
                if (isDeclarationStatement(e.$container)) {
                    return decl !== e.$container
                }
                return false
            })
        } else if (isCoreDef(object)) {
            return this.takeWhile(this.allDeclarations(object), (e:Declaration) =>{
                if (isDeclarationStatement(e.$container)) {
                    return decl !== e.$container
                }
                return false
            })
        }
        return []
    }

    protected scopeForVariable(refInfo:ReferenceInfo, isa: InstructionSet|Statement ): Scope {
        if (isInstructionSet(isa)) {
            let outer:Scope
            if (isa.superType !== undefined) {
                outer = this.scopeForVariable(refInfo, isa.superType.ref!)
            } else {
                outer = EMPTY_SCOPE
            }
            return this.createScopeForNodes(this.variables(isa), outer)
        } else if (isStatement(isa)) {
            const parent = isa.$container
            var parentScope : Scope 
            if (isCompoundStatement(parent)) {
                //  Scopes.scopeFor(variablesDeclaredBefore(parent,context), scopeForVariable(parent,reference))
                parentScope = this.createScopeForNodes(this.variablesDeclaredBefore(parent, isa), this.scopeForVariable(refInfo, parent))
            } else if (isInstruction(parent)) {
                var instructionSet= getContainerOfType(parent, isInstructionSet);
                var  coreDef = getContainerOfType(parent, isCoreDef);
                var  n = instructionSet !== undefined ? instructionSet : coreDef;
                parentScope = this.createScopeForNodes(streamAllContents(parent).filter((e) => isBitField(e)), this.getScopeInternal(refInfo, n))
                
                // Scopes.scopeFor(EcoreUtil2.getAllContentsOfType(parent, BitField),
                //     getScope(parentOfType(parent,ISA),reference))
            } else if (isFunctionDefinition(parent)) {
                var instructionSet= getContainerOfType(parent, isInstructionSet);
                var  coreDef = getContainerOfType(parent, isCoreDef);
                var  n = instructionSet !== undefined ? instructionSet : coreDef;
                parentScope = this.createScopeForNodes(streamAllContents(parent).filter((e) => isDeclarator(e)), this.getScopeInternal(refInfo, n))
                // Scopes.scopeFor(EcoreUtil2.getAllContentsOfType(parent, Declarator),
                // getScope(parentOfType(parent,ISA),reference))
            } else {
                parentScope = this.getScopeInternal(refInfo, isa.$container)
            }
            if (isForLoop(isa)) {
                if (isa.startDeclaration !== undefined) {
                    return this.createScopeForNodes(isa.startDeclaration.declarators, parent)
                }
            }
            //
            return parentScope
        }
        return EMPTY_SCOPE

        /**
         *  def IScope scopeForVariable(Statement context, EReference reference) {
        val parent = context.eContainer
        val parentScope = switch (parent) {
            CompoundStatement:
                Scopes.scopeFor(variablesDeclaredBefore(parent,context), scopeForVariable(parent,reference))
            Instruction:
                Scopes.scopeFor(EcoreUtil2.getAllContentsOfType(parent, BitField),
                    getScope(parentOfType(parent,ISA),reference))
            FunctionDefinition:
                Scopes.scopeFor(EcoreUtil2.getAllContentsOfType(parent, Declarator),
                    getScope(parentOfType(parent,ISA),reference))
            default:
                getScope(parent,reference)
        }
        if (context instanceof ForLoop)
            if (context.startDeclaration !== null)
                return Scopes.scopeFor(context.startDeclaration.declarators, parentScope)
        return parentScope
    }

         */

        
    }

    private variablesDeclaredBefore(stmt:AstNode, o: AstNode) : Declarator[] {
        if (isStatement(o)) {
            const ds = this.declarationsBefore(stmt, o)
            const before = ds.flatMap((it) => it.declarators)
            return before
        } else {
            return []
        }
        //     declarationsBefore(stmt,o).flatMap[
        //         it.declarators
        //     ]
        // else
        //     #[]
    }

    protected allDeclarations(isa: InstructionSet|CoreDef) : Declaration[] {
            if (isInstructionSet(isa)) {
                var declsSuper : Declaration[] = []
                if (isa.superType !== undefined) {
                    declsSuper = this.allDeclarations(isa.superType.ref!)
                }
                return declsSuper.concat(isa.declarations.map(e => e.declaration))
            } else if (isCoreDef(isa)) {
                var declsSuper : Declaration[] = isa.providedInstructionSets.map((it) => this.allDeclarations(it.ref!)).flat()
                var local : Declaration[] = isa.declarations.map((it) => it.declaration);
                return declsSuper.concat(local)
            }
            return []
            
    }

    protected takeWhile<T extends AstNode>(arr: T[], func: (e:T)=>Boolean) : T[] {
        var result:T[] = [];
        for (var e of arr) {
            if (!func(e)) {
                return result
            }
            result.push(e)
        }
        return result;
    }

    protected override getGlobalScope(referenceType: string, context: ReferenceInfo): Scope {
        const model = getContainerOfType(context.container, isDescriptionContent);
        if (!model) {
            return EMPTY_SCOPE;
        }
        const importedUris = stream(model.imports).map(resolveImportUri).nonNullable();
        let importedElements = this.indexManager.allElements(referenceType)
            .filter(des => importedUris.some(importedUri => equalURI(des.documentUri, importedUri)));
        //if (referenceType === InstructionSet || true) {
            importedElements = importedElements.filter(des => des.type === InstructionSet);
        //}
        return new StreamScope(importedElements);
    }
}

export function resolveImportUri(imp: Import): URI | undefined {
    if (imp.importURI === undefined || imp.importURI.length === 0) {
        return undefined;
    }
    const dirUri = Utils.dirname(getDocument(imp).uri);
    let grammarPath = imp.importURI;
    if (!grammarPath.endsWith('.core_desc')) {
        grammarPath += '.core_desc';
    }
    return Utils.resolvePath(dirUri, grammarPath);
}