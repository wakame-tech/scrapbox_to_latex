import { parse } from "@progfay/scrapbox-parser";
import { DocNodeDecoder, DocNode } from "../domain/model/documents";
import { ScrapBoxPage } from "../domain/model/scrapbox";

export class ScrapBoxDecoder implements DocNodeDecoder<ScrapBoxPage> {
  decode(page: ScrapBoxPage): DocNode {
    return {
      title: page.title,
      page: parse(page.lines.join("\n")),
      links: page.linksLc,
    };
  }
}
