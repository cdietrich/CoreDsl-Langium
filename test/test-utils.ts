import { LangiumDocument } from "langium";
import { expect } from "vitest";
import * as ast from "../src/language-server/generated/ast";
import { CoreDslServices } from "../src/language-server/core-dsl-module";
import { URI } from "vscode-uri";
//import assert from "assert";
//import { isAllTable } from "../src/language-server/generated/ast";
//import { getColumnsForSelectStatement } from "../src/language-server/sql-type-utilities";

export async function parseHelper(
    services: CoreDslServices,
    folder: string
): Promise<(input: string) => Promise<LangiumDocument<ast.DescriptionContent>>> {
    const metaData = services.LanguageMetaData;
    const documentBuilder = services.shared.workspace.DocumentBuilder;
    await services.shared.workspace.WorkspaceManager.initializeWorkspace([
        {
            name: "workspace",
            uri: folder,
        },
    ]);
    return async (input) => {
        const randomNumber = Math.floor(Math.random() * 10000000) + 1000000;
        const uri = URI.parse(
            `file:///${randomNumber}${metaData.fileExtensions[0]}`
        );
        const document =
            services.shared.workspace.LangiumDocumentFactory.fromString<ast.DescriptionContent>(
                input,
                uri
            );
        services.shared.workspace.LangiumDocuments.addDocument(document);
        await documentBuilder.build([document], { validationChecks: "all" });
        return document;
    };
}

export type ValidationStep = "lexer" | "parser" | "validator";
export interface ValidationStepFlags {
    exceptFor: ValidationStep | ValidationStep[];
}
export function expectNoErrors(
    result: LangiumDocument<ast.DescriptionContent>,
    flags?: ValidationStepFlags
): void {
    const list = flags
        ? typeof flags.exceptFor === "string"
            ? [flags.exceptFor]
            : flags.exceptFor
        : [];
    const lexer = list.includes("lexer");
    const parser = list.includes("parser");
    const validator = list.includes("validator");
    expect(result.parseResult.lexerErrors.length > 0).toBe(lexer);
    expect(result.parseResult.parserErrors.length > 0).toBe(parser);
    expect((result.diagnostics?.length ?? 0) > 0).toBe(validator);
}



export function expectValidationIssues(
    document: LangiumDocument<ast.DescriptionContent>,
    count: number,
    code: string
) {
    const issuesByGivenCode = (document.diagnostics ?? []).filter(
        (d) => d.code === code
    );
    expect(issuesByGivenCode.length).toBe(count);
}
