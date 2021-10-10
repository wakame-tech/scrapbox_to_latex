import { scrapBoxDumpToLaTeX } from './domain/convertor'
import mathScrapBox from '../data/wakame-tech-math_20211009_191424.json'
// import labScrapBox from '../data/wakame-tech-lab_20211006_201557.json'

const ignoreTitles = ["マップ", "記号定義", "参考文献リスト"];
const latex = scrapBoxDumpToLaTeX(mathScrapBox, ignoreTitles);
console.log(latex);