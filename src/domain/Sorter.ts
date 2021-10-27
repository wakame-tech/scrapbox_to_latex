import { topoSort, Item } from '../infra/TopoSort.ts';
import { DocNode } from './model/documents.ts';

export const sortedWithDependency = (
  docNodes: DocNode[],
  ignoreTitles: string[]
): DocNode[] => {
  const kvs: Item[] = docNodes.map((node) => {
    return {
      id: node.title,
      value: node,
    };
  });
  const sortedDocNodes = topoSort(
    kvs,
    ignoreTitles,
    (item) => item.value.links
  );

  return sortedDocNodes
    .map((node) => node.value);
};
