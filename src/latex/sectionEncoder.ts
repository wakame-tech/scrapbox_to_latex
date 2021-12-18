import { urlToPath } from '../scrapbox/download.ts';
import { basename } from 'https://deno.land/std/path/mod.ts';
import {
  Block,
  HeaderLevel,
  InlineText,
  InlineTexts,
  Section,
} from '../model/documents.ts';
import { MapDiscriminatedUnion } from '../util/typeutil.ts';

type InlineTextKeyedMap = MapDiscriminatedUnion<InlineText, 'type'>;
const inlineTextParsers: {
  [K in keyof InlineTextKeyedMap]: (node: InlineTextKeyedMap[K]) => string;
} = {
  plainText: (plainText) => plainText.content.trim().replace(/_/g, '\\_'),
  strong: (strong) => `\\textbf{${strong.content}}`,
  inlineFormula: (inlineFormula) => `$${inlineFormula.content}$ `,
  citation: (citation) => `\\cite{${citation.key}}`,
  backlink: (backlink) => `\\hyperref[${backlink.key}]{${backlink.name}}`,
  inlineCode: (inlineCode) => `\\texttt{${inlineCode.content}}`,
};

const inlineTextsEncoder = (inlineTexts: InlineTexts): string => {
  return (
    inlineTexts.texts
      // @ts-ignore
      .map((text) => inlineTextParsers[text.type](text))
      .join(' ')
  );
};

type BlockKeyedMap = MapDiscriminatedUnion<Block, 'type'>;
const blockParsers: {
  [K in keyof BlockKeyedMap]: (node: BlockKeyedMap[K]) => string;
} = {
  image: (image) => {
    if (!image.localPath) {
      console.warn(`image.localPath is not defined.`);
      return '';
    }
    const projectNamePrefix = '\\Proj';
    const path = `${projectNamePrefix}/res/${basename(
      urlToPath(image.localPath)
    )}`;
    return `
\\begin{figure}[H]
  \\centering
  \\includegraphics[width=0.5\\linewidth]{${path}}
\\end{figure}
`;
  },
  inlineTexts: (inlineTexts) => {
    return inlineTextsEncoder(inlineTexts);
  },
  enumerate: (enumerate) => {
    if (enumerate.items.length === 0) {
      return '';
    }
    let res = `\\begin{itemize} \n`;
    res += enumerate.items.map((item) => `  \\item ${item}`).join('\n');
    res += `\\end{itemize}\n`;
    return res;
  },
  code: (code) => {
    return `    
\\begin{lstlisting}[caption=${code.caption}]
${code.code}
\\end{lstlisting}
    `;
  },
  formula: (formula) => {
    return `\n\\[\n${formula.formula}\n\\]\n`;
  },
  header: (header) => {
    const toHeaderTag = (
      level: HeaderLevel
    ): 'section' | 'subsection' | 'subsubsection' => {
      if (level === 1) {
        return 'subsubsection';
      } else if (level === 2) {
        return 'subsection';
      }
      return 'section';
    };
    const label = `\\label{${header.key}}`;
    const text = inlineTextsEncoder(header.content);
    const headerTag = `\\${toHeaderTag(header.level)}{${text}}`;
    return `\n\n${headerTag}${label}\n`;
  },
  scopedBlock: (scopedBlock) => {
    console.warn('scopedBlock is not supported');
    return '';
  },
};

export const encodeSection = (section: Section): string => {
  let res = '';
  for (const block of section.blocks) {
    if (block.type === 'header' && block.content.texts[0].type === 'plainText' && block.content.texts[0].content === '参考文献') {
      break;
    }
    // @ts-ignore
    res += blockParsers[block.type](block);
  }
  return res;
};
