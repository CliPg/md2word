---
name: md2word-formatting
description: Use when converting markdown to Word (.docx) with Chinese document formatting requirements like font sizes (三号, 五号), fonts (黑体, 宋体), colors (深蓝色, 红色), and spacing. Use when user provides a formatting table or describes document styling rules for w2w.
---

# md2word Formatting

## Overview

将用户的中文字体、字号、颜色、间距需求映射为 `@clipg/w2w` 的 `FormatSettings` 配置，然后调用 API 导出 Word。

## 中文字号对照表

| 中文名 | 磅值(pt) |
|--------|---------|
| 初号 | 42 |
| 小初 | 36 |
| 一号 | 26 |
| 小一 | 24 |
| 二号 | 22 |
| 小二 | 18 |
| 三号 | 16 |
| 小三 | 15 |
| 四号 | 14 |
| 小四 | 12 |
| 五号 | 10.5 |
| 小五 | 9 |
| 六号 | 7.5 |
| 七号 | 5.5 |
| 八号 | 5 |

## 字体映射

| 中文名 | 字体名 | 常见用途 |
|--------|--------|----------|
| 宋体 | SimSun / 宋体 | 正文 |
| 黑体 | SimHei / 黑体 | 标题 |
| 楷体 | KaiTi / 楷体 | 引言、注释 |
| 仿宋 | FangSong / 仿宋 | 公文 |
| 微软雅黑 | Microsoft YaHei | 现代文档 |
| Courier New | Courier New | 代码 |

注意：`FormatSettings` 中 `fontFamily` 直接使用中文名即可（如 `'黑体'`），docx 库会正确处理。

## 颜色映射

| 中文名 | 十六进制 |
|--------|---------|
| 黑色 | 000000 |
| 白色 | FFFFFF |
| 红色 | FF0000 |
| 深红色 | 8B0000 |
| 蓝色 | 0000FF |
| 深蓝色 | 00008B |
| 浅蓝色 | ADD8E6 |
| 绿色 | 008000 |
| 深绿色 | 006400 |
| 黄色 | FFFF00 |
| 橙色 | FFA500 |
| 紫色 | 800080 |
| 灰色 | 808080 |
| 深灰色 | A9A9A9 |
| 浅灰色 | D3D3D3 |
| 金色 | FFD700 |

## 间距换算

- **行间距**：直接填倍数（如 `1.5` 表示 1.5 倍行距）
- **段前/段后间距**：单位为"行"，填数值（如 `0.5` 表示 0.5 行）。内部会按 `值 × 20` 磅换算
- **首行缩进**：单位为"字符数"（如 `2` 表示缩进 2 个字符）

## 用户需求到 FormatSettings 的映射规则

用户通常用"标题/题目/正文/解答"等描述角色，映射到 FormatSettings 的字段：

| 用户称呼 | 对应字段 | 说明 |
|---------|---------|------|
| 总标题 / 大标题 / 文章标题 | `heading1` | `# 一级标题` |
| 二级标题 / 章 / 节标题 | `heading2` | `## 二级标题` |
| 三级标题 / 小节 / 题目 | `heading3` | `### 三级标题` |
| 四级标题 | `heading4` | `#### 四级标题` |
| 正文 / 解答 / 内容 / 答案 | `paragraph` | 普通段落 |
| 全文 / 整体 | 所有字段 | 全局默认值 |

## FormatSettings 结构

```typescript
interface FormatSettings {
  paragraph: {
    fontFamily: string;     // 字体名
    fontSize: number;       // 字号(pt)
    lineHeight: number;     // 行距倍数
    paragraphSpacing: number; // 段后间距(行)
    firstLineIndent: number;  // 首行缩进(字符数)
    color?: string;           // 文字颜色(十六进制,无#)
  };
  heading1: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    alignment: 'left' | 'center' | 'right' | 'justify';
    spacingBefore: number;  // 段前间距(行)
    spacingAfter: number;   // 段后间距(行)
    color?: string;
  };
  heading2: { /* 同 heading1 */ };
  heading3: { /* 同 heading1 */ };
  heading4: { /* 同 heading1 */ };
}
```

## 转换模板

收到用户的格式需求后，生成并执行以下脚本：

```typescript
import * as fs from 'fs';
import { convertMdToDocx } from '@clipg/w2w';

// 根据用户需求填写 formatSettings
const formatSettings = {
  paragraph: {
    fontFamily: '宋体',
    fontSize: 10.5,        // 五号
    lineHeight: 1.5,
    paragraphSpacing: 0.5,
    firstLineIndent: 2,
    color: '000000',       // 黑色
  },
  heading1: {
    fontFamily: '黑体',
    fontSize: 16,           // 三号
    lineHeight: 1.5,
    alignment: 'center',
    spacingBefore: 0.5,
    spacingAfter: 0.5,
    color: '000000',
  },
  heading2: {
    fontFamily: '黑体',
    fontSize: 10.5,         // 五号
    lineHeight: 1.5,
    alignment: 'left',
    spacingBefore: 0.5,
    spacingAfter: 0.5,
    color: '00008B',        // 深蓝色
  },
  heading3: {
    fontFamily: '黑体',
    fontSize: 10.5,
    lineHeight: 1.5,
    alignment: 'left',
    spacingBefore: 0.5,
    spacingAfter: 0.5,
    color: '00008B',
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

const inputPath = 'INPUT.md';
const outputPath = 'OUTPUT.docx';
const mdContent = fs.readFileSync(inputPath, 'utf-8');
const buffer = await convertMdToDocx(mdContent, {
  formatSettings,
  sourceFilePath: inputPath,
});
fs.writeFileSync(outputPath, buffer);
console.log(`已生成: ${outputPath}`);
```

## 常见文档格式预设

### 课程作业
用户示例：`标题｜三号黑体，题目｜五号黑体深蓝色，解答｜五号宋体黑色，全文｜1.5倍行间距`

→ heading1: 黑体 16pt 居中，heading2-4: 黑体 10.5pt 深蓝色左对齐，paragraph: 宋体 10.5pt 黑色，行距 1.5 倍。

### 学位论文
heading1: 黑体 16pt 居中，heading2: 黑体 14pt 左对齐，heading3: 黑体 13pt 左对齐，paragraph: 宋体 12pt 首行缩进 2 字符，行距 1.5 倍。

## 执行步骤

1. 解析用户的格式需求表或自然语言描述
2. 将中文字号转为 pt 值，字体名转为字体标识，颜色转为十六进制
3. 根据"用户称呼 → FormatSettings 字段"映射表，构建 `formatSettings` 对象
4. 用户未指定的字段使用合理默认值（黑体 16pt 居中用于标题，宋体 12pt 用于正文）
5. 用 `npx tsx` 运行转换脚本
6. 告知用户生成的 docx 文件路径
