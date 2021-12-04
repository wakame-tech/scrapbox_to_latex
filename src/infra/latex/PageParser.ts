import { DecorationNode, Line, Page } from '../../mod.ts';
import { LaTeXSubSection, LaTeXSubSubSection } from './LaTeX.ts';
import { toHash } from './Hash.ts';
import { urlToPath } from '../scrapbox/ImageDownloader.ts';
import { basename } from 'https://deno.land/std/path/mod.ts';

// [** ] -> \subsection, [* ] -> \subsubsection
const convertDecorationNode = (
  node: DecorationNode
): { level: 'subsection' | 'subsubsection'; text: string } => {
  if (node.decos[0] === '*-2') {
    return {
      level: 'subsection',
      text: node.nodes[0].raw,
    };
  } else {
    return {
      level: 'subsubsection',
      text: node.nodes[0].raw,
    };
  }
};

type ParserContext = {
  links: Set<string>;
  subSections: LaTeXSubSubSection[];
  sectionTitle: string;
  subSectionTitle: string;
  content: string;
  isInEnumerate: boolean;
};

/**
 * generate subsub Section
 */
const flushSubSubSection = (context: ParserContext): ParserContext => {
  // end of subsection
  // console.log(`------ end: ${context.sectionTitle}.${context.subSectionTitle}`);
  // console.log(`\n"${context.content}"\n`);
  context.subSections.push({
    title: context.subSectionTitle,
    content: context.content.trim(),
  });

  context.content = '';
  return context;
};

/**
 * parse scrapbox line
 */
const parseLine = (block: Line, context: ParserContext): ParserContext => {
  if (block.indent >= 1) {
    if (!context.isInEnumerate) {
      context.content += `\\begin{itemize} \n`;
    }
    context.isInEnumerate = true;
  } else {
    if (context.isInEnumerate) {
      context.content += `\\end{itemize}\n`;
    }
    context.isInEnumerate = false;
  }

  if (context.isInEnumerate) {
    context.content += `\t\\item `;
  }

  // console.log(`${context.isInEnumerate} ${block.nodes.map((n) => n.raw).join(" ")}`);

  for (let node of block.nodes) {
    if (node.type === 'plain' && node.text.trim().length !== 0) {
      context.content += node.text.trim();
    } else if (node.type === 'formula') {
      const formula = node.formula
        .replace(/(?:\{\})?\^\\exists?/g, '{}^{\\exists}')
        .replace(/(?:\{\})?\^\\forall/g, '{}^{\\forall}');

      if (block.nodes.length === 1 && formula.length >= 20) {
        context.content += `\n\\[\n${formula}\n\\]`;
      } else {
        context.content += ` $${formula}$ `;
      }
    } else if (node.type === 'code') {
      // TODO: support code block
      context.content += ``;
    } else if (node.type === 'strong') {
      context.content += `\\textbf{${node.nodes[0].raw}}`;
    } else if (node.type === 'decoration') {
      // maybe mistake [[strong]] as [* strong]
      if (block.nodes.length !== 1) {
        const { level, text } = convertDecorationNode(node);
        context.content += `\\textbf{${text}}`;
        continue;
      }

      context = flushSubSubSection(context);
      const { level, text } = convertDecorationNode(node);
      // start next subsection
      context.subSectionTitle = text;
    } else if (node.type === 'image') {
      const { src } = node;
      const projectNamePrefix = '\\Proj';
      const path = `${projectNamePrefix}/res/${basename(urlToPath(src))}`;
      context.content += `
\\begin{figure}[H]
  \\centering
  \\includegraphics[width=\\linewidth]{${path}}
\\end{figure}

`;
      // console.log(`image: ${node.src}`)
    } else if (node.type === 'link') {
      // url
      if (node.pathType === 'absolute') {
        // TODO: \cite
      } else if (node.pathType === 'relative') {
        if (context.links.has(node.href)) {
          const id = toHash(node.href);
          context.content += `\\hyperref[${id}]{${node.href}}`;
        } else {
          context.content += `\\url{${node.href}}`;
        }
      }
    }
  }

  return context;
};

export const parsePage = (page: Page, links: Set<string>): LaTeXSubSection => {
  let context: ParserContext = {
    links,
    subSections: [],
    sectionTitle: '',
    subSectionTitle: '',
    content: '',
    isInEnumerate: false,
  };

  for (let block of page) {
    if (block.type === 'title') {
      context.sectionTitle = block.text;
    } else if (block.type === 'line') {
      context = parseLine(block, context);
      context.content += '\n';
    } else if (block.type === 'codeBlock') {
      const { fileName, content } = block;
      context.content += `
\\begin{lstlisting}[caption=${fileName}]
${content}
\\end{lstlisting}
`;
    } else if (block.type === 'table') {
      // TODO: support table
    }
  }

  if (context.isInEnumerate) {
    context.content += `\\end{itemize}`;
    context.isInEnumerate = false;
  }

  context = flushSubSubSection(context);

  const section: LaTeXSubSection = {
    title: context.sectionTitle,
    subsubSections: context.subSections,
  };

  // console.log(section);

  return section;
};
