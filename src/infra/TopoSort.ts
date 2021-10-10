import TopologicalSort from 'topological-sort';

export type Item<T> = {
  key: string;
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

  const useItems = items.filter((item) => !ignoreKeys.includes(item.key));
  const keys = useItems.map((i) => i.key);

  for (let item of useItems) {
    res[item.key] = getDependencies(item);
    nodes.set(item.key, item);
  }

  const sortOp = new TopologicalSort(nodes);
  for (let item of useItems) {
    for (let link of getDependencies(item)) {
      if (item.key !== link && keys.includes(link)) {
        sortOp.addEdge(item.key, link);
      }
    }
  }

  const sorted = sortOp.sort();
  const sortedKeys = [...sorted.keys()];
  const sortedItems: Item<T>[] = [];
  for (let key of sortedKeys) {
    if (nodes.has(key)) {
      sortedItems.push(nodes.get(key)!);
    }
  }

  sortedItems.reverse();
  return sortedItems;
};
