import { parse } from 'https://deno.land/std@0.66.0/flags/mod.ts';
import { Chapter, Section } from './model/documents.ts';
import { ScrapBoxDump } from './scrapbox/types.ts';
import { encodeSection } from './latex/sectionEncoder.ts';
import { decodeSection } from './scrapbox/decoder.ts';
import { topoSort, Item } from './infra/TopoSort.ts';

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
  const dir = `./${chapter.title}`;
  const includeLaTeXPathPrefix = '\\Proj';

  let indexTex = '';
  for (const section of chapter.sections) {
    const sanitizedPath = section.path
      .replace(/[\\/:\*\?"<>\|]/g, '')
      .replace(/ /g, '_');
    const filePath = `./${dir}/${sanitizedPath}.tex`;
    const content = encodeSection(section);
    indexTex += `\\input{${includeLaTeXPathPrefix}/${sanitizedPath}}\n`;
    // console.log(`- ${filePath}`);
    Deno.writeTextFileSync(filePath, content);
  }
  Deno.writeTextFileSync(`./${dir}/index.tex`, indexTex);
};

const main = async () => {
  const args = parse(Deno.args);
  if (args._[0] === null) {
    console.error('no json file path');
    Deno.exit(1);
  }

  const file = Deno.readTextFileSync(args._[0].toString());
  const dump: ScrapBoxDump = JSON.parse(file);
  const i = 4;
  const sections = dump.pages.slice(i, i + 1).map((page) => decodeSection(page));
  const sortedSections = sortedSectionsWithDependency(sections);
  console.log(JSON.stringify(sortedSections[0], null, 2));
  const tex = encodeSection(sortedSections[0]);
  console.log(tex);
};

main();
