import * as fs from 'fs/promises';
import * as path from 'path';
import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType } from 'docx';
import { marked } from 'marked';
import { ConvertOptions, FormatSettings } from './types';
import {
  parseInlineTokens,
  parseTextWithFormat,
  parseHtmlFontTags,
  createHeadingParagraph,
  createParagraphElement,
  createBlockquoteParagraphs,
  createCodeBlockParagraphs,
  createListItemParagraphs,
  createHorizontalRuleParagraph,
  createTableElement,
} from './elements';

/**
 * 收集 Markdown tokens 中的图片路径
 */
function collectImagePaths(token: any, imageMap: Map<string, Buffer>) {
  if (token.type === 'image') {
    const imagePath = token.href || '';
    if (imagePath) {
      imageMap.set(imagePath, Buffer.alloc(0));
    }
  }
  if (token.tokens) {
    for (const childToken of token.tokens) {
      collectImagePaths(childToken, imageMap);
    }
  }
  if (token.items) {
    for (const item of token.items) {
      if (item.tokens) {
        for (const childToken of item.tokens) {
          collectImagePaths(childToken, imageMap);
        }
      }
    }
  }
}

/**
 * 加载图片 Buffer（纯 Node.js，无 Electron 依赖）
 */
async function loadImageBuffer(
  imagePath: string,
  sourceFilePath?: string,
  customLoader?: (imagePath: string) => Promise<Buffer | null>
): Promise<Buffer | null> {
  // 优先使用自定义加载器
  if (customLoader) {
    const result = await customLoader(imagePath);
    if (result) return result;
  }

  // HTTP/HTTPS URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    try {
      const response = await fetch(imagePath);
      if (response.ok) {
        return Buffer.from(await response.arrayBuffer());
      }
    } catch {
      // 下载失败
    }
    return null;
  }

  // 绝对路径
  if (path.isAbsolute(imagePath)) {
    return fs.readFile(imagePath);
  }

  // 相对路径：基于源文件目录解析
  if (sourceFilePath) {
    const sourceDir = path.dirname(sourceFilePath);
    const fullImagePath = path.resolve(sourceDir, imagePath);
    try {
      return await fs.readFile(fullImagePath);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * 将 Markdown 转换为 Word 段落数组
 */
export async function markdownToParagraphs(
  mdContent: string,
  formatSettings?: FormatSettings,
  sourceFilePath?: string,
  imageLoader?: (imagePath: string) => Promise<Buffer | null>
): Promise<(Paragraph | import('docx').Table)[]> {
  const elements: (Paragraph | import('docx').Table)[] = [];
  const imageMap = new Map<string, Buffer>();

  const tokens = marked.lexer(mdContent);

  // 收集图片路径
  for (const token of tokens) {
    collectImagePaths(token, imageMap);
  }

  // 预加载图片
  const imageBuffers = new Map<string, Buffer>();
  for (const imagePath of imageMap.keys()) {
    const buffer = await loadImageBuffer(imagePath, sourceFilePath, imageLoader);
    if (buffer) {
      imageBuffers.set(imagePath, buffer);
    }
  }

  for (const token of tokens) {
    try {
      switch (token.type) {
        case 'heading':
          elements.push(await createHeadingParagraph(token, formatSettings));
          break;

        case 'paragraph': {
          const tokenAny = token as any;
          if (tokenAny.tokens) {
            const hasImage = tokenAny.tokens.some((t: any) => t.type === 'image');
            if (hasImage) {
              for (const innerToken of tokenAny.tokens) {
                if (innerToken.type === 'image') {
                  const imagePath = innerToken.href || '';
                  const imageBuffer = imageBuffers.get(imagePath);
                  const altText = innerToken.text || innerToken.alt || '图片';

                  if (imageBuffer) {
                    try {
                      elements.push(new Paragraph({
                        children: [new ImageRun({
                          data: imageBuffer,
                          transformation: { width: 400, height: 300 },
                        })],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 200 },
                      }));
                    } catch {
                      elements.push(new Paragraph({
                        children: [new TextRun({
                          text: `[图片: ${altText}]`,
                          color: '999999',
                          italics: true,
                        })],
                      }));
                    }
                  } else {
                    elements.push(new Paragraph({
                      children: [new TextRun({
                        text: `[图片: ${altText}](${imagePath})`,
                        color: '999999',
                        italics: true,
                      })],
                    }));
                  }
                } else if (innerToken.type === 'text' && innerToken.text?.trim()) {
                  elements.push(await createParagraphElement({ raw: innerToken.text, text: innerToken.text }, formatSettings));
                }
              }
              break;
            }
          }
          elements.push(await createParagraphElement(token, formatSettings));
          break;
        }

        case 'blockquote':
          elements.push(...await createBlockquoteParagraphs(token, formatSettings));
          break;

        case 'code':
          elements.push(...createCodeBlockParagraphs(token));
          break;

        case 'list':
          elements.push(...await createListItemParagraphs(token, 0, formatSettings));
          break;

        case 'table':
          elements.push(await createTableElement(token, formatSettings));
          break;

        case 'hr':
          elements.push(createHorizontalRuleParagraph());
          break;

        case 'image': {
          const imageToken = token as any;
          const imagePath = imageToken.href || '';
          const imageBuffer = imageBuffers.get(imagePath);
          const altText = imageToken.text || imageToken.alt || '图片';

          if (imageBuffer) {
            try {
              elements.push(new Paragraph({
                children: [new ImageRun({
                  data: imageBuffer,
                  transformation: { width: 400, height: 300 },
                })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 200 },
              }));
            } catch {
              elements.push(new Paragraph({
                children: [new TextRun({
                  text: `[图片: ${altText}]`,
                  color: '999999',
                  italics: true,
                })],
              }));
            }
          } else {
            elements.push(new Paragraph({
              children: [new TextRun({
                text: `[图片: ${altText}](${imagePath})`,
                color: '999999',
                italics: true,
              })],
            }));
          }
          break;
        }

        case 'space':
          elements.push(new Paragraph({ text: '' }));
          break;

        case 'html': {
          const htmlText = (token as any).text;
          const paraStyle = formatSettings?.paragraph;
          if (htmlText?.trim()) {
            const baseConfig = {
              font: { name: paraStyle?.fontFamily || '宋体' },
              size: (paraStyle?.fontSize || 12) * 2,
            };
            // 尝试解析 font/span 颜色标签
            const fontRuns = parseHtmlFontTags(htmlText, baseConfig, formatSettings);
            if (fontRuns.length > 0) {
              elements.push(new Paragraph({ children: fontRuns }));
            } else {
              elements.push(new Paragraph({
                children: [new TextRun({
                  text: htmlText.replace(/<[^>]*>/g, ''),
                  ...baseConfig,
                })],
              }));
            }
          }
          break;
        }

        default: {
          const text = (token as any).text;
          const defaultParaStyle = formatSettings?.paragraph;
          if (text) {
            elements.push(new Paragraph({
              children: [new TextRun({
                text: text,
                font: { name: defaultParaStyle?.fontFamily || '宋体' },
                size: (defaultParaStyle?.fontSize || 12) * 2,
              })],
            }));
          }
        }
      }
    } catch (error) {
      const tokenText = (token as any).text || (token as any).raw;
      const fallbackStyle = formatSettings?.paragraph;
      if (tokenText) {
        elements.push(new Paragraph({
          children: [new TextRun({
            text: tokenText,
            font: { name: fallbackStyle?.fontFamily || '宋体' },
            size: (fallbackStyle?.fontSize || 12) * 2,
          })],
        }));
      }
    }
  }

  return elements;
}

/**
 * 将 Markdown 内容转换为 DOCX Buffer
 */
export async function convertMdToDocx(
  mdContent: string,
  options?: ConvertOptions
): Promise<Buffer> {
  const elements = await markdownToParagraphs(
    mdContent,
    options?.formatSettings,
    options?.sourceFilePath,
    options?.imageLoader
  );

  const doc = new Document({
    sections: [{ properties: {}, children: elements }],
  });

  return Packer.toBuffer(doc);
}
