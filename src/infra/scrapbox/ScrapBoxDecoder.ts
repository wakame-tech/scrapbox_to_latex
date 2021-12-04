import { parse } from '../../mod.ts'
import { DocNode, DocNodeDecoder } from '../../domain/model/documents.ts';
import { ScrapBoxDump } from '../../domain/model/scrapbox.ts';

export class ScrapBoxDecoder implements DocNodeDecoder<ScrapBoxDump> {
  decode(dump: ScrapBoxDump): DocNode[] {
    return dump.pages.map((page) => {
      return {
        title: page.title,
        page: parse(page.lines.join('\n')),
        links: page.linksLc,
      };
    });
  }
}
