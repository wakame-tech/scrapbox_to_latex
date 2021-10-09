import { DecorationNode, Page } from "@progfay/scrapbox-parser";

type LaTeXSubSection = {
  title: string
  subSections: LaTeXSubSubSection[]
}

type LaTeXSubSubSection = {
  title: string
  content: string
}

// [** ] -> \subsection, [* ] -> \subsubsection
const convertDecorationNode = (node: DecorationNode): { level: 'subsection' | 'subsubsection', text: string } => {
  if (node.decos[0] === '*-2') {
    return {
      level: 'subsection',
      text: node.nodes[0].raw
    }
  } else if (node.decos[0] === '*-1') {
    return {
      level: 'subsubsection',
      text: node.nodes[0].raw
    }
  }
}

export const scrapBoxToLaTeXSection = (page: Page): LaTeXSubSection => {
  const subSections: LaTeXSubSubSection[] = []
  let sectionTitle = ''
  let subSectionTitle = ''
  let content = ''
  let isInEnumerate = false

  for (let block of page) {
    if (block.type === 'title') {
      sectionTitle = block.text;
    }
    else if (block.type === "line") {
      if (block.indent === 1) {
        if (!isInEnumerate) {
          content += `\\begin{enumerate}\n`
        }
        isInEnumerate = true;
      } else {
        if (isInEnumerate) {
          content += `\\end{enumerate}\n`
        }
        isInEnumerate = false;
      }

      if (isInEnumerate) {
        content += `  \\item `;
      }

      for (let node of block.nodes) {
        // console.log(`${isInEnumerate} ${node.raw}`)
        if (node.type === 'plain') {
          content += node.text.trim()
        }
        else if (node.type === 'formula') {
          content += ` $${node.formula}$ `
        }
        else if (node.type === 'code') {
          content += ``
        }
        else if (node.type === 'strong') {
          content += `\\textbf{${node.nodes[0].raw}}`
        }
        else if (node.type === 'decoration') {
          const { level, text } = convertDecorationNode(node)
          if (level === 'subsection') {
            // end of subsection
            if (subSectionTitle !== '') {
              subSections.push({
                title: subSectionTitle,
                content: content.trim()
              })
            }
            // start next subsection
            subSectionTitle = text;
            content = ''
          }
        }
        else if (node.type === 'image') {
          // TODO: support image
          console.log(`image: ${node.src}`)
        }
        else if (node.type === 'link') {
          // url
          if (node.pathType === 'absolute') {
            // TODO: \cite
          } else if (node.pathType === 'relative') {
            content += `${node.href}`
          }
        }
      }
    }
    content += '\n'
    // 'codeBlock', 'table' not supported
  }

  subSections.push({
    title: subSectionTitle,
    content: content
  })

  const section: LaTeXSubSection = {
    title: sectionTitle,
    subSections: subSections,
  }

  return section;
};


export const dumpLaTeX = (section: LaTeXSubSection): string => {
  let res = '';
  res += `\\subsection{${section.title}}\n`;

  const subSections = section.subSections
    .filter(subSection => !/参考.*/.test( subSection.title))
  for (let subSection of subSections) {
    res += `\\subsubsection{${subSection.title}}\n`;
    res += subSection.content;
    res += "\n";
  }
  return res;
}