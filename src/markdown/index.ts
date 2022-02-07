import { Chapter } from '../model/documents.ts';
import { encodeSection } from './sectionEncoder.ts';

export const dumpMarkdownFiles = async (chapter: Chapter): Promise<void> => {
  const mds: { path: string; md: string; bib: string }[] = [];
  const dir = `${chapter.title}`;
  let bibTeX = '';
  const bibTeXPath = `${dir}/refs.bib`;

  for (const section of chapter.sections) {
    const md = encodeSection(section);
    const sanitizedPath = section.title
      .replace(/[$\\/:\*\?"<>\|]/g, '')
      .replace(/ /g, '_');
    const path = `${dir}/${sanitizedPath}.md`;
    mds.push({
      path,
      md,
      bib: section.bibTeX,
    });
  }

  Deno.mkdirSync(dir, { recursive: true });
  for (const { path, md, bib } of mds) {
    console.log(`dump ${path}`);
    bibTeX += `${bib}\n`;
    Deno.writeTextFileSync(path, md);
  }

  Deno.writeTextFileSync(bibTeXPath, bibTeX);
  console.log(`dump ${bibTeXPath}`);
};
