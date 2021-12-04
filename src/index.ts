import { parse } from 'https://deno.land/std@0.66.0/flags/mod.ts';
import { scrapBoxDumpToLaTeX, convertSinglePage } from './domain/convertor.ts';
import { LaTeXEncoder } from './infra/latex/LaTeXEncoder.ts';
import { ScrapBoxDecoder } from './infra/scrapbox/ScrapBoxDecoder.ts';
import { basename } from "https://deno.land/std/path/mod.ts";

const args = parse(Deno.args);

if (args['_']?.length === 1 && args['_'][0].endsWith('.json')) {
  const jsonPath = args['_']?.[0]
  if (!jsonPath) {
    throw new Error('jsonPath empty');
  }
  const dump = JSON.parse(
    Deno.readTextFileSync(jsonPath)
  );
  const projectName = basename(jsonPath, '.json');
  const ignoreTitles: string[] = args['ignore-titles']?.split(',') ?? []
  // console.log(ignoreTitles)
  const latex: { path: string, content: string }[] = scrapBoxDumpToLaTeX(
    dump,
    ignoreTitles,
    new ScrapBoxDecoder(),
    new LaTeXEncoder()
  );
  
  Deno.mkdirSync(`./${projectName}`);
  for (const { path, content } of latex) {
    const sanitizedPath = path.replace(/[\\/:\*\?"<>\|]/g, '');
    const filePath = `./${projectName}/${sanitizedPath}.tex`;
    console.log(`${filePath}`);
    Deno.writeTextFileSync(filePath, content);
  }

  // console.log(latex);
} else if (args['_']?.length === 1) {
  const path = args['_']?.[0]
  const pageContent = Deno.readTextFileSync(path)
  const latex = convertSinglePage(pageContent, new LaTeXEncoder())
  console.log(latex);
}