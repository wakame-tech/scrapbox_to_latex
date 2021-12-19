export const extractBibTeXKey = (bib: string): string => {
  const match = bib.match(/@\w+\{([^,]+),/);
  if (match) {
    return match[1];
  }
  return '';
};
