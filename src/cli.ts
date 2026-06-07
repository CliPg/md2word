#!/usr/bin/env node

import * as fs from 'fs/promises';
import * as path from 'path';
import { convertMdToDocx } from './converter';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`用法: w2w <input.md> [output.docx]

示例:
  w2w demo.md          # 输出 demo.docx
  w2w input.md out.docx # 指定输出路径`);
    process.exit(0);
  }

  const inputPath = path.resolve(args[0]);

  // 输出路径：第二个参数或自动替换扩展名
  const outputPath = args[1]
    ? path.resolve(args[1])
    : inputPath.replace(/\.md$/i, '.docx');

  try {
    const mdContent = await fs.readFile(inputPath, 'utf-8');
    const buffer = await convertMdToDocx(mdContent, { sourceFilePath: inputPath });
    await fs.writeFile(outputPath, buffer);
    console.log(`已生成: ${outputPath} (${buffer.length} bytes)`);
  } catch (e: any) {
    console.error(`错误: ${e.message}`);
    process.exit(1);
  }
}

main();
