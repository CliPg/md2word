import * as fs from 'fs';
import { convertMdToDocx } from '../../src/index.js';

// 格式需求：
// 标题（heading1）：三号黑体（16pt）
// 题目（heading2）：五号黑体（10.5pt），深蓝色
// 解答（paragraph）：五号宋体（10.5pt），黑色
// 全文：1.5倍行间距，段前0.5行

const formatSettings = {
  paragraph: {
    fontFamily: '宋体',
    fontSize: 10.5,          // 五号
    lineHeight: 1.5,
    paragraphSpacing: 0.5,
    firstLineIndent: 0,
    color: '000000',         // 黑色
  },
  heading1: {
    fontFamily: '黑体',
    fontSize: 16,            // 三号
    lineHeight: 1.5,
    alignment: 'center',
    spacingBefore: 0.5,
    spacingAfter: 0.5,
    color: '000000',         // 黑色
  },
  heading2: {
    fontFamily: '黑体',
    fontSize: 10.5,          // 五号
    lineHeight: 1.5,
    alignment: 'left',
    spacingBefore: 0.5,
    spacingAfter: 0.5,
    color: '00008B',         // 深蓝色
  },
  heading3: {
    fontFamily: '黑体',
    fontSize: 10.5,          // 五号
    lineHeight: 1.5,
    alignment: 'left',
    spacingBefore: 0.5,
    spacingAfter: 0.5,
    color: '00008B',         // 深蓝色
  },
  heading4: {
    fontFamily: '黑体',
    fontSize: 10.5,
    lineHeight: 1.5,
    alignment: 'left',
    spacingBefore: 0.5,
    spacingAfter: 0.5,
    color: '00008B',
  },
};

const inputPath = '/Users/clipg/Projects/self-projs/work2word/packages/md2word/tests/task1/report.md';
const outputPath = '/Users/clipg/Projects/self-projs/work2word/packages/md2word/tests/task1/report.docx';

async function main() {
  const mdContent = fs.readFileSync(inputPath, 'utf-8');
  const buffer = await convertMdToDocx(mdContent, {
    formatSettings,
    sourceFilePath: inputPath,
  });
  fs.writeFileSync(outputPath, buffer);
  console.log(`已生成: ${outputPath}`);
}

main();
