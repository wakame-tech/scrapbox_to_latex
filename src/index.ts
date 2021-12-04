import { parse } from 'https://deno.land/std@0.66.0/flags/mod.ts';
import { scrapBoxDumpToLaTeX, convertFromText } from './domain/convertor.ts';
import { LaTeXEncoder } from './infra/latex/LaTeXEncoder.ts';
import { ScrapBoxDecoder } from './infra/scrapbox/ScrapBoxDecoder.ts';
import { basename } from 'https://deno.land/std/path/mod.ts';

const dumpLaTexFilesSync = (
  projectName: string,
  outputs: { path: string; content: string }[]
) => {
  const includeLaTeXPathPrefix = '\\Proj';
  let indexTex = '';
  for (const { path, content } of outputs) {
    const sanitizedPath = path
      .replace(/[\\/:\*\?"<>\|]/g, '')
      .replace(/ /g, '_');
    const filePath = `./${projectName}/${sanitizedPath}.tex`;
    indexTex += `\\input{${includeLaTeXPathPrefix}/${sanitizedPath}}\n`;
    console.log(`- ${filePath}`);
    Deno.writeTextFileSync(filePath, content);
  }
  Deno.writeTextFileSync(`./${projectName}/index.tex`, indexTex);
};

const cmdConvertFiles = async (
  jsonPath: string,
  ignoreTitles: string[],
  dryRun: boolean
) => {
  const dump = JSON.parse(Deno.readTextFileSync(jsonPath));
  const projectName = basename(jsonPath, '.json');
  // console.log(ignoreTitles)
  const outputs = await scrapBoxDumpToLaTeX(
    dump,
    ignoreTitles,
    new ScrapBoxDecoder(),
    new LaTeXEncoder()
  );

  if (dryRun) {
    Deno.exit(0);
  }
  dumpLaTexFilesSync(projectName, outputs);
};

const cmdConvertSinglePage = async (path: string) => {
  const pageContent = Deno.readTextFileSync(path);
  const output = await convertFromText(pageContent, new LaTeXEncoder());
  // console.log(output.content);
};

// const url = "https://gyazo.com/88c380d94366b104b820d5251a956c79"
// await downloadImage('', url);
// Deno.exit(0);

const args = parse(Deno.args);
const ignoreTitles = args['ignore-titles']?.split(',') ?? [];
const dryRun = !!args['dry-run'];

if (args['_']?.length === 1 && args['_'][0].toString().endsWith('.json')) {
  const jsonPath = args['_']?.[0].toString();
  if (!jsonPath) {
    throw new Error('jsonPath empty');
  }
  cmdConvertFiles(jsonPath, ignoreTitles, dryRun);
} else if (args['_']?.length === 1) {
  const path = args['_']?.[0].toString();
  cmdConvertSinglePage(path);
}
