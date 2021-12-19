import { parse } from 'https://deno.land/std@0.66.0/flags/mod.ts';
import { Chapter, InlineTexts, Section } from './model/documents.ts';
import { ScrapBoxDump } from './scrapbox/types.ts';
import { encodeSection } from './latex/sectionEncoder.ts';
import { decodeSection } from './scrapbox/decoder.ts';
import { topoSort, Item } from './util/TopoSort.ts';

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

const dumpFiles = async (chapter: Chapter): Promise<void> => {
  const texs: { path: string; tex: string }[] = [];
  const dir = `${chapter.title}`;
  const includeLaTeXPathPrefix = '\\Proj';

  for (const section of chapter.sections) {
    const tex = encodeSection(section);
    const sanitizedPath = section.title
      .replace(/[$\\/:\*\?"<>\|]/g, '')
      .replace(/ /g, '_');
    const path = `${dir}/${sanitizedPath}.tex`;
    texs.push({
      path,
      tex,
    });
  }

  let indexTex = '';
  const indexTeXPath = `${dir}/index.tex`;

  Deno.mkdirSync(dir, { recursive: true });
  for (const { path, tex } of texs) {
    indexTex += `\\input{${includeLaTeXPathPrefix}/${path}}\n`;
    console.log(`dump ${path}`);
    Deno.writeTextFileSync(path, tex);
  }
  Deno.writeTextFileSync(indexTeXPath, indexTex);
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
  Deno.mkdirSync(`${dir}/res`, { recursive: true });
  const sections = await Promise.all(
    dump.pages.map((page) => decodeSection(dir, page))
  );

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

  const sortedSections = sortedSectionsWithDependency(sections);
  dumpFiles({
    type: 'chapter',
    title: dump.name,
    sections: sortedSections,
  });
};

main();
