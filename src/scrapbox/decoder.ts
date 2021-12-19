import {
  Page,
  Block as SBlock,
  DecorationNode,
  Node,
  Decoration,
  parse,
  LinkNode,
} from '../mod.ts';
import {
  Section,
  Block,
  InlineTexts,
  Enumerate,
  Code,
  Formula,
  Header,
  Image,
  Backlink,
  PlainText,
  InlineText,
  HeaderLevel,
} from '../model/documents.ts';
import { MapDiscriminatedUnion } from '../util/typeutil.ts';
import { toHash } from '../util/Hash.ts';
import { ScrapBoxPage } from './types.ts';
import { downloadImage } from './download.ts';
import { extractBibTeXKey } from '../util/BibTeX.ts';

interface ParserContext {
  dir: string;
  title: string;
  links: Set<string>;
  bibKey: string;
  bibTeX: string;
  blocks: Block[];
  isInEnumerate: boolean;
}

type SBlockKeyedMap = MapDiscriminatedUnion<SBlock, 'type'>;
const blockParsers: {
  [K in keyof SBlockKeyedMap]: (
    ctx: ParserContext,
    block: SBlockKeyedMap[K]
  ) => Promise<ParserContext>;
} = {
  title: async (ctx, title) => {
    ctx.title = title.text;
    return ctx;
  },
  line: async (ctx, line) => {
    // TODO: support enumerate
    for (let node of line.nodes) {
      // @ts-ignore
      ctx = await nodeParsers[node.type](ctx, node);
    }
    if (line.indent !== 0) {
      ctx.blocks.push({
        type: 'inlineTexts',
        texts: [
          {
            type: 'plainText',
            content: '\\\\ \n',
          },
        ],
      });
    }
    return ctx;
  },
  codeBlock: async (ctx, code) => {
    const { fileName, content } = code;
    if (fileName === 'bib') {
      const key = extractBibTeXKey(content);
      if (key) {
        ctx.bibKey = key;
        ctx.bibTeX = content.trim();
        console.log(`bib: ${ctx.bibKey} found`);
      }
    } else {
      // console.log('code: ${content}');
      ctx.blocks.push({
        type: 'code',
        caption: fileName,
        code: content,
      } as Code);
    }
    return ctx;
  },
  table: async (ctx, table) => {
    console.warn('table: ${table} is not supported');
    // TODO:
    return ctx;
  },
};

const decodeLink = (ctx: ParserContext, link: LinkNode): ParserContext => {
  // URL
  if (link.pathType === 'absolute') {
    ctx.blocks.push({
      type: 'inlineTexts',
      texts: [
        {
          type: 'plainText',
          content:
            link.pathType === 'absolute'
              ? `\\url{${link.href}}`
              : `\\texttt{${link.content}}`,
        },
      ],
    });
  } else if (link.pathType === 'relative' && ctx.links.has(link.href)) {
    // Backlink
    console.log(`backlink: ${link.href} found`);
    ctx.blocks.push({
      type: 'inlineTexts',
      texts: [
        {
          type: 'backlink',
          name: link.content,
          key: toHash(link.href),
        } as Backlink,
      ],
    });
  } else {
    console.warn(`backlink: ${link.href} not found`);
    ctx.blocks.push({
      type: 'inlineTexts',
      texts: [
        {
          type: 'plainText',
          content: `\\texttt{${link.href}}`,
        },
      ],
    });
  }
  return ctx;
};

