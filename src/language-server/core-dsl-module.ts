import {
    createDefaultModule, createDefaultSharedModule, DefaultSharedModuleContext, inject,
    LangiumServices, LangiumSharedServices, Module, PartialLangiumServices
} from 'langium';
import { CoreDslGeneratedModule, CoreDslGeneratedSharedModule } from './generated/module';
import { CoreDslValidator, registerValidationChecks } from './core-dsl-validator';
import { CoreDslScopeComputation, CoreDslScopeProvider } from './core-dsl-scope-computation';

/**
 * Declaration of custom services - add your own service classes here.
 */
export type CoreDslAddedServices = {
    validation: {
        CoreDslValidator: CoreDslValidator
    }
}

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type CoreDslServices = LangiumServices & CoreDslAddedServices

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export const CoreDslModule: Module<CoreDslServices, PartialLangiumServices & CoreDslAddedServices> = {
    validation: {
        CoreDslValidator: () => new CoreDslValidator()
    },
    references: {
        ScopeComputation: (services) => new CoreDslScopeComputation(services),
        ScopeProvider: (services) => new CoreDslScopeProvider(services)
    }
};

/**
 * Create the full set of services required by Langium.
 *
 * First inject the shared services by merging two modules:
 *  - Langium default shared services
 *  - Services generated by langium-cli
 *
 * Then inject the language-specific services by merging three modules:
 *  - Langium default language-specific services
 *  - Services generated by langium-cli
 *  - Services specified in this file
 *
 * @param context Optional module context with the LSP connection
 * @returns An object wrapping the shared services and the language-specific services
 */
export function createCoreDslServices(context: DefaultSharedModuleContext): {
    shared: LangiumSharedServices,
    CoreDsl: CoreDslServices
} {
    const shared = inject(
        createDefaultSharedModule(context),
        CoreDslGeneratedSharedModule
    );
    const CoreDsl = inject(
        createDefaultModule({ shared }),
        CoreDslGeneratedModule,
        CoreDslModule
    );
    shared.ServiceRegistry.register(CoreDsl);
    registerValidationChecks(CoreDsl);
    return { shared, CoreDsl };
}
