import { expect } from "vitest";
import { AstNode, EmptyFileSystem, LangiumDocument, LangiumServices } from 'langium';
import { createCoreDslServices } from '../src/language-server/core-dsl-module';
import { DescriptionContent } from '../src/language-server/generated/ast';
import { Diagnostic } from "vscode-languageserver";
import { URI } from 'vscode-uri';
import { parseDocument } from "langium/test";

const services = createCoreDslServices(EmptyFileSystem).CoreDsl;

export function assertNoErrors(doc: LangiumDocument<AstNode>) {
    assertNoLexerAndParseErrors(doc)
    let diagnostics = doc.diagnostics ?? []
    expect(diagnostics, diagnostics.map((e)=>e.message).toString()).toHaveLength(0);
}

export function assertErrors(doc: LangiumDocument<AstNode>, test:(x:Diagnostic[])=>void) {
    assertNoLexerAndParseErrors(doc)
    let diagnostics = doc.diagnostics ?? []
    test(diagnostics);
}

export async function parse(modelText: string, ...others: [URI,string][]): Promise<LangiumDocument<AstNode>> {
    const metaData = services.LanguageMetaData;
    const randomNumber = Math.floor(Math.random() * 10000000) + 1000000;
    const uri = URI.parse(`file:///${randomNumber}${metaData.fileExtensions[0]}`);
    var doc: LangiumDocument<AstNode> = getDocument(uri, modelText);
    var otherDocs = others.map((o) => getDocument(o[0],o[1]))
    let allDocs = [doc, ...otherDocs]
    await services.shared.workspace.DocumentBuilder.build(allDocs, { validationChecks: 'all' });
    const model = (doc.parseResult.value as DescriptionContent);
    return doc;
}

export function getDocument(uri: URI, input: string) : LangiumDocument<AstNode> {
    const document = services.shared.workspace.LangiumDocumentFactory.fromString(input, uri);
    services.shared.workspace.LangiumDocuments.addDocument(document);
    return document
}

export async function parseDocumentWithUri<T extends AstNode = AstNode>(services: LangiumServices, uri: URI, input: string): Promise<LangiumDocument<T>> {
    const document = await parseHelperWithUri<T>(services)(uri, input);
    if (!document.parseResult) {
        throw new Error('Could not parse document');
    }
    return document;
}

export function parseHelperWithUri<T extends AstNode = AstNode>(services: LangiumServices): (uri:URI, input: string) => Promise<LangiumDocument<T>> {
    const metaData = services.LanguageMetaData;
    const documentBuilder = services.shared.workspace.DocumentBuilder;
    return async (uri, input) => {
        const document = services.shared.workspace.LangiumDocumentFactory.fromString<T>(input, uri);
        services.shared.workspace.LangiumDocuments.addDocument(document);
        await documentBuilder.build([document]);
        return document;
    };
}


export function assertNoLexerAndParseErrors(result: LangiumDocument<AstNode>) {
    expect(result.parseResult.lexerErrors.length == 0, result.parseResult.lexerErrors.toString()).toBe(true);
    expect(result.parseResult.parserErrors.length == 0, result.parseResult.parserErrors.toString()).toBe(true);
}