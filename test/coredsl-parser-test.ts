import { EmptyFileSystem } from 'langium';
import { describe, test } from 'vitest';
import { createCoreDslServices } from '../src/language-server/core-dsl-module';
import { assertNoLexerAndParseErrors, parse } from './test-utils';

const services = createCoreDslServices(EmptyFileSystem).CoreDsl;

describe('Test Parser', () => {
    test('parseInstrPRELU', async () => {
        let doc = await parse(addInstructionContext(`PRELU {
            encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b1111011;  
            assembly: "{name(rd)}, {name(rs1)}, {name(rs2)}";
            behavior: {
                static float alpha = 0.2;  
                float input, new_alpha;
                input = Freg[rs1];  // read global F register
                if (rs2!=0) // avoid having an additional instruction for setting parameter
                    new_alpha = Freg[rs2];
                else 
                    new_alpha = alpha; // use the stored alpha when rs2==0
                if(input > 0)
                    Freg[rd] = input;
                else 
                    Freg[rd] = input*new_alpha; 
                if (rs2!=0)
                    alpha = new_alpha; // update internal alpha register
                }
        }`));
        assertNoLexerAndParseErrors(doc);
    });
    test('parseInstrPRELU', async () => {
        let doc = await parse(addInstructionContext(`SBOX {
            encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b1111011;  
            assembly: "{name(rd)}, {name(rs1)}, {name(rs2)}";
            behavior: {
                unsigned int data_i;
                // contents of array omitted for for brevity        
                const unsigned char sbox[256] = { 0x63, 0x7c, 0};  
                data_i = (unsigned int) Xreg[rs1];  
                Xreg[rd] = sbox[data_i[31:24]] :: sbox[data_i[23:16]] :: sbox[data_i[15:8]] :: sbox[data_i[7:0]];
            }
        }`));
        assertNoLexerAndParseErrors(doc);
    });
    test('parseInstrSQRTFloatRegs', async () => {
        let doc = await parse(`InstructionSet TestISA {
            architectural_state {
                float F_Ext[32];}
            instructions { 
                vectorL {
                    encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b1111011 ;
                    assembly: "{name(rd)}, {name(rs1)}";
                    behavior: { 
                    float xc = F_Ext[rs1];     
                    float yc = F_Ext[rs1];
                    float sqdist = xc*xc + yc*yc;
                    //...SQRT(sqdist) computation
                    }
                }
            }
        }`);
        assertNoLexerAndParseErrors(doc);
    });
    test('parseInstrSpawn', async () => {
        let doc = await parse(`InstructionSet TestISA {
            architectural_state {
                [[is_pc]] int PC;
                float Freg[32];
                bool F_ready[32] [[is_interlock_for=Freg]];  // use attribute to indicate purpose of F_ready
            }
            instructions {
                SIN {
                    encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b1111011 ;
                    assembly: "#{name(rd)}, {name(rs1)}";
                    behavior: { 
                        double theta = Freg[rs1];
                        F_ready[rd] = false;            // synchronously mark result as unavailable
                        spawn {                         // asynchronously do the following block
                                Freg[rd] = 0.01f;     // first perform the computation        
                                F_ready[rd] = true;     // afterwards mark the result as ready
                        }
                    }
                }
            }
        }`);
        assertNoLexerAndParseErrors(doc);
    });
    test('parseInstrZOL', async () => {
        let doc = await parse(`InstructionSet TestISA {
            architectural_state {
                int PC;
                int X[32];
                unsigned int count, endpc, startpc;
            }
            functions {
                void doZOL(){      
                    bool zolactive = true; 
                    while (zolactive) {         // keep executing while condition is true
                        if (PC == endpc) {      // evaluate loop body once per clock cycle
                            if (count != 0) {
                                --count;
                                PC = startpc;   // jump to loop start
                            } else
                                zolactive = false;  // iteration limit reached, stop execution
                        }
                    }
                }
            }
            instructions {
                LP_SETUPI {
                    encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b1111011 ;
                    assembly: "{name(rs1)}, {name(rs2)}";
                    behavior: {
                        count   = X[rs1];
                        endpc   = PC + 4 + X[rs2]<<2; // use PC relative addressing to save bits
                        startpc = PC + 4; 
                        spawn doZOL(); // Keep running after LPSETUPI ends
                    }
                }
            }
        }`);
        assertNoLexerAndParseErrors(doc);
    });
    test('parseInstrSwitch', async () => {
        let doc = await parse(addInstructionContext(`FOO {
            encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b1111011;  
            assembly: "{name(rd)}, {name(rs1)}, {name(rs2)}";
            behavior: {
                switch(rs1) {
                    case 1: break;
                    case 2: break;
                }
            }
        }`));
        assertNoLexerAndParseErrors(doc);
    });
});

function addInstructionContext(str: string): string {
    return `
    InstructionSet TestISA {
        architectural_state { 
            [[is_pc]] int PC ;
            int Xreg[32];
            float Freg[32];
        }
        instructions {
            ${str}
        }
    }
    `
}