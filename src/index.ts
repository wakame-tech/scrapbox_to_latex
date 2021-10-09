import { parse } from  '@progfay/scrapbox-parser'
import TopologicalSort from 'topological-sort';
import dump from '../wakame-tech-math_20211001_021452.json'
import { dumpLaTeX, scrapBoxToLaTeXSection } from './renderer/latex'
import { ScrapBoxDump, ScrapBoxPage } from './types';

const serializePages = (
  pages: ScrapBoxPage[],
  ignoreTitles: string[],
): ScrapBoxPage[] => {
  const res = {};
  const nodes = new Map<string, ScrapBoxPage>();

  const allPages = pages
    .filter(page => !ignoreTitles.includes(page.title));

  const pageTitles = allPages.map((p) => p.title);
  for (let page of allPages) {
    res[page.title] = page.linksLc;
    nodes.set(page.title, page);
  }

  const sortOp = new TopologicalSort(nodes);
  for (let page of allPages) {
    for (let link of page.linksLc) {
      if (page.title !== link && pageTitles.includes(link)) {
        sortOp.addEdge(page.title, link);
      }
    }
  }

  const sorted = sortOp.sort();
  const sortedKeys = [...sorted.keys()]
  const sortedPages: ScrapBoxPage[] = []
  for (let key of sortedKeys) {
    if (nodes.has(key)) {
      sortedPages.push(nodes.get(key)!)
    }
  }

  sortedPages.reverse();
  return sortedPages;
};

const pages = (dump as ScrapBoxDump).pages
const ignoreTitles = ["マップ", "記号定義", "参考文献リスト"];
const sortedPages = serializePages(pages, ignoreTitles)
console.log(sortedPages.map((p) => p.title));

for (let page of sortedPages) {
  const pageRaw = page.lines.join("\n");
  const parsed = parse(pageRaw);
  const section = scrapBoxToLaTeXSection(parsed);
  // console.log(dumpLaTeX(section));
}