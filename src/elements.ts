import {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ImageRun,
} from 'docx';
import { latexToUnicodeText, latexToNativeMath } from './latex';
import {
  ParagraphChild,
  FormatSettings,
  HeadingStyle,
  TextRunConfig,
  defaultParagraphStyle,
  defaultHeadingStyles,
} from './types';

// 获取标题级别
function getHeadingLevelValue(depth: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  switch (depth) {
    case 1: return HeadingLevel.HEADING_1;
    case 2: return HeadingLevel.HEADING_2;
    case 3: return HeadingLevel.HEADING_3;
    case 4: return HeadingLevel.HEADING_4;
    case 5: return HeadingLevel.HEADING_5;
    case 6: return HeadingLevel.HEADING_6;
    default: return HeadingLevel.HEADING_1;
  }
}

// 获取对齐方式
export function getAlignment(align: 'left' | 'center' | 'right' | 'justify'): typeof AlignmentType[keyof typeof AlignmentType] {
  switch (align) {
    case 'center': return AlignmentType.CENTER;
    case 'right': return AlignmentType.RIGHT;
    case 'justify': return AlignmentType.JUSTIFIED;
    default: return AlignmentType.LEFT;
  }
}

/**
 * 解析文本中的内联格式（公式、加粗、代码等）
 */
export async function parseTextWithFormat(
  text: string,
  formatSettings?: FormatSettings,
  baseConfig: Partial<TextRunConfig> = {}
): Promise<ParagraphChild[]> {
  const runs: ParagraphChild[] = [];
  const paraStyle = formatSettings?.paragraph || defaultParagraphStyle;

  const regex = /(\$\$(.+?)\$\$)|(\$(?!\$)(.+?)(?<!\$)\$)|(`+)([^`]+)\5|\*\*(.+?)\*\*/gs;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const normalText = text.slice(lastIndex, match.index);
      if (normalText) {
        runs.push(new TextRun({
          text: normalText,
          font: baseConfig.font || { name: paraStyle.fontFamily },
          size: baseConfig.size || paraStyle.fontSize * 2,
          bold: baseConfig.bold,
          italics: baseConfig.italics,
          color: baseConfig.color,
        }));
      }
    }

    if (match[2] !== undefined) {
      // 块级公式 $$...$$
      const mathObj = await latexToNativeMath(match[2], true);
      if (mathObj) {
        runs.push(mathObj);
      } else {
        runs.push(new TextRun({
          text: latexToUnicodeText(match[2]),
          font: { name: 'Cambria Math' },
          size: baseConfig.size || paraStyle.fontSize * 2,
          italics: true,
        }));
      }
    } else if (match[4] !== undefined) {
      // 行内公式 $...$
      const mathObj = await latexToNativeMath(match[4], false);
      if (mathObj) {
        runs.push(mathObj);
      } else {
        runs.push(new TextRun({
          text: latexToUnicodeText(match[4]),
          font: { name: 'Cambria Math' },
          size: baseConfig.size || paraStyle.fontSize * 2,
          italics: true,
        }));
      }
    } else if (match[6] !== undefined) {
      // 行内代码
      runs.push(new TextRun({
        text: match[6],
        font: { name: 'Courier New' },
        size: baseConfig.size || paraStyle.fontSize * 2,
        shading: { fill: 'F0F0F0' },
      }));
    } else if (match[7] !== undefined) {
      // 加粗
      runs.push(new TextRun({
        text: match[7],
        bold: true,
        font: baseConfig.font || { name: paraStyle.fontFamily },
        size: baseConfig.size || paraStyle.fontSize * 2,
        italics: baseConfig.italics,
        color: baseConfig.color,
      }));
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      runs.push(new TextRun({
        text: remainingText,
        font: baseConfig.font || { name: paraStyle.fontFamily },
        size: baseConfig.size || paraStyle.fontSize * 2,
        bold: baseConfig.bold,
        italics: baseConfig.italics,
        color: baseConfig.color,
      }));
    }
  }

  if (runs.length === 0) {
    runs.push(new TextRun({
      text: text,
      font: baseConfig.font || { name: paraStyle.fontFamily },
      size: baseConfig.size || paraStyle.fontSize * 2,
      bold: baseConfig.bold,
      italics: baseConfig.italics,
      color: baseConfig.color,
    }));
  }

  return runs;
}

/**
 * 解析 marked 的 inline tokens
 */
