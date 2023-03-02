import chalk from 'chalk';
import { Command } from 'commander';
import { DescriptionContent } from '../language-server/generated/ast';
import { CoreDslLanguageMetaData } from '../language-server/generated/module';
import { createCoreDslServices } from '../language-server/core-dsl-module';
import { extractAstNode, setRootFolder } from './cli-util';
import { generateJavaScript } from './generator';
import { NodeFileSystem } from 'langium/node';
export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createCoreDslServices(NodeFileSystem).CoreDsl;
    const lexer = services.parser.Lexer
    const m = `import '\\xa'`
    //const m = "4"
    const res = lexer.tokenize(m)
      console.log(res)
      for (var val of res.tokens) {
        console.log(val.tokenType.name)
      }
    await setRootFolder(services, opts.root);
    const model = await extractAstNode<DescriptionContent>(fileName, services);
    const generatedFilePath = generateJavaScript(model, fileName, opts.destination);
    console.log(chalk.green(`JavaScript code generated successfully: ${generatedFilePath}`));
};

export type GenerateOptions = {
    destination?: string;
    root?: string;
}

export default function(): void {
    const program = new Command();

    program
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .version(require('../../package.json').version);

    const fileExtensions = CoreDslLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .option('-r, --root <dir>', 'source root folder')
        .description('generates JavaScript code that prints "Hello, {name}!" for each greeting in a source file')
        .action(generateAction);

    program.parse(process.argv);
}
