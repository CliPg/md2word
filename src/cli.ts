#!/usr/bin/env node

import * as fs from 'fs/promises';
import * as path from 'path';
import { convertMdToDocx } from './converter';
import { FormatSettings, defaultFormatSettings } from './types';

interface CliArgs {
  input: string;
  output?: string;
  formatSettings?: FormatSettings;
}

function parseColor(val: string): string {
  return val.replace(/^#/, '');
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = { input: '' };

  // 收集所有 --h* 和 --body-* 参数，按前缀分组
  const headingOverrides: Record<string, Record<string, string | number | boolean>> = {};
  let bodyOverride: Record<string, string | number | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      // 全局
      case '--line-height': {
        const val = Number(args[++i]);
        if (result.formatSettings) {
          result.formatSettings.paragraph.lineHeight = val;
          result.formatSettings.heading1.lineHeight = val;
          result.formatSettings.heading2.lineHeight = val;
          result.formatSettings.heading3.lineHeight = val;
          result.formatSettings.heading4.lineHeight = val;
        } else {
          const settings = structuredClone(defaultFormatSettings);
          settings.paragraph.lineHeight = val;
          settings.heading1.lineHeight = val;
          settings.heading2.lineHeight = val;
          settings.heading3.lineHeight = val;
          settings.heading4.lineHeight = val;
          result.formatSettings = settings;
        }
        break;
      }

      // 正文样式
      case '--body-font':
        bodyOverride.fontFamily = args[++i];
        break;
      case '--body-size':
        bodyOverride.fontSize = Number(args[++i]);
        break;
      case '--body-color':
        bodyOverride.color = parseColor(args[++i]);
        break;

      // 标题样式 (通用 --h* 匹配)
      default: {
        const hMatch = arg.match(/^--h(\d)-(font|size|color|bold|center|align|spacing-before|spacing-after)$/);
        if (hMatch) {
          const level = Math.min(Number(hMatch[1]), 4);
          const key = `heading${level}`;
          const prop = hMatch[2];

          if (!headingOverrides[key]) headingOverrides[key] = {};

          if (prop === 'bold') {
            headingOverrides[key].bold = true;
          } else if (prop === 'center') {
            headingOverrides[key].alignment = 'center';
          } else if (prop === 'align') {
            headingOverrides[key].alignment = args[++i];
          } else if (prop === 'spacing-before') {
            headingOverrides[key].spacingBefore = Number(args[++i]);
          } else if (prop === 'spacing-after') {
            headingOverrides[key].spacingAfter = Number(args[++i]);
          } else if (prop === 'font') {
            headingOverrides[key].fontFamily = args[++i];
          } else if (prop === 'size') {
            headingOverrides[key].fontSize = Number(args[++i]);
          } else if (prop === 'color') {
            headingOverrides[key].color = parseColor(args[++i]);
          }
        } else if (!arg.startsWith('-')) {
          // 位置参数：第一个是 input，第二个是 output
          if (!result.input) {
            result.input = arg;
          } else if (!result.output) {
            result.output = arg;
          }
        }
        break;
      }
    }
  }

  // 应用正文样式覆盖
  if (Object.keys(bodyOverride).length > 0) {
    if (!result.formatSettings) result.formatSettings = structuredClone(defaultFormatSettings);
    Object.assign(result.formatSettings.paragraph, bodyOverride);
  }

  // 应用标题样式覆盖
  if (Object.keys(headingOverrides).length > 0) {
    if (!result.formatSettings) result.formatSettings = structuredClone(defaultFormatSettings);
    for (const [key, overrides] of Object.entries(headingOverrides)) {
      if (result.formatSettings![key as keyof FormatSettings]) {
        Object.assign(result.formatSettings![key as keyof FormatSettings], overrides);
      }
    }
  }

  return result;
}

function printHelp() {
  console.log(`用法: w2w <input.md> [output.docx] [选项]

示例:
  w2w demo.md
  w2w input.md output.docx

正文样式:
  --body-font <字体>       正文字体 (默认: 宋体)
  --body-size <磅值>       正文字号 (默认: 12)
  --body-color <颜色>      正文颜色 (默认: 黑色, 如 #333333)

标题样式:
  --h1-font <字体>         一级标题字体
  --h1-size <磅值>         一级标题字号
  --h1-color <颜色>        一级标题颜色
  --h1-bold                一级标题加粗
  --h1-center              一级标题居中
  --h1-align <对齐>        一级标题对齐 (left/center/right/justify)
  --h1-spacing-before <值> 一级标题段前间距
  --h1-spacing-after <值>  一级标题段后间距

  --h2-font / --h2-size / --h2-color / --h2-bold / --h2-center / --h2-align ...
  --h3-font / --h3-size / --h3-color / --h3-bold / --h3-center / --h3-align ...
  --h4-font / --h4-size / --h4-color / --h4-bold / --h4-center / --h4-align ...

全局:
  --line-height <倍数>     全文行间距倍数 (默认: 1.5)

颜色格式: 支持 #RRGGBB 或直接十六进制 (如 red, 0000FF)

完整示例:
  w2w demo.md --body-font "宋体" --body-size 10.5 --body-color "#333333" \\
              --h1-font "黑体" --h1-size 16 --h1-color "#000000" \\
              --h2-font "黑体" --h2-color "#00008B" --line-height 1.5`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const { input, output, formatSettings } = parseArgs(args);

  if (!input) {
    console.error('错误: 请指定输入文件');
    process.exit(1);
  }

  const inputPath = path.resolve(input);
  const outputPath = output ? path.resolve(output) : inputPath.replace(/\.md$/i, '.docx');

  try {
    const mdContent = await fs.readFile(inputPath, 'utf-8');
    const buffer = await convertMdToDocx(mdContent, {
      formatSettings,
      sourceFilePath: inputPath,
    });
    await fs.writeFile(outputPath, buffer);
    console.log(`已生成: ${outputPath} (${buffer.length} bytes)`);
  } catch (e: any) {
    console.error(`错误: ${e.message}`);
    process.exit(1);
  }
}

main();
