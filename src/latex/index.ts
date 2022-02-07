import { basename } from 'https://deno.land/std@0.117.0/path/mod.ts';
import { Chapter } from '../model/documents.ts';
import { encodeSection } from './sectionEncoder.ts';

export const dumpLaTeXFiles = async (chapter: Chapter): Promise<void> => {
  const texs: { path: string; tex: string; bib: string }[] = [];
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
      bib: section.bibTeX,
    });
  }

  let indexTex = '';
  const indexTeXPath = `${dir}/index.tex`;

  let bibTeX = '';
  const bibTeXPath = `${dir}/refs.bib`;

  Deno.mkdirSync(dir, { recursive: true });
  for (const { path, tex, bib } of texs) {
    indexTex += `\\input{${includeLaTeXPathPrefix}/${
      basename(path).split('.')[0]
    }}\n`;
    bibTeX += `${bib}\n`;
    console.log(`dump ${path}`);
    Deno.writeTextFileSync(path, tex);
  }
  Deno.writeTextFileSync(indexTeXPath, indexTex);
  console.log(`dump ${indexTeXPath}`);
  Deno.writeTextFileSync(bibTeXPath, bibTeX);
  console.log(`dump ${bibTeXPath}`);
};
