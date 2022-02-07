import { basename } from 'https://deno.land/std@0.117.0/path/mod.ts';
import {
  Block,
  HeaderLevel,
  InlineText,
  InlineTexts,
  Section,
} from '../model/documents.ts';
import { urlToPath } from '../scrapbox/download.ts';
import { extToLanguage } from '../util/LanguageExt.ts';
import { MapDiscriminatedUnion } from '../util/typeutil.ts';

type InlineTextKeyedMap = MapDiscriminatedUnion<InlineText, 'type'>;
const inlineTextParsers: {
  [K in keyof InlineTextKeyedMap]: (node: InlineTextKeyedMap[K]) => string;
} = {
  plainText: (plainText) => plainText.content.trim(),
  strong: (strong) => `**${strong.content}**`,
  inlineFormula: (inlineFormula) => ` $${inlineFormula.content}$ `,
  citation: (citation) => `[[${citation.key}]]`,
  backlink: (backlink) => `[[${backlink.name}]]`,
  inlineCode: (inlineCode) => `\`${inlineCode.content}\``,
  url: (url) => `[${url.label}](${url.url})`,
};

const inlineTextsEncoder = (inlineTexts: InlineTexts): string => {
  return (
    inlineTexts.texts
      // @ts-ignore
      .map((text) => inlineTextParsers[text.type](text))
      .join(' ')
      .trim()
  );
};

type BlockKeyedMap = MapDiscriminatedUnion<Block, 'type'>;
const blockParsers: {
  [K in keyof BlockKeyedMap]: (node: BlockKeyedMap[K]) => string;
} = {
  image: (image) => {
    if (!image.localPath) {
      console.warn(`image.localPath is not defined.`);
      return '';
    }
    const projectNamePrefix = '.';
    const path = `${projectNamePrefix}/res/${basename(
      urlToPath(image.localPath)
    )}`;
    return `![image](${path})\n`;
  },
  inlineTexts: (inlineTexts) => {
    return inlineTextsEncoder(inlineTexts);
  },
  enumerate: (enumerate) => {
    if (enumerate.items.length === 0) {
      return '';
    }
    const res = enumerate.items.map((item) => `- ${item}`).join('\n');
    return res + '\n';
  },
  code: (code) => {
    const ext = code.caption.split('.')[1] ?? code.caption;
    const language = extToLanguage(ext);
    return `\n\`\`\`${language}\n${code.code}\n\`\`\`\n`;
  },
  formula: (formula) => {
    return `\n$$\n${formula.formula}\n$$\n`;
  },
  header: (header) => {
    const toHeaderTag = (level: HeaderLevel): string => {
      if (level === 1) {
        return '###';
      } else if (level === 2) {
        return '##';
      }
      return '#';
    };
    const text = inlineTextsEncoder(header.content);
    const headerTag = `${toHeaderTag(header.level)} ${text.trim()}`;
    return `\n${headerTag}\n`;
  },
  scopedBlock: (scopedBlock) => {
    console.warn('scopedBlock is not supported');
    return '';
  },
};

export const encodeSection = (section: Section): string => {
  let res = '';
  for (const block of section.blocks) {
    if (
      block.type === 'header' &&
      block.content.texts[0].type === 'plainText' &&
      block.content.texts[0].content === '参考文献'
    ) {
      break;
    }
    // @ts-ignore
    res += blockParsers[block.type](block);
  }
  return res;
};
