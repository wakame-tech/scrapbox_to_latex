export type ScrapBoxDump = {
  name: string;
  displayName: string;
  pages: ScrapBoxPage[];
};

export type ScrapBoxPage = {
  title: string;
  lines: string[];
  linksLc: string[];
};
