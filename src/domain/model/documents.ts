import { Page } from "@progfay/scrapbox-parser";

export type DocNode = {
  title: string;
  page: Page
  links: string[];
};

export interface DocNodeDecoder<T> {
  decode(item: T): DocNode;
}

export interface DocNodeEncoder<T> {
  encode(docNode: DocNode): T;
}