import { LaTeXEncoder } from "../infra/LaTeXEncoder";
import { ScrapBoxDecoder } from "../infra/ScrapBoxDecoder";
import { topoSort } from "../infra/TopoSort";
import { DocNode } from "./model/documents";
import { ScrapBoxDump } from "./model/scrapbox";

const sortDocNodesByTitle = (docNodes: DocNode[], ignoreTitles: string[]): DocNode[] => {
  const nodes = docNodes.map((node) => {
    return {
      key: node.title,
      value: node,
    };
  });
  const sortedDocNodes = topoSort(
    nodes,
    ignoreTitles,
    (item) => item.value.links
  );
  return sortedDocNodes.map((node) => node.value);
};

export const scrapBoxDumpToLaTeX = (dump: ScrapBoxDump, ignorePages: string[]): string => {
  const decoder = new ScrapBoxDecoder()
  const encoder = new LaTeXEncoder()

  const docNodes = dump.pages
    .map(decoder.decode)
  const sortedDocNodes = sortDocNodesByTitle(docNodes, ignorePages);

  return sortedDocNodes
    .map(encoder.encode)
    .join("\n");
};
