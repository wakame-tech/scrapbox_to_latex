# scrapbox_to_latex
A Scrapbox convertor that convert to latex files.

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
  <dumped scrapbox json>
```

## features
- [x] Scrapbox Decoder
  - [x] plain
  - [x] formula
  - [x] code
  - [ ] table
  - [x] image(in private project, Gyazo only)
- [x] LaTeX Endoer
  - [x] section, subsection
  - [x] hyperref
  -[x] citation
  - [x] `index.tex`
  - [x] `refs.bib`