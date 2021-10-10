import { parse } from "@progfay/scrapbox-parser";
import { DocNodeDecoder, DocNode } from "../domain/model/documents";
import { ScrapBoxDump } from "../domain/model/scrapbox";

export class ScrapBoxDecoder implements DocNodeDecoder<ScrapBoxDump> {
  decode(dump: ScrapBoxDump): DocNode[] {
    return dump.pages.map((page) => {
      return {
        title: page.title,
        page: parse(page.lines.join("\n")),
        links: page.linksLc,
      };
    });
  }
}
