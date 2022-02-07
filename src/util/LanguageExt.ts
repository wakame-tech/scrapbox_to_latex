export const extToLanguage = (ext: string): string => {
  switch (ext) {
    case 'rs':
      return 'rust';
    case 'ts':
      return 'typescript';
    case 'md':
      return 'markdown';
    case 'js':
      return 'javascript';
    case 'yml':
      return 'yaml';
    case 'json':
      return 'json';
    case 'yaml':
      return 'yaml';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    default:
      return ext;
  }
};