export async function parseInlineTokens(
  tokens: any[],
  baseConfig: Partial<TextRunConfig> = {},
  formatSettings?: FormatSettings
): Promise<ParagraphChild[]> {
  const runs: ParagraphChild[] = [];
  const paraStyle = formatSettings?.paragraph || defaultParagraphStyle;

  for (const token of tokens) {
    const tokenType = token.type as string;

    switch (tokenType) {
      case 'text': {
        const textContent = token.text || '';
        if (textContent) {
          runs.push(...await parseTextWithFormat(textContent, formatSettings, baseConfig));
        }
        break;
      }

      case 'strong': {
        let strongText = token.text || '';
        if (!strongText && token.tokens) {
          strongText = token.tokens.map((t: any) => t.text || t.raw || '').join('');
        }
        if (!strongText && token.raw) {
          strongText = token.raw.replace(/^\*\*|\*\*$/g, '');
        }
        runs.push(new TextRun({
          text: strongText,
          bold: true,
          font: baseConfig.font || { name: paraStyle.fontFamily },
          size: baseConfig.size || paraStyle.fontSize * 2,
          italics: baseConfig.italics,
          strike: baseConfig.strike,
          color: baseConfig.color,
        }));
        break;
      }

      case 'em': {
        let emText = token.text || '';
        if (!emText && token.tokens) {
          emText = token.tokens.map((t: any) => t.text || t.raw || '').join('');
        }
        if (!emText && token.raw) {
          emText = token.raw.replace(/^\*|\*$/g, '');
        }
        runs.push(new TextRun({
          text: emText,
          italics: true,
          font: baseConfig.font || { name: paraStyle.fontFamily },
          size: baseConfig.size || paraStyle.fontSize * 2,
          bold: baseConfig.bold,
          strike: baseConfig.strike,
          color: baseConfig.color,
        }));
        break;
      }

      case 'del': {
        let delText = token.text || '';
        if (!delText && token.tokens) {
          delText = token.tokens.map((t: any) => t.text || t.raw || '').join('');
        }
        if (!delText && token.raw) {
          delText = token.raw.replace(/^~~|~~$/g, '');
        }
        runs.push(new TextRun({
          text: delText,
          strike: true,
          font: baseConfig.font || { name: paraStyle.fontFamily },
          size: baseConfig.size || paraStyle.fontSize * 2,
          bold: baseConfig.bold,
          italics: baseConfig.italics,
          color: baseConfig.color,
        }));
        break;
      }

      case 'codespan':
        runs.push(new TextRun({
          text: token.text || '',
          font: { name: 'Courier New' },
          size: paraStyle.fontSize * 2,
          shading: { fill: 'F5F5F5' },
        }));
        break;

      case 'link': {
        let linkText = token.text || '';
        if (!linkText && token.tokens) {
          linkText = token.tokens.map((t: any) => t.text || t.raw || '').join('');
        }
        runs.push(new TextRun({
          text: linkText,
          color: '0563C1',
          underline: {},
          font: baseConfig.font || { name: paraStyle.fontFamily },
          size: baseConfig.size || paraStyle.fontSize * 2,
        }));
        break;
      }

      case 'br':
        runs.push(new TextRun({ break: 1 }));
        break;

      default: {
        const textContent = token.text || token.raw || '';
        if (textContent) {
          runs.push(...await parseTextWithFormat(textContent, formatSettings, baseConfig));
        }
      }
    }
  }

  return runs;
}

/**
 * 创建标题段落
 */
export function createHeadingParagraph(token: any, formatSettings?: FormatSettings): Paragraph {
  const depth = token.depth || 1;
  const headingKey = `heading${Math.min(depth, 4)}` as keyof FormatSettings;
  const headingStyle = (formatSettings?.[headingKey] as HeadingStyle) || defaultHeadingStyles[headingKey];

  let headingText = token.text || '';
  if (!headingText && token.tokens) {
    headingText = token.tokens.map((t: any) => t.text || t.raw || '').join('');
  }

  return new Paragraph({
    children: [new TextRun({
      text: headingText,
      bold: true,
      font: { name: headingStyle.fontFamily },
      size: headingStyle.fontSize * 2,
    })],
    alignment: getAlignment(headingStyle.alignment),
    spacing: {
      before: headingStyle.spacingBefore * 20,
      after: headingStyle.spacingAfter * 20,
      line: headingStyle.lineHeight * 240,
    },
  });
}

/**
 * 创建普通段落
 */
export async function createParagraphElement(token: any, formatSettings?: FormatSettings): Promise<Paragraph> {
  const paraStyle = formatSettings?.paragraph || defaultParagraphStyle;
  const rawText = token.raw || token.text || '';
  const runs = await parseTextWithFormat(rawText, formatSettings);

  const firstLineIndent = (paraStyle.firstLineIndent || 0) * paraStyle.fontSize * 20;

  return new Paragraph({
    children: runs,
    spacing: {
      after: (paraStyle.paragraphSpacing || 0) * 20,
      line: paraStyle.lineHeight * 240,
    },
    indent: paraStyle.firstLineIndent > 0 ? { firstLine: firstLineIndent } : undefined,
  });
}

/**
 * 创建引用块
 */
