import { describe, expect, test } from 'vitest';
import { /*AstNode, LangiumDocument, ReferenceDescription,*/ EmptyFileSystem, LangiumDocument } from 'langium';
import { parseDocument } from 'langium/test';
import { createCoreDslServices } from '../src/language-server/core-dsl-module';
//import { parse } from 'path';
//import { DescriptionContent } from '../src/language-server/generated/ast';
import {expectNoErrors} from './test-utils';
import { DescriptionContent } from '../src/language-server/generated/ast';

const services = createCoreDslServices(EmptyFileSystem).CoreDsl;
//console.log(services)

describe('Cross references from declaration', () => {
    test('Find all references', async () => {
        var result : LangiumDocument<DescriptionContent> = await parseDocument(services, `
        InstructionSet TestISA {
            architectural_state { 
                [[is_pc]] int PC ;
                int Xreg[32];
                float Freg[32];
            }
            instructions {
                FOO {
                    encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b1111011;  
                    assembly: "{name(rd)}, {name(rs1)}, {name(rs2)}";
                    behavior: {
                        switch(rs1) {
                            case 1: break;
                            case 2: break;
                        }
                    }
                }
            }
        }
        `)
        expectNoErrors(result)
        console.log(result.parseResult.lexerErrors)
        console.log("mimimi")
        expect(true, 'Result code should be 0').toBe(true);
    });
});