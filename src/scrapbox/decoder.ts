import {
  Page,
  Block as SBlock,
  DecorationNode,
  Node,
  Decoration,
  parse,
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

interface ParserContext {
  title: string;
  links: Set<string>;
  bibTeX: string;
  blocks: Block[];
  isInEnumerate: boolean;
}

type SBlockKeyedMap = MapDiscriminatedUnion<SBlock, 'type'>;
const blockParsers: {
  [K in keyof SBlockKeyedMap]: (
    ctx: ParserContext,
    block: SBlockKeyedMap[K]
  ) => ParserContext;
} = {
  title: (ctx, title) => {
    ctx.title = title.text;
    return ctx;
  },
  line: (ctx, line) => {
    // indentation
    if (line.indent > 0) {
      const texts: InlineText[] = [];
      for (let node of line.nodes) {
        // TODO:
      }
      const block: Enumerate = {
        type: 'enumerate',
        level: line.indent,
        items: [],
      };
      ctx.blocks.push(block);
    }
    for (let node of line.nodes) {
      // @ts-ignore
      ctx = nodeParsers[node.type](ctx, node);
    }
    return ctx;
  },
  codeBlock: (ctx, code) => {
    const { fileName, content } = code;
    if (fileName === 'bib') {
      console.log('bib: ${content}');
      ctx.bibTeX = content.trim();
    } else {
      console.log('code: ${content}');
      ctx.blocks.push({
        type: 'code',
        caption: fileName,
        code: content,
      } as Code);
    }
    return ctx;
  },
  table: (ctx, table) => {
    console.warn('table: ${table} is not supported');
    // TODO:
    return ctx;
  },
};

type SNodeKeyedMap = MapDiscriminatedUnion<Node, 'type'>;
const nodeParsers: {
  [K in keyof SNodeKeyedMap]: (
    ctx: ParserContext,
    node: SNodeKeyedMap[K]
  ) => ParserContext;
} = {
  quote: (ctx, quote) => {
    console.warn('quote: ${quote} not supported');
    return ctx;
  },
  helpfeel: (ctx, helpfeel) => {
    console.warn('helpfeel: ${helpfeel} not supported');
    return ctx;
  },
  strongImage: (ctx, strongImage) => {
    console.warn('strongImage: ${strongImage} not supported');
    return ctx;
  },
  strongIcon: (ctx, strongIcon) => {
    console.warn('strongIcon: ${strongIcon} not supported');
    return ctx;
  },
  strong: (ctx, strong) => {
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
  formula: (ctx, formula) => {
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
  decoration: (ctx, decoration) => {
    ctx.blocks.push(decodeHeader(decoration));
    return ctx;
  },
  code: (ctx, code) => {
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
  commandLine: (ctx, commandLine) => {
    console.warn('commandLine: ${commandLine} not supported');
    return ctx;
  },
  blank: (ctx, blank) => {
    return ctx;
  },
  image: (ctx, image) => {
    ctx.blocks.push({
      type: 'image',
      caption: '',
      url: image.src,
    } as Image);
    return ctx;
  },
  link: (ctx, link) => {
    if (link.pathType === 'absolute') {
      console.warn('absolute link: ${link} not supported');
    } else if (link.pathType === 'relative') {
      if (ctx.links.has(link.href)) {
        ctx.blocks.push({
          type: 'inlineTexts',
          texts: [
            {
              type: 'backlink',
              name: link.href,
              key: toHash(link.href),
            } as Backlink,
          ],
        });
      } else {
        ctx.blocks.push({
          type: 'inlineTexts',
          texts: [
            {
              type: 'plainText',
              content: `\\url{${link.href}}`,
            },
          ],
        });
      }
    }
    return ctx;
  },
  googleMap: (ctx, googleMap) => {
    console.warn('googleMap: ${googleMap} not supported');
    return ctx;
  },
  icon: (ctx, icon) => {
    console.warn('icon: ${icon} not supported');
    return ctx;
  },
  hashTag: (ctx, hashTag) => {
    console.warn('hashTag: ${hashTag} not supported');
    return ctx;
  },
  plain: (ctx, plain) => {
    ctx.blocks.push({
      type: 'inlineTexts',
      texts: [
        {
          type: 'plainText',
          content: plain.text,
        } as PlainText,
      ],
    });
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

export const decodeSection = (dumpPage: ScrapBoxPage): Section => {
  const lines = dumpPage.lines.join('\n');
  console.log(lines);
  const page = parse(lines);
  let ctx: ParserContext = {
    links: new Set(),
    blocks: [],
    title: '',
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
    ctx = blockParsers[block.type](ctx, block);
  }

  // TODO: support scoped block

  return {
    type: 'section',
    path: '',
    title: ctx.title,
    blocks: ctx.blocks,
    backLinks: Array.from(ctx.links.values()),
    bibTeX: ctx.bibTeX,
    bibliography: [],
  };
};
