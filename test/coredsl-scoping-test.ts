import { describe, it } from 'vitest';
import { /*AstNode, LangiumDocument, ReferenceDescription,*/ AstNode, EmptyFileSystem, LangiumDocument } from 'langium';
import { parseDocument } from 'langium/test';
import { createCoreDslServices } from '../src/language-server/core-dsl-module';
//import { parse } from 'path';
//import { DescriptionContent } from '../src/language-server/generated/ast';
import {expectNoErrors} from './test-utils';
import { DescriptionContent } from '../src/language-server/generated/ast';

const services = createCoreDslServices(EmptyFileSystem).CoreDsl;
//console.log(services)

describe('Test Scoping', () => {
    it('parseIxnstrPRELU', () => {
        assertNoErrors(`InstructionSet TestISA extends Viech2 {
            instructions {
                Inst1 {
                    encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b0000000;  
                    assembly: "{name(rd)}, {name(rs1)}, {name(rs2)}";
                    behavior: {
                        x2 = 0;
                        int x;
                    }
                }
            }
        }`)
    });
   
});

async function assertNoErrors(modelText: string) {
    var doc : LangiumDocument<AstNode> = await parseDocument(services, modelText)
    await services.shared.workspace.DocumentBuilder.build([doc]);
    const model = (doc.parseResult.value as DescriptionContent);
    console.log("xxxx1"+model)
    console.log("xxxx22"+doc.diagnostics)
    expectNoErrors(doc)
}