export async function createBlockquoteParagraphs(token: any, formatSettings?: FormatSettings): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = [];
  const paraStyle = formatSettings?.paragraph || defaultParagraphStyle;

  if (token.tokens) {
    for (const innerToken of token.tokens) {
      if (innerToken.type === 'paragraph') {
        const runs = innerToken.tokens
          ? await parseInlineTokens(innerToken.tokens, { color: '666666', italics: true }, formatSettings)
          : [new TextRun({
              text: innerToken.text || '',
              color: '666666',
              italics: true,
              font: { name: paraStyle.fontFamily },
              size: paraStyle.fontSize * 2,
            })];

        paragraphs.push(new Paragraph({
          children: runs,
          spacing: { before: 120, after: 120 },
          indent: { left: 720 },
          border: {
            left: { color: 'CCCCCC', space: 10, style: 'single' as const, size: 10 },
          },
        }));
      }
    }
  }

  if (paragraphs.length === 0) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({
        text: token.text || token.raw || '',
        color: '666666',
        italics: true,
      })],
      indent: { left: 720 },
      border: {
        left: { color: 'CCCCCC', space: 10, style: 'single' as const, size: 10 },
      },
    }));
  }

  return paragraphs;
}

/**
 * 创建代码块
 */
export function createCodeBlockParagraphs(token: any): Paragraph[] {
  const text = token.text || '';
  const codeLines = text.split('\n');

  return codeLines.map((line: string, index: number) =>
    new Paragraph({
      children: [new TextRun({
        text: line || ' ',
        font: { name: 'Courier New' },
        size: 20,
      })],
      spacing: {
        before: index === 0 ? 120 : 0,
        after: index === codeLines.length - 1 ? 120 : 0,
        line: 240,
      },
      shading: { fill: 'F8F8F8' },
      indent: { left: 360, right: 360 },
    })
  );
}

/**
 * 创建列表项
 */
export async function createListItemParagraphs(token: any, level: number = 0, formatSettings?: FormatSettings): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = [];
  const paraStyle = formatSettings?.paragraph || defaultParagraphStyle;
  const isOrdered = token.ordered || false;
  const bulletChars = ['•', '◦', '▪'];
  const bulletChar = isOrdered ? '' : bulletChars[level % 3];

  const items = token.items || [];
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const prefix = isOrdered ? `${idx + 1}. ` : `${bulletChar} `;

    let runs: ParagraphChild[] = [];
    if (item.tokens) {
      for (const innerToken of item.tokens) {
        if (innerToken.type === 'text' && innerToken.tokens) {
          runs = runs.concat(await parseInlineTokens(innerToken.tokens, {}, formatSettings));
        } else if (innerToken.type === 'paragraph' && innerToken.tokens) {
          runs = runs.concat(await parseInlineTokens(innerToken.tokens, {}, formatSettings));
        } else if (innerToken.text) {
          runs = runs.concat(await parseTextWithFormat(innerToken.text, formatSettings));
        }
      }
    }

    if (runs.length === 0 && item.text) {
      runs = await parseTextWithFormat(item.text, formatSettings);
    }

    runs.unshift(new TextRun({
      text: prefix,
      font: { name: paraStyle.fontFamily },
      size: paraStyle.fontSize * 2,
    }));

    paragraphs.push(new Paragraph({
      children: runs,
      spacing: { after: 60 },
      indent: { left: 720 * (level + 1), hanging: 360 },
    }));

    // 处理嵌套列表
    if (item.tokens) {
      for (const innerToken of item.tokens) {
        if (innerToken.type === 'list') {
          paragraphs.push(...await createListItemParagraphs(innerToken, level + 1, formatSettings));
        }
      }
    }
  }

  return paragraphs;
}

/**
 * 创建水平分割线
 */
export function createHorizontalRuleParagraph(): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: '' })],
    spacing: { before: 240, after: 240 },
    border: {
      bottom: { color: '999999', space: 1, style: 'single' as const, size: 6 },
    },
  });
}

/**
 * 创建表格
 */
export async function createTableElement(token: any, formatSettings?: FormatSettings): Promise<Table> {
  const paraStyle = formatSettings?.paragraph || defaultParagraphStyle;
  const rows: TableRow[] = [];

  // 表头
  if (token.header) {
    const headerCells = [];
    for (const cell of token.header) {
      const cellText = cell.text || (cell.tokens ? cell.tokens.map((t: any) => t.text || t.raw || '').join('') : '');
      const runs = await parseTextWithFormat(cellText, formatSettings, { bold: true });
      headerCells.push(new TableCell({
        children: [new Paragraph({ children: runs, alignment: AlignmentType.CENTER })],
        shading: { fill: 'F0F0F0' },
      }));
    }
    rows.push(new TableRow({ children: headerCells }));
  }

  // 表格内容
  if (token.rows) {
    for (const row of token.rows) {
      const rowCells = [];
      for (const cell of row) {
        const cellText = cell.text || (cell.tokens ? cell.tokens.map((t: any) => t.text || t.raw || '').join('') : '');
        const runs = await parseTextWithFormat(cellText, formatSettings);
        rowCells.push(new TableCell({
          children: [new Paragraph({ children: runs })],
        }));
      }
      rows.push(new TableRow({ children: rowCells }));
    }
  }

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
  });
}
