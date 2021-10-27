import { parse } from 'https://deno.land/std@0.66.0/flags/mod.ts';
import { scrapBoxDumpToLaTeX } from './domain/convertor.ts';
import { LaTeXEncoder } from './infra/latex/LaTeXEncoder.ts';
import { ScrapBoxDecoder } from './infra/scrapbox/ScrapBoxDecoder.ts';

const args = parse(Deno.args);
const jsonPath = args['_']?.[0]
if (!jsonPath) {
  throw new Error('jsonPath empty');
}
const dump = JSON.parse(
  Deno.readTextFileSync(jsonPath)
);
const ignoreTitles: string[] = args['ignore-titles']?.split(',') ?? []
console.log(ignoreTitles)
const latex = scrapBoxDumpToLaTeX(
  dump,
  ignoreTitles,
  new ScrapBoxDecoder(),
  new LaTeXEncoder()
);

console.log(latex);
