import { DocNode, DocNodeDecoder, DocNodeEncoder } from './model/documents';
import { parse } from '../mod.ts'
import { ScrapBoxDump } from './model/scrapbox';
import { sortedWithDependency } from './Sorter.ts'

export const scrapBoxDumpToLaTeX = (
  dump: ScrapBoxDump,
  ignorePages: string[],
  decoder: DocNodeDecoder<ScrapBoxDump>,
  encoder: DocNodeEncoder<string[]>
): string[] => {
  const docNodes = decoder.decode(dump);
  const sortedDocNodes = sortedWithDependency(docNodes, ignorePages);
  return encoder.encode(sortedDocNodes);
};

export const convertSinglePage = (
  pageContent: string,
  encoder: DocNodeEncoder<string>
): string => {
  // console.log(pageContent);
  const page = parse(pageContent);
  // console.log(page);

  const doc: DocNode = {
    title: page.title,
    page,
    links: [],
  }

  return encoder.encode([doc]);
}