import { EmptyFileSystem } from 'langium';
import { describe, expect, test } from 'vitest';
import { createCoreDslServices } from '../src/language-server/core-dsl-module';
import { DescriptionContent } from '../src/language-server/generated/ast';
import { assertNoErrors, assertNoLexerAndParseErrors, parse } from './test-utils';
import {CoreDslInterpreter, EvaluationContext} from '../src/language-server/core-dsl-interpreter';
import { BigIntegerWithRadix } from '../src/language-server/core-dsl-typesystem';

const services = createCoreDslServices(EmptyFileSystem).CoreDsl;

describe('Test Interpreter', () => {
    test('parseInstrPRELU', async () => {
        let doc = await parse(`InstructionSet Test {
            architectural_state {
                int a = 42;
                int b = a + 5;
                int XLEN = a + b;
                [[is_pc]] int PC ;
                int Xreg[XLEN];
                float Freg[a];
            }
        }`);
        assertNoErrors(doc);


        let constants = (doc.parseResult.value as DescriptionContent).definitions[0].declarations
        let rootContext = new EvaluationContext
        let values  = constants.map((declaration)=>{
            return declaration.declaration.declarators.map((declarator) => {
                return CoreDslInterpreter.evaluate(declarator,rootContext)
            });
        }).flat();
        // TODO BigIntegerWithRadix does not inherit from bigint
        expect(values[0]!.value instanceof BigIntegerWithRadix).toBe(true)
        expect((values[0]!.value as BigIntegerWithRadix).value).toBe(BigInt(42))
        expect(typeof values[1]!.value === 'bigint').toBe(true)
        expect((values[1]!.value as bigint)).toBe(BigInt(47))
        expect(typeof values[2]!.value === 'bigint').toBe(true)
        expect((values[2]!.value as bigint)).toBe(BigInt(89))
    });
});