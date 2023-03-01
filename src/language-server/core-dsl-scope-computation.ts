import { AstNodeDescription, DefaultScopeComputation, DefaultScopeProvider, LangiumDocument, LangiumServices, ReferenceInfo, Scope, streamAllContents } from "langium";
import {isInstructionSet, isNamedEntity} from './generated/ast'

export class CoreDslScopeComputation extends DefaultScopeComputation {
    constructor(services: LangiumServices) {
        super(services);
    }

    override async computeExports(document: LangiumDocument): Promise<AstNodeDescription[]> {
        const exportedDescriptions: AstNodeDescription[] = [];
        for (const childNode of streamAllContents(document.parseResult.value)) {
            if (isNamedEntity(childNode)) {
                const fullyQualifiedName = childNode.name;
                // `descriptions` is our `AstNodeDescriptionProvider` defined in `DefaultScopeComputation`
                // It allows us to easily create descriptions that point to elements using a name.
                exportedDescriptions.push(this.descriptions.createDescription(childNode, fullyQualifiedName, document));
            } else if (isInstructionSet(childNode)) {
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
        return super.getScope(context);

    }
}