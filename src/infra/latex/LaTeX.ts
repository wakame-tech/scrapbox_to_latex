// TODO: generalize section level
export type LaTeXSection = {
  title: string;
  subSections: LaTeXSubSection[];
};

export type LaTeXSubSection = {
  title: string;
  subsubSections: LaTeXSubSubSection[];
};

export type LaTeXSubSubSection = {
  title: string;
  content: string;
};
