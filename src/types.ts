import { TextRun, Math as DocxMath } from 'docx';

// 段落子元素类型
export type ParagraphChild = TextRun | DocxMath;

// 段落样式
export interface ParagraphStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  firstLineIndent: number;
  color?: string;
}

// 标题样式
export interface HeadingStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  alignment: 'left' | 'center' | 'right' | 'justify';
  spacingBefore: number;
  spacingAfter: number;
  color?: string;
  bold?: boolean;
}

// 排版设置
export interface FormatSettings {
  paragraph: ParagraphStyle;
  heading1: HeadingStyle;
  heading2: HeadingStyle;
  heading3: HeadingStyle;
  heading4: HeadingStyle;
}

// TextRun 配置
export interface TextRunConfig {
  text?: string;
  bold?: boolean;
  italics?: boolean;
  strike?: boolean;
  color?: string;
  underline?: Record<string, unknown>;
  font?: { name: string };
  size?: number;
  shading?: { fill: string };
  break?: number;
}

// 转换选项
export interface ConvertOptions {
  formatSettings?: FormatSettings;
  /** 源文件路径，用于解析相对路径图片 */
  sourceFilePath?: string;
  /** 自定义图片加载器，返回图片 Buffer 或 null */
  imageLoader?: (imagePath: string) => Promise<Buffer | null>;
}

// 默认段落样式
export const defaultParagraphStyle: ParagraphStyle = {
  fontSize: 12,
  fontFamily: '宋体',
  lineHeight: 1.5,
  paragraphSpacing: 6,
  firstLineIndent: 2,
};

// 默认标题样式
export const defaultHeadingStyles: Record<string, HeadingStyle> = {
  heading1: { fontFamily: '黑体', fontSize: 22, lineHeight: 1.5, alignment: 'center', spacingBefore: 12, spacingAfter: 12 },
  heading2: { fontFamily: '黑体', fontSize: 16, lineHeight: 1.5, alignment: 'left', spacingBefore: 12, spacingAfter: 6 },
  heading3: { fontFamily: '黑体', fontSize: 14, lineHeight: 1.5, alignment: 'left', spacingBefore: 6, spacingAfter: 6 },
  heading4: { fontFamily: '黑体', fontSize: 12, lineHeight: 1.5, alignment: 'left', spacingBefore: 6, spacingAfter: 6 },
};

// 默认排版设置
export const defaultFormatSettings: FormatSettings = {
  paragraph: {
    fontFamily: '宋体',
    fontSize: 12,
    lineHeight: 1.5,
    paragraphSpacing: 6,
    firstLineIndent: 2,
  },
  heading1: {
    fontFamily: '黑体',
    fontSize: 22,
    lineHeight: 1.5,
    alignment: 'center',
    spacingBefore: 12,
    spacingAfter: 6,
  },
  heading2: {
    fontFamily: '黑体',
    fontSize: 16,
    lineHeight: 1.5,
    alignment: 'left',
    spacingBefore: 12,
    spacingAfter: 6,
  },
  heading3: {
    fontFamily: '黑体',
    fontSize: 14,
    lineHeight: 1.5,
    alignment: 'left',
    spacingBefore: 12,
    spacingAfter: 6,
  },
  heading4: {
    fontFamily: '黑体',
    fontSize: 12,
    lineHeight: 1.5,
    alignment: 'left',
    spacingBefore: 12,
    spacingAfter: 6,
  },
};