type SNodeKeyedMap = MapDiscriminatedUnion<Node, 'type'>;
const nodeParsers: {
  [K in keyof SNodeKeyedMap]: (
    ctx: ParserContext,
    node: SNodeKeyedMap[K]
  ) => Promise<ParserContext>;
} = {
  quote: async (ctx, quote) => {
    ctx.blocks.push({
      type: 'inlineTexts',
      texts: [
        {
          type: 'plainText',
          content: quote.nodes[0].raw,
        },
      ],
    });
    return ctx;
  },
  helpfeel: async (ctx, helpfeel) => {
    console.warn('helpfeel: ${helpfeel} not supported');
    return ctx;
  },
  strongImage: async (ctx, strongImage) => {
    console.warn('strongImage: ${strongImage} not supported');
    return ctx;
  },
  strongIcon: async (ctx, strongIcon) => {
    console.warn('strongIcon: ${strongIcon} not supported');
    return ctx;
  },
  strong: async (ctx, strong) => {
    ctx.blocks.push({
      type: 'inlineTexts',
      texts: [
        {
          type: 'strong',
          content: strong.nodes[0].raw,
        },
      ],
    });
    return ctx;
  },
  formula: async (ctx, formula) => {
    const content = formula.formula
      .replace(/(?:\{\})?\^\\exists?/g, '{}^{\\exists}')
      .replace(/(?:\{\})?\^\\forall/g, '{}^{\\forall}');

    if (content.length > 30) {
      ctx.blocks.push({
        type: 'formula',
        formula: content,
      });
    } else {
      ctx.blocks.push({
        type: 'inlineTexts',
        texts: [
          {
            type: 'inlineFormula',
            content,
          },
        ],
      });
    }
    return ctx;
  },
  decoration: async (ctx, decoration) => {
    ctx.blocks.push(decodeHeader(decoration));
    return ctx;
  },
  code: async (ctx, code) => {
    ctx.blocks.push({
      type: 'inlineTexts',
      texts: [
        {
          type: 'inlineCode',
          content: code.text,
        },
      ],
    });
    return ctx;
  },
  commandLine: async (ctx, commandLine) => {
    console.warn('commandLine: ${commandLine} not supported');
    return ctx;
  },
  blank: async (ctx, blank) => {
    return ctx;
  },
  image: async (ctx, image) => {
    console.log(`image: ${image.src} found`);
    const localPath = await downloadImage(`${ctx.dir}/res`, image.src);
    ctx.blocks.push({
      type: 'image',
      caption: '',
      url: image.src,
      localPath,
    } as Image);
    return ctx;
  },
  link: async (ctx, link) => {
    return decodeLink(ctx, link);
  },
  googleMap: async (ctx, googleMap) => {
    console.warn('googleMap: ${googleMap} not supported');
    return ctx;
  },
  icon: async (ctx, icon) => {
    console.warn('icon: ${icon} not supported');
    return ctx;
  },
  hashTag: async (ctx, hashTag) => {
    console.warn(`hashTag: ${hashTag.href} not supported`);
    return ctx;
  },
  plain: async (ctx, plain) => {
    const match = plain.text.match(/\\\\cite\{(.*?)\}/);
    if (match) {
      console.log(`citation: ${match[1]} found`);
      ctx.blocks.push({
        type: 'inlineTexts',
        texts: [
          {
            type: 'citation',
            key: match[1],
          },
        ],
      });
    } else {
      ctx.blocks.push({
        type: 'inlineTexts',
        texts: [
          {
            type: 'plainText',
            content: plain.text,
          },
        ],
      });
    }
    return ctx;
  },
};

const decodeHeader = (node: DecorationNode): Header => {
  const toHeaderLevel = (deco: Decoration): HeaderLevel => {
    if (deco === '*-1') {
      return 1;
    } else if (deco === '*-2') {
      return 2;
    }
    return 3;
  };

  const content = node.nodes[0].raw.trim();
  const texts: InlineTexts = {
    type: 'inlineTexts',
    texts: [
      {
        type: 'plainText',
        content,
      },
    ],
  };
  const key = toHash(content);

  return {
    type: 'header',
    level: toHeaderLevel(node.decos[0]),
    content: texts,
    key,
  };
};

export const decodeSection = async (
  dir: string,
  links: string[],
  dumpPage: ScrapBoxPage
): Promise<Section> => {
  const lines = dumpPage.lines.join('\n');
  const page = parse(lines);
  let ctx: ParserContext = {
    dir,
    links: new Set(links),
    blocks: [],
    title: '',
    bibKey: '',
    bibTeX: '',
    isInEnumerate: false,
  };

  ctx.blocks.push({
    type: 'header',
    level: 3,
    content: {
      type: 'inlineTexts',
      texts: [
        {
          type: 'plainText',
          content: dumpPage.title,
        },
      ],
    },
    key: toHash(dumpPage.title),
  });

  for (let block of page) {
    // @ts-ignore
    ctx = await blockParsers[block.type](ctx, block);
  }

  // TODO: support scoped block

  return {
    type: 'section',
    title: ctx.title,
    blocks: ctx.blocks,
    backLinks: Array.from(dumpPage.linksLc),
    bibKey: ctx.bibKey,
    bibTeX: ctx.bibTeX,
    bibliography: [],
  };
};
