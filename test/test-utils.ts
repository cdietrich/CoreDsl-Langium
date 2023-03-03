import { expect } from "vitest";
import { AstNode, EmptyFileSystem, LangiumDocument } from 'langium';
import { parseDocument } from 'langium/test';
import { createCoreDslServices } from '../src/language-server/core-dsl-module';
import { DescriptionContent } from '../src/language-server/generated/ast';
import { Diagnostic } from "vscode-languageserver";

const services = createCoreDslServices(EmptyFileSystem).CoreDsl;

export function assertNoErrors(doc: LangiumDocument<AstNode>) {
    assertNoLexerAndParseErrors(doc)
    let diagnostics = doc.diagnostics ?? []
    expect(diagnostics).toHaveLength(0);
}

export function assertErrors(doc: LangiumDocument<AstNode>, test:(x:Diagnostic[])=>void) {
    assertNoLexerAndParseErrors(doc)
    let diagnostics = doc.diagnostics ?? []
    test(diagnostics);
}

export async function parse(modelText: string): Promise<LangiumDocument<AstNode>> {
    var doc: LangiumDocument<AstNode> = await parseDocument(services, modelText);
    await services.shared.workspace.DocumentBuilder.build([doc], { validationChecks: 'all' });
    const model = (doc.parseResult.value as DescriptionContent);
    return doc;
}

export function assertNoLexerAndParseErrors(result: LangiumDocument<AstNode>) {
    expect(result.parseResult.lexerErrors.length == 0, result.parseResult.lexerErrors.toString()).toBe(true);
    expect(result.parseResult.parserErrors.length == 0, result.parseResult.parserErrors.toString()).toBe(true);
}