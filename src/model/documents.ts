export interface Image {
  type: 'image';
  caption: string;
  url: string;
  localPath?: string;
}

export interface PlainText {
  type: 'plainText';
  content: string;
}

export interface InlineFormula {
  type: 'inlineFormula';
  content: string;
}

export interface Citation {
  type: 'citation';
  key: string;
}

export type HeaderLevel = 1 | 2 | 3;

export interface Header {
  type: 'header';
  level: HeaderLevel;
  content: InlineTexts;
  key: string;
}

export interface Backlink {
  type: 'backlink';
  key: string;
  name: string;
}

export interface InlineCode {
  type: 'inlineCode';
  content: string;
}

export interface Strong {
  type: 'strong';
  content: string;
}

export interface Code {
  type: 'code';
  caption: string;
  code: string;
}

export interface Formula {
  type: 'formula';
  formula: string;
}

export type InlineText =
  | PlainText
  | Strong
  | InlineFormula
  | Citation
  | Backlink
  | InlineCode;

export interface InlineTexts {
  type: 'inlineTexts';
  texts: InlineText[];
}

export interface Enumerate {
  type: 'enumerate';
  level: number;
  items: InlineTexts[];
}

export interface ScopedBlock {
  type: 'scopedBlock';
  title: Block;
  content: Block[];
}

export type Block =
  | Image
  | InlineTexts
  | Enumerate
  | Code
  | Formula
  | Header
  | ScopedBlock;

export interface Section {
  type: 'section';
  title: string;
  path: string;
  blocks: Block[];
  backLinks: string[];
  bibTeX: string;
  bibliography: (Citation | Backlink)[];
}

export interface Chapter {
  type: 'chapter';
  title: string;
  sections: Section[];
}
