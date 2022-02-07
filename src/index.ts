import { parse } from 'https://deno.land/std@0.66.0/flags/mod.ts';
import { Chapter, InlineTexts, Section } from './model/documents.ts';
import { ScrapBoxDump } from './scrapbox/types.ts';
import { decodeSection } from './scrapbox/decoder.ts';
import { topoSort, Item } from './util/TopoSort.ts';
import { dumpMarkdownFiles } from './markdown/index.ts';

const sortedSectionsWithDependency = (sections: Section[]): Section[] => {
  const items: Item<Section>[] = sections.map((section) => {
    return {
      id: section.title,
      value: section,
    };
  });
  const sorted = topoSort(items, [], (item) => item.value.backLinks);
  return sorted.map((item) => item.value);
};

export const resolveBackLinks = async (sections: Section[]): Promise<void> => {
  // backlink loopup
  for (const section of sections) {
    for (let i = 0; i < section.blocks.length; i++) {
      const block = section.blocks[i];
      if (block.type === 'inlineTexts') {
        for (let j = 0; j < block.texts.length; j++) {
          const text = block.texts[j];
          if (text.type === 'backlink') {
            const lookUp = sections.find((s) => s.title === text.key);
            if (lookUp && lookUp.bibKey) {
              console.log(`backlink lookup: ${text.name} -> ${lookUp.bibKey}`);
              (section.blocks[i] as InlineTexts).texts[j] = {
                type: 'citation',
                key: lookUp.bibKey,
              };
            }
          }
        }
      }
    }
  }
};

const main = async () => {
  const args = parse(Deno.args);
  if (args._[0] === null) {
    console.error('no json file path');
    Deno.exit(1);
  }

  const file = Deno.readTextFileSync(args._[0].toString());
  const dump: ScrapBoxDump = JSON.parse(file);

  const dir = `${dump.name}`;
  const links = dump.pages.map((page) => page.title);
  Deno.mkdirSync(`${dir}/res`, { recursive: true });
  const sections = await Promise.all(
    dump.pages.map((page) => decodeSection(dir, links, page))
  );
  resolveBackLinks(sections);
  const sortedSections = sortedSectionsWithDependency(sections);
  const chapter: Chapter = {
    type: 'chapter',
    title: dump.name,
    sections: sortedSections,
  };

  dumpMarkdownFiles(chapter);
  // dumpLaTeXFiles(chapter);
};

main();
