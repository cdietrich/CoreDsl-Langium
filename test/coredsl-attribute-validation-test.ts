import { describe, expect, test, afterEach } from 'vitest';
import {  EmptyFileSystem } from 'langium';
import { clearDocuments } from 'langium/test';
import { createCoreDslServices } from '../src/language-server/core-dsl-module';
import { assertNoErrors, parse, assertErrors } from './test-utils';
import { AttributeUsage, KnownAttributes } from '../src/language-server/core-dsl-validator';

const services = createCoreDslServices(EmptyFileSystem).CoreDsl;

describe('Test Atrribute Validation', () => {
    afterEach(() => clearDocuments(services));

    test('validAttributes', async () => {
        function createValidAttribString(u : AttributeUsage): string {
            let parts: string[] = []
            KnownAttributes.forEach((v,k)=> {
                if (v[1] == u) {
                    parts.push("[[" + k + (v[0]>0 ? ("(" + (", 0".repeat(v[0]).substring(2)) + ")") : "") + "]]")
                }
            })
            return parts.join(" ")
        }

		let funcAttribString = createValidAttribString('function');
		let declAttribString = createValidAttribString('declaration');
		let instrAttribString = createValidAttribString('instruction');


        let doc = await parse(`InstructionSet AttributeValidationTestInstructionSet {
            architectural_state {
                unsigned int XLEN;
                unsigned<XLEN> field ${declAttribString};
            }
            functions {
                void fun() ${funcAttribString} {}
            }
            instructions ${instrAttribString} {
                test ${instrAttribString} {
                    encoding: 0;
                    assembly: "";
                    behavior: {}
                }
            }
        }
        Core AttributeValidationTestCore provides AttributeValidationTestInstructionSet {
            architectural_state {
                XLEN=32;
            }
        }`);
        assertNoErrors(doc);
    });


    test('invalidAttributePlacement', async () => {
        let parts: string[] = []
        KnownAttributes.forEach((v,k)=> {
            parts.push("[[" + k + (v[0]>0 ? ("(" + (", 0".repeat(v[0]).substring(2)) + ")") : "") + "]]")
        })
        let attribString = parts.join(" ")
        let model = `
        InstructionSet AttributeValidationTestInstructionSet {
            architectural_state {
                unsigned int XLEN;
                unsigned<XLEN> field ${attribString};
            }
            functions {
                void fun() ${attribString} {}
            }
            instructions ${attribString} {
                test ${attribString} {
                    encoding: 0;
                    assembly: "";
                    behavior: {}
                }
            }
        }
        Core AttributeValidationTestCore provides AttributeValidationTestInstructionSet {
            architectural_state {
                XLEN=32;
            }
        }`
        console.log(model)
        let doc = await parse(model);
        assertErrors(doc, (diagnostics) => {
            expect(diagnostics).toHaveLength(30);
            // TODO make better assertions
            expect(diagnostics[0].message).toBe("unexpected attribute 'do_not_synthesize'")
        });
        
    });

    test('invalidAttributeParameters', async () => {
        function createInvalidAttribString(u : AttributeUsage): string {
            let parts: string[] = []
            KnownAttributes.forEach((v,k)=> {
                if (v[1] == u) {
                    parts.push("[[" + k + ( ("(" + (", 0".repeat(v[0]+1).substring(2)) + ")")) + "]]")
                }
            })
            return parts.join(" ")
        }
        let funcAttribString = createInvalidAttribString('function');
		let declAttribString = createInvalidAttribString('declaration');
		let instrAttribString = createInvalidAttribString('instruction');
        let model = `InstructionSet AttributeValidationTestInstructionSet {
            architectural_state {
                unsigned int XLEN;
                unsigned<XLEN> field ${declAttribString};
            }
            functions {
                void fun() ${funcAttribString} {}
            }
            instructions ${instrAttribString} {
                test ${instrAttribString} {
                    encoding: 0;
                    assembly: "";
                    behavior: {}
                }
            }
        }
        Core AttributeValidationTestCore provides AttributeValidationTestInstructionSet {
            architectural_state {
                XLEN=32;
            }
        }`
        console.log(model)
        let doc = await parse(model);
        assertErrors(doc, (diagnostics) => {
            let sorted_diagnostics = diagnostics
            expect(diagnostics).toHaveLength(18); // TODO better assertions
            expect(diagnostics[0].message).toBe("attribute 'enable' requires exactly 1 parameter(s)")
        });
        
    });


    
});