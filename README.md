# scrapbox_to_latex
A Scrapbox convertor that convert to latex's sections.

## usage
### scrapbox.json
```json
{
  "name": "",
  "displayName": "",
  "pages": [
    {
      "title": "",
      "id": "",
      "lines": [
        ...
      ],
      "linksLc": [
        ...
      ]
    },
    ...
```

### dump latex
```
deno run --allow-read https://pax.deno.dev/wakame-tech/scrapbox_to_latex/src/index.ts \
  <dumped scrapbox json> --ignore-titles <comma separated titles to ignore>
```

## features
- [x] Scrapbox Decoder
  - [x] plain
  - [x] formula
  - [x] code
  - [ ] table
  - [x] image(from Gyazo only)
- [x] LaTeX Endoer
  - [x] section, subsection
  - [x] hyperref
  - [ ] citation
  - [ ] part section by hashtag