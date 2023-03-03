import { describe, expect, test, afterEach } from 'vitest';
import { /*AstNode, LangiumDocument, ReferenceDescription,*/ AstNode, EmptyFileSystem, LangiumDocument } from 'langium';
import { clearDocuments, parseDocument } from 'langium/test';
import { createCoreDslServices } from '../src/language-server/core-dsl-module';
//import { parse } from 'path';
//import { DescriptionContent } from '../src/language-server/generated/ast';
import { DescriptionContent } from '../src/language-server/generated/ast';
import { assertNoErrors, assertNoLexerAndParseErrors, parse, assertErrors } from './test-utils';
import { Diagnostic } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

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

    test('globalScopeFromFile', async () => { // TODO import "https://raw.githubusercontent.com/Minres/RISCV_ISA_CoreDSL/master/RISCVBase.core_desc"
        let doc = await parse(`
        //import "https://raw.githubusercontent.com/Minres/RISCV_ISA_CoreDSL/master/RISCVBase.core_desc"
        import "RISCVBase.core_desc"
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
        }`, [URI.parse("RISCVBase.core_desc"), `InstructionSet RISCVBase {
            architectural_state {
                unsigned int XLEN;
                unsigned int INSTR_ALIGNMENT = 4;
                unsigned int RFS = 32;
        
                unsigned int fence = 0;
                unsigned int fencei = 1;
                unsigned int fencevmal = 2;
                unsigned int fencevmau = 3;
        
                // core registers
                register unsigned<XLEN> X[RFS] [[is_main_reg]];
                register unsigned<XLEN> PC [[is_pc]];
        
                // register aliases
                unsigned<XLEN>& ZERO = X[0];
                unsigned<XLEN>& RA = X[1];
                unsigned<XLEN>& SP = X[2];
                unsigned<XLEN>& GP = X[3];
                unsigned<XLEN>& TP = X[4];
                unsigned<XLEN>& T0 = X[5];
                unsigned<XLEN>& T1 = X[6];
                unsigned<XLEN>& T2 = X[7];
                unsigned<XLEN>& S0 = X[8];
                unsigned<XLEN>& S1 = X[9];
                unsigned<XLEN>& A0 = X[10];
                unsigned<XLEN>& A1 = X[11];
                unsigned<XLEN>& A2 = X[12];
                unsigned<XLEN>& A3 = X[13];
                unsigned<XLEN>& A4 = X[14];
                unsigned<XLEN>& A5 = X[15];
                unsigned<XLEN>& A6 = X[16];
                unsigned<XLEN>& A7 = X[17];
                unsigned<XLEN>& S2 = X[18];
                unsigned<XLEN>& S3 = X[19];
                unsigned<XLEN>& S4 = X[20];
                unsigned<XLEN>& S5 = X[21];
                unsigned<XLEN>& S6 = X[22];
                unsigned<XLEN>& S7 = X[23];
                unsigned<XLEN>& S8 = X[24];
                unsigned<XLEN>& S9 = X[25];
                unsigned<XLEN>& S10 = X[26];
                unsigned<XLEN>& S11 = X[27];
                unsigned<XLEN>& T3 = X[28];
                unsigned<XLEN>& T4 = X[29];
                unsigned<XLEN>& T5 = X[30];
                unsigned<XLEN>& T6 = X[31];
        
                // address spaces
                extern char MEM[1 << XLEN] [[is_main_mem]];
                extern unsigned<XLEN> FENCE[8];
                extern char RES[8]; // reservation address space
        
                // supplemental state register
                register unsigned<3> PRIV = 3;
                register unsigned<XLEN> DPC = 0;
            }
        
            functions {
                extern void raise(int irq, int mcause);
                extern void leave(int priv_lvl);
                extern void wait(int flag);
            }
        }
        `]);
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

