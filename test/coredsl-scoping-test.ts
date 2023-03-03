import { describe, expect, test, afterEach } from 'vitest';
import { /*AstNode, LangiumDocument, ReferenceDescription,*/ AstNode, EmptyFileSystem, LangiumDocument } from 'langium';
import { clearDocuments, parseDocument } from 'langium/test';
import { createCoreDslServices } from '../src/language-server/core-dsl-module';
//import { parse } from 'path';
//import { DescriptionContent } from '../src/language-server/generated/ast';
import { DescriptionContent } from '../src/language-server/generated/ast';
import { assertNoErrors, assertNoLexerAndParseErrors, parse, assertErrors } from './test-utils';
import { Diagnostic } from 'vscode-languageserver';

const services = createCoreDslServices(EmptyFileSystem).CoreDsl;
//console.log(services)

describe('Test Scoping', () => {
    afterEach(() => clearDocuments(services));

    test('useBeforeDeclaration', async () => {
        let doc = await parse(`InstructionSet TestISA {
            instructions {
                Inst1 {
                    encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b0000000;  
                    assembly: "{name(rd)}, {name(rs1)}, {name(rs2)}";
                    behavior: {
                        x = 0;
                        int x;
                    }
                }
            }
        }`);
        assertErrors(doc, (diagnostics) => {
            expect(diagnostics).toHaveLength(1);
            expect(diagnostics[0].message).toBe("Could not resolve reference to NamedEntity named 'x'.")
        });
        
    });

    test('declarationBeforeUse', async () => {
       let doc = await parse(`InstructionSet TestISA {
            instructions {
                Inst1 {
                    encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b0000000;  
                    assembly: "{name(rd)}, {name(rs1)}, {name(rs2)}";
                    behavior: {
                        int x;
                        x = 0;
                    }
                }
            }
        }`);
        assertNoErrors(doc);
    });

    test('useBeforeDeclarationNested', async () => {
        let doc = await parse(`InstructionSet TestISA {
            instructions {
                Inst1 {
                    encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b0000000;  
                    assembly: "{name(rd)}, {name(rs1)}, {name(rs2)}";
                    behavior: {
                        {
                            x = 0;
                        }
                        int x;
                    }
                }
            }
        }`);
        assertErrors(doc, (diagnostics) => {
            expect(diagnostics).toHaveLength(1);
            expect(diagnostics[0].message).toBe("Could not resolve reference to NamedEntity named 'x'.")
        });
    });

    test('declarationBeforeUseNested', async () => {
        let doc = await parse(`InstructionSet TestISA {
            instructions {
                Inst1 {
                    encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b0000000;  
                    assembly: "{name(rd)}, {name(rs1)}, {name(rs2)}";
                    behavior: {
                        int x;
                        {
                            x = 0;
                        }
                    }
                }
            }
        }`);
        assertNoErrors(doc);
    });

    test('globalScope', async () => {
        let doc = await parse(`InstructionSet TestISA {
            architectural_state {
                int CCC = 42;
                unsigned int X[32];
            }

            functions {
                int foo(int arg) {
                    return arg;
                }
            }

            instructions {
                Inst1 {
                    encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b0000000;  
                    assembly: "{name(rd)}, {name(rs1)}, {name(rs2)}";
                    behavior: {
                        X[rd] = X[rs1] + X[rs2] + foo(CCC);
                    }
                }
            }
        }`);
        assertNoErrors(doc);
    });

    test('globalScopeExtended', async () => {
        let doc = await parse(`InstructionSet TestISA {
            architectural_state {
                int CCC = 42;
                unsigned int X[32];
            }

            functions {
                int foo(int arg) {
                    return arg;
                }
            }
        }
        
        InstructionSet TestISA2 extends TestISA {
            instructions {
                Inst1 {
                    encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b0000000;  
                    assembly: "{name(rd)}, {name(rs1)}, {name(rs2)}";
                    behavior: {
                        X[rd] = X[rs1] + X[rs2] + foo(CCC);
                    }
                }
            }
        }`);
        assertNoErrors(doc);
    });

    test('globalScopeFromFile', async () => { // TODO
        let doc = await parse(`
        //import "https://raw.githubusercontent.com/Minres/RISCV_ISA_CoreDSL/master/RISCVBase.core_desc"
        
        InstructionSet TestISA2 extends RISCVBase {
            instructions {
                Inst1 {
                    encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b0000000;  
                    assembly: "{name(rd)}, {name(rs1)}, {name(rs2)}";
                    behavior: {
                        X[rd] = X[rs1] + X[rs2] + XLEN;
                    }
                }
            }
        }`);
        assertNoErrors(doc);
    });

    test('spawn', async () => {
        let doc = await parse(`InstructionSet TestISA {
            architectural_state {
                int X[32];
                int PC;
            }
            functions {
                void maybe_corrupt_PC(int i) {
                    if ((i & 17) > 3)
                        PC = 0xdeadbeef;
                }
            }
            instructions {
                Inst1 {
                    encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b0000000;  
                    behavior: {
                        int incr = X[rs1] * X[rs2];
                        spawn {
                            int i;
                            for (i = 0; i < 42; i += incr) {
                                maybe_corrupt_PC(i % X[rd]);
                            }
                        }
                    }
                }
            }
        }`);
        assertNoErrors(doc);
    });

    test('forLoopDecl', async () => {
        let doc = await parse(`InstructionSet TestISA {
            instructions {
                Inst1 {
                    encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b0000000;  
                    behavior: {
                        for (int y = 0, z = -1; y < 0 && z != 5; ++y) {}
                    }
                }
            }
        }`);
        assertNoErrors(doc);
    });

    test('doWhile', async () => {
        let doc = await parse(`InstructionSet TestISA {
            instructions {
                Inst1 {
                    encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b0000000;  
                    behavior: {
                        int z = 0;
                        do {
                            z++;
                        } while (z < 10);
                    }
                }
            }
        }`);
        assertNoErrors(doc);
    });

    test('switches', async () => {
        let doc = await parse(`InstructionSet TestISA {
            instructions {
                Inst1 {
                    encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b0000000;  
                    behavior: {
                        int foobar;
                        switch(rs1) {
                            case 1:
                                foobar = rs2;
                                break;
                            case 2: {
                                int foobar = rs2;
                                int baz = foobar;
                                break;
                            }
                        }
                    }
                }
            }
        }`);
        assertNoErrors(doc);
    });


});

