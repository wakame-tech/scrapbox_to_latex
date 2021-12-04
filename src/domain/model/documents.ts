import { Page } from '../../mod.ts'

// TODO
export type DocNode = {
  title: string;
  page: Page;
  links: string[];
};

export type Output = {
  path: string;
  content: string;
}

export interface DocNodeDecoder<T> {
  decode(item: T): DocNode[];
}

export interface DocNodeEncoder<T> {
  encode(docNodes: DocNode[]): T;
}
