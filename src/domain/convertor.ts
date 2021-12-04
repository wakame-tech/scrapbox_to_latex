import { existsSync } from 'https://deno.land/std/fs/mod.ts';
import { DocNode, DocNodeDecoder, DocNodeEncoder } from './model/documents.ts';
import { parse } from '../mod.ts';
import { ScrapBoxDump } from './model/scrapbox.ts';
import { Output } from './model/documents.ts';
import { downloadImages } from '../infra/scrapbox/ImageDownloader.ts';
import { sortedWithDependency } from './Sorter.ts';

export const scrapBoxDumpToLaTeX = async (
  dump: ScrapBoxDump,
  ignorePages: string[],
  decoder: DocNodeDecoder<ScrapBoxDump>,
  encoder: DocNodeEncoder<Output[]>
): Promise<Output[]> => {
  const docNodes = decoder.decode(dump);
  const sortedDocNodes = sortedWithDependency(docNodes, ignorePages);

  const dir = `./${dump.name}`;
  if (!existsSync(dir)) {
    Deno.mkdirSync(dir);
  }
  const resDir = `./${dump.name}/res`;
  if (!existsSync(resDir)) {
    Deno.mkdirSync(resDir);
  }

  await downloadImages(resDir, docNodes);

  return encoder.encode(sortedDocNodes);
};

export const convertFromText = async (
  text: string,
  encoder: DocNodeEncoder<Output[]>
): Promise<Output> => {
  const page = parse(text);
  let title = '';
  for (const block of page) {
    if (block.type === 'title') {
      title = block.text;
    }
  }

  const docNodes: DocNode[] = [
    {
      title,
      page,
      links: [],
    },
  ];
  const resDir = `./res`;
  if (!existsSync(resDir)) {
    Deno.mkdirSync(resDir);
  }
  await downloadImages(resDir, docNodes);
  return encoder.encode(docNodes)[0];
};
