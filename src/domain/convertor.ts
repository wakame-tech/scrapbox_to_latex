import { DocNodeDecoder, DocNodeEncoder } from './model/documents';
import { ScrapBoxDump } from './model/scrapbox';
import { sortedWithDependency } from './Sorter.ts'

export const scrapBoxDumpToLaTeX = (
  dump: ScrapBoxDump,
  ignorePages: string[],
  decoder: DocNodeDecoder<ScrapBoxDump>,
  encoder: DocNodeEncoder<string>
): string => {
  const docNodes = decoder.decode(dump);
  const sortedDocNodes = sortedWithDependency(docNodes, ignorePages);
  return encoder.encode(sortedDocNodes);
};
