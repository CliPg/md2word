# w2w

Markdown to Word (DOCX) converter with LaTeX math support. Renders formulas as native Word equations.

## Features

- **LaTeX Math** — Renders `$...$` and `$$...$$` as native Word equations (OMML), with Unicode fallback
- **Full Markdown** — Headings, paragraphs, bold, italic, strikethrough, inline code, code blocks, blockquotes, ordered/unordered lists, tables, horizontal rules
- **Images** — Supports local paths, relative paths, and HTTP(S) URLs
- **Custom Formatting** — Configurable fonts, sizes, line heights, and heading styles
- **CLI & API** — Use from the command line or as a Node.js library

## Installation

```bash
npm install @clipg/w2w
```

## CLI

```bash
# Install globally
npm install -g @clipg/w2w

# Convert
w2w document.md
w2w input.md output.docx
```

Output defaults to the input filename with `.docx` extension.

## API

### Basic Usage

```typescript
import { convertMdToDocx } from '@clipg/w2w';
import * as fs from 'fs';

const md = fs.readFileSync('document.md', 'utf-8');
const buffer = await convertMdToDocx(md, {
  sourceFilePath: '/path/to/document.md', // for resolving relative images
});
fs.writeFileSync('document.docx', buffer);
```

### Custom Formatting

```typescript
import { convertMdToDocx } from '@clipg/w2w';

const buffer = await convertMdToDocx(md, {
  formatSettings: {
    paragraph: {
      fontFamily: 'SimSun',
      fontSize: 12,
      lineHeight: 1.5,
      paragraphSpacing: 6,
      firstLineIndent: 2,
    },
    heading1: {
      fontFamily: 'SimHei',
      fontSize: 22,
      lineHeight: 1.5,
      alignment: 'center',
      spacingBefore: 12,
      spacingAfter: 12,
    },
    heading2: {
      fontFamily: 'SimHei',
      fontSize: 16,
      lineHeight: 1.5,
      alignment: 'left',
      spacingBefore: 12,
      spacingAfter: 6,
    },
    heading3: {
      fontFamily: 'SimHei',
      fontSize: 14,
      lineHeight: 1.5,
      alignment: 'left',
      spacingBefore: 6,
      spacingAfter: 6,
    },
    heading4: {
      fontFamily: 'SimHei',
      fontSize: 12,
      lineHeight: 1.5,
      alignment: 'left',
      spacingBefore: 6,
      spacingAfter: 6,
    },
  },
});
```

### Custom Image Loader

```typescript
const buffer = await convertMdToDocx(md, {
  imageLoader: async (imagePath) => {
    // Return Buffer or null
    return null;
  },
});
```

## LaTeX Support

Inline and block math are converted to native Word equations via [latex-to-omml](https://www.npmjs.com/package/latex-to-omml). When conversion fails, the formula is rendered as Unicode text with superscripts, subscripts, and Greek letters.

```markdown
Inline: $E = mc^2$

Block:
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

## API Reference

### `ConvertOptions`

| Option | Type | Description |
|--------|------|-------------|
| `formatSettings` | `FormatSettings` | Font, size, line height, and spacing configuration |
| `sourceFilePath` | `string` | Source file path for resolving relative image paths |
| `imageLoader` | `(path: string) => Promise<Buffer \| null>` | Custom image loading function |

## Development

```bash
npm install
npm run build
```

## License

MIT
