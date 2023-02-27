import { describe, it } from 'vitest';
import { /*AstNode, LangiumDocument, ReferenceDescription,*/ EmptyFileSystem, LangiumDocument } from 'langium';
import { parseDocument } from 'langium/test';
import { createCoreDslServices } from '../src/language-server/core-dsl-module';
//import { parse } from 'path';
//import { DescriptionContent } from '../src/language-server/generated/ast';
import {expectNoErrors} from './test-utils';
import { DescriptionContent } from '../src/language-server/generated/ast';

const services = createCoreDslServices(EmptyFileSystem).CoreDsl;
//console.log(services)

describe('Test Parser', () => {
    it('parseInstrPRELU', () => {
        assertNoErrors(addInstructionContext(`PRELU {
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
        }`))
    });
    it('parseInstrPRELU', () => {
        assertNoErrors(addInstructionContext(`SBOX {
            encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b1111011;  
            assembly: "{name(rd)}, {name(rs1)}, {name(rs2)}";
            behavior: {
                unsigned int data_i;
                // contents of array omitted for for brevity        
                const unsigned char sbox[256] = { 0x63, 0x7c, 0};  
                data_i = (unsigned int) Xreg[rs1];  
                Xreg[rd] = sbox[data_i[31:24]] :: sbox[data_i[23:16]] :: sbox[data_i[15:8]] :: sbox[data_i[7:0]];
            }
        }`))
    });
    it('parseInstrSQRTFloatRegs', () => {
        assertNoErrors(`InstructionSet TestISA {
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
        }`)
    });
    // it('parseInstrSQRTUnionRegs', () => {
    //     assertNoErrors(`InstructionSet TestISA {
    //         architectural_state {
    //             union ISAXRegFile{
    //                 double doublePrec;  // for a double precision entry
    //                 struct vector2d {
    //                     float x_coord;
    //                     float y_coord;
    //                 } vector2d;         // for a 2d vector entry
    //             } ISAXRegFile[32]; 
    //         }
    //         instructions { 
    //             vectorL {
    //                 encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b1111011 ;
    //                 assembly: "{name(rd)}, {name(rs1)}";
    //                 behavior: { 
    //                     float xc = ISAXRegFile[rs1].vector2d.x_coord;
    //                     float yc = ISAXRegFile[rs1].vector2d.y_coord;
    //                     double result;
    //                     double sqdist = xc*xc + yc*yc;
    //                     if((sqdist==0) || (sqdist[30:23]==0xff))
    //                         result = 0; // avoid special cases
    //                     else
    //                         result = 1;//sqrt(sqdist);  
    //                     ISAXRegFile[rd].doublePrec = result;
    //                 }
    //             }
    //         }
    //     }`)
    // });
    it('parseInstrSpawn', () => {
        assertNoErrors(`InstructionSet TestISA {
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
        }`)
    });
    it('parseInstrZOL', () => {
        assertNoErrors(`InstructionSet TestISA {
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
        }`)
    });
    it('parseInstrSwitch', () => {
        assertNoErrors(addInstructionContext(`FOO {
            encoding: 0b0000000 :: rs2[4:0] :: rs1[4:0] :: 0b000 :: rd[4:0] :: 0b1111011;  
            assembly: "{name(rd)}, {name(rs1)}, {name(rs2)}";
            behavior: {
                switch(rs1) {
                    case 1: break;
                    case 2: break;
                }
            }
        }`))
    });
});

async function assertNoErrors(model: string) {
    var result : LangiumDocument<DescriptionContent> = await parseDocument(services, model)
    expectNoErrors(result)
}

function addInstructionContext(str: string) : string {
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