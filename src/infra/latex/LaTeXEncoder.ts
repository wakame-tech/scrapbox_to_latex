import { DocNode, DocNodeEncoder } from '../../domain/model/documents';
import { parsePage } from './PageParser.ts';
import { LaTeXSubSection, LaTeXSubSubSection } from './LaTeX.ts';
import { encode } from 'https://deno.land/std/encoding/base64.ts';

/**
 * SubSubSection object ->  LaTeX subsubsection
 */
const encodeLaTeXSubSubSection = (
  subsubSection: LaTeXSubSubSection
): string => {
  let res = '';
  if (subsubSection.title === '定義') {
    res += `
\\begin{def.}[${subsubSection.title}]
${subsubSection.content}
\\end{def.}
`;
  } else if (subsubSection.title === '例') {
    res += `
\\begin{ex.}[${subsubSection.title}]
${subsubSection.content}
\\end{ex.}
`;
  } else {
    res += `\\subsection{${subsubSection.title}}\n`;
    res += `${subsubSection.content}\n`;
  }

  if (subsubSection.content === '') {
    res += `\\todo{書く}`;
  }

  res += '\n';
  return res;
};

/**
 * SubSection object ->  LaTeX subsection
 */
const docNodeToLaTeX = (section: LaTeXSubSection): string => {
  let res = '';
  res += `\\section{${section.title}}\n`;
  const label = encode(section.title);
  res += `\\label{${label}}`;

  const useSubSubSections = section.subsubSections.filter(
    (subSection) => !/参考.*/.test(subSection.title)
  );
  res += useSubSubSections
    .filter((subsubSection) => subsubSection.title !== '')
    .map((subsubSection) => encodeLaTeXSubSubSection(subsubSection))
    .join('\n');
  return res;
};

/**
 * DocNode[] -> SubSection object
 */
export class LaTeXEncoder implements DocNodeEncoder<string> {
  encode(nodes: DocNode[]): string {
    const pageTitles = new Set<string>();
    for (let node of nodes) {
      pageTitles.add(node.title);
    }

    return nodes
      .map((node) => {
        const section = parsePage(node.page, pageTitles);
        return docNodeToLaTeX(section);
      })
      .join('\n');
  }
}
