import { Block, DecorationNode, Line, Page } from "@progfay/scrapbox-parser";
import { DocNode, DocNodeEncoder } from "../domain/model/documents";

type LaTeXSubSection = {
  title: string;
  subSections: LaTeXSubSubSection[];
};

type LaTeXSubSubSection = {
  title: string;
  content: string;
};

// [** ] -> \subsection, [* ] -> \subsubsection
const convertDecorationNode = (node: DecorationNode): { level: "subsection" | "subsubsection"; text: string } => {
  if (node.decos[0] === "*-2") {
    return {
      level: "subsection",
      text: node.nodes[0].raw,
    };
  } else if (node.decos[0] === "*-1") {
    return {
      level: "subsubsection",
      text: node.nodes[0].raw,
    };
  }
};

type ParserContext = {
  links: Set<string>
  subSections: LaTeXSubSubSection[];
  sectionTitle: string;
  subSectionTitle: string;
  content: string;
  isInEnumerate: boolean;
};

const parseLine = (block: Line, context: ParserContext): ParserContext => {
  if (block.indent >= 1) {
    if (!context.isInEnumerate) {
      context.content += `\\begin{itemize} \\ \n`;
    }
    context.isInEnumerate = true;
  }
  else {
    if (context.isInEnumerate) {
      context.content += `\\end{itemize}\n`;
    }
    context.isInEnumerate = false;
  }

  if (context.isInEnumerate) {
    context.content += `  \\item `;
  }

  // console.log(`${context.isInEnumerate} ${block.nodes.map(n => n.raw).join(' ')}`);

  for (let node of block.nodes) {
    if (node.type === "plain" && node.text.trim().length !== 0) {
      context.content += node.text.trim();
    } else if (node.type === "formula") {
      context.content += ` $${node.formula}$ `;
    } else if (node.type === "code") {
      // TODO: support code block
      context.content += ``;
    } else if (node.type === "strong") {
      context.content += `\\textbf{${node.nodes[0].raw}}`;
    } else if (node.type === "decoration") {
      const { level, text } = convertDecorationNode(node);
      // end of subsection
      if (context.subSectionTitle !== "") {
        // console.log(`------ end: ${context.sectionTitle}.${context.subSectionTitle}`)
        context.subSections.push({
          title: context.subSectionTitle,
          content: context.content.trim(),
        });
      }
      // start next subsection
      context.subSectionTitle = text;
      context.content = "";
    } else if (node.type === "image") {
      // TODO: support image
      // console.log(`image: ${node.src}`)
    } else if (node.type === "link") {
      // url
      if (node.pathType === "absolute") {
        // TODO: \cite
      } else if (node.pathType === "relative") {
        if (context.links.has(node.href)) {
          const id = Buffer.from(node.href).toString("base64");
          context.content += `\\hyperref[${id}]{${node.href}}`;
        } else {
          context.content += `\\url{${node.href}}`;
        }
      }
    }
  }

  return context
}

const pageToDocNode = (page: Page, links: Set<string>): LaTeXSubSection => {
  let context: ParserContext = {
    links,
    subSections: [],
    sectionTitle: "",
    subSectionTitle: "",
    content: "",
    isInEnumerate: false,
  };

  for (let block of page) {
    if (block.type === "title") {
      context.sectionTitle = block.text;
    }
    else if (block.type === "line") {
      context = parseLine(block, context);
    }
    // context.content += "\n";
    // 'codeBlock', 'table' not supported
  }

  context.subSections.push({
    title: context.subSectionTitle,
    content: context.content,
  });

  const section: LaTeXSubSection = {
    title: context.sectionTitle,
    subSections: context.subSections,
  };

  return section;
};

const encodeLaTeXSubSubSection = (
  subsubSection: LaTeXSubSubSection
): string => {
  let res = "";
  if (subsubSection.title === "定義") {
    res += `
\\begin{def.}[${subsubSection.title}]
${subsubSection.content}
\\end{def.}
`;
  } else if (subsubSection.title === "例") {
    res += `
\\begin{ex.}[${subsubSection.title}]
${subsubSection.content}
\\end{ex.}
`;
  } else {
    res += `\\subsection{${subsubSection.title}}\n`;
  }

  if (subsubSection.content === "") {
    res += `\\todo{書く}`;
  }

  res += "\n";
  return res;
};

export const docNodeToLaTeX = (section: LaTeXSubSection): string => {
  let res = "";
  res += `\\section{${section.title}}\n`;
  const label = Buffer.from(section.title).toString("base64");
  res += `\\label{${label}}`;

  const useSubSubSections = section.subSections.filter(
    (subSection) => !/参考.*/.test(subSection.title)
  );
  res += useSubSubSections
    .map((subsubSection) => encodeLaTeXSubSubSection(subsubSection))
    .join("\n");
  return res;
};

export class LaTeXEncoder implements DocNodeEncoder<string> {
  encode(nodes: DocNode[]): string {
    const pageTitles = new Set<string>();
    for (let node of nodes) {
      pageTitles.add(node.title);
    }

    return nodes
      .map((node) => {
        const section = pageToDocNode(node.page, pageTitles);
        return docNodeToLaTeX(section);
      })
      .join("\n");
  }
}
