import { KahnGraph } from '../mod.ts';

export type Item<T> = {
  id: string;
  value: T;
};

/**
 * topological sort wrapper
 */
export const topoSort = <T>(
  items: Item<T>[],
  ignoreKeys: string[],
  getDependencies: (item: Item<T>) => string[]
): Item<T>[] => {
  const res = {};
  const nodes = new Map<string, Item<T>>();

  const useItems = items.filter((item) => !ignoreKeys.includes(item.id));
  const keys = useItems.map((i) => i.id);

  for (let item of useItems) {
    res[item.id] = getDependencies(item);
    nodes.set(item.id, item);
  }

  const graph = new KahnGraph();

  for (let node of nodes.values()) {
    graph.addNode(node);
  }

  for (let item of useItems) {
    for (let link of getDependencies(item)) {
      if (item.id !== link && keys.includes(link)) {
        graph.addEdge(nodes.get(item.id), nodes.get(link));
      }
    }
  }

  const sortedItems: Item<T>[] = graph.sort();
  sortedItems.reverse();
  return sortedItems;
};
