import { topoSort } from "../infra/TopoSort";
import { DocNode, DocNodeDecoder, DocNodeEncoder } from "./model/documents";
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

export const scrapBoxDumpToLaTeX = (
  dump: ScrapBoxDump, 
  ignorePages: string[],
  decoder: DocNodeDecoder<ScrapBoxDump>,
  encoder: DocNodeEncoder<string>
): string => {
  const docNodes = decoder.decode(dump)
  const sortedDocNodes = sortDocNodesByTitle(docNodes, ignorePages);

  return encoder.encode(sortedDocNodes)
};
