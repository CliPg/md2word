import { Math as DocxMath } from 'docx';
import { DOMParser } from '@xmldom/xmldom';
// @ts-ignore - latex-to-omml 没有类型声明
import { latexToOMML } from 'latex-to-omml';

// LaTeX → Unicode 映射
const latexToUnicode: Record<string, string> = {
  // 希腊字母
  '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
  '\\epsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ',
  '\\iota': 'ι', '\\kappa': 'κ', '\\lambda': 'λ', '\\mu': 'μ',
  '\\nu': 'ν', '\\xi': 'ξ', '\\pi': 'π', '\\rho': 'ρ',
  '\\sigma': 'σ', '\\tau': 'τ', '\\upsilon': 'υ', '\\phi': 'φ',
  '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
  '\\Gamma': 'Γ', '\\Delta': 'Δ', '\\Theta': 'Θ', '\\Lambda': 'Λ',
  '\\Xi': 'Ξ', '\\Pi': 'Π', '\\Sigma': 'Σ', '\\Phi': 'Φ',
  '\\Psi': 'Ψ', '\\Omega': 'Ω',
  // 运算符
  '\\times': '×', '\\div': '÷', '\\pm': '±', '\\mp': '∓',
  '\\cdot': '·', '\\ast': '∗', '\\star': '⋆',
  '\\leq': '≤', '\\geq': '≥', '\\neq': '≠', '\\approx': '≈',
  '\\equiv': '≡', '\\sim': '∼', '\\simeq': '≃',
  '\\ll': '≪', '\\gg': '≫', '\\subset': '⊂', '\\supset': '⊃',
  '\\subseteq': '⊆', '\\supseteq': '⊇', '\\in': '∈', '\\ni': '∋',
  '\\notin': '∉', '\\cap': '∩', '\\cup': '∪',
  '\\land': '∧', '\\lor': '∨', '\\neg': '¬',
  '\\forall': '∀', '\\exists': '∃', '\\partial': '∂',
  '\\nabla': '∇', '\\infty': '∞', '\\emptyset': '∅',
  '\\sum': '∑', '\\prod': '∏', '\\int': '∫',
  '\\sqrt': '√', '\\angle': '∠', '\\perp': '⊥', '\\parallel': '∥',
  '\\triangle': '△', '\\square': '□', '\\circ': '∘',
  '\\rightarrow': '→', '\\leftarrow': '←', '\\Rightarrow': '⇒', '\\Leftarrow': '⇐',
  '\\leftrightarrow': '↔', '\\Leftrightarrow': '⇔',
  '\\uparrow': '↑', '\\downarrow': '↓',
  '\\ldots': '…', '\\cdots': '⋯', '\\vdots': '⋮', '\\ddots': '⋱',
  // 特殊符号
  '\\prime': '′', '\\degree': '°', '\\%': '%',
};

// 上标映射
const superscripts: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'n': 'ⁿ', 'i': 'ⁱ',
};

// 下标映射
const subscripts: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ',
  'i': 'ᵢ', 'j': 'ⱼ', 'n': 'ₙ', 'm': 'ₘ',
};

// 格式化矩阵内容
function formatMatrixContent(content: string, leftBracket: string, rightBracket: string): string {
  const rows = content.trim().split(/\\\\/).filter(r => r.trim());
  if (rows.length === 0) return `${leftBracket}${rightBracket}`;

  const formattedRows = rows.map(row => {
    const cols = row.split('&').map(c => c.trim());
    return cols.join('  ');
  });

  if (formattedRows.length === 1) {
    return `${leftBracket} ${formattedRows[0]} ${rightBracket}`;
  }
  return `${leftBracket} ${formattedRows.join(';  ')} ${rightBracket}`;
}

/**
 * 将 LaTeX 转换为 Unicode 文本（降级方案）
 */
export function latexToUnicodeText(latex: string): string {
  let result = latex;

  // 处理矩阵环境
  result = result.replace(/\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}/g, (_, content) => {
    return formatMatrixContent(content, '[', ']');
  });
  result = result.replace(/\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g, (_, content) => {
    return formatMatrixContent(content, '(', ')');
  });
  result = result.replace(/\\begin\{vmatrix\}([\s\S]*?)\\end\{vmatrix\}/g, (_, content) => {
    return formatMatrixContent(content, '|', '|');
  });
  result = result.replace(/\\begin\{Vmatrix\}([\s\S]*?)\\end\{Vmatrix\}/g, (_, content) => {
    return formatMatrixContent(content, '‖', '‖');
  });
  result = result.replace(/\\begin\{matrix\}([\s\S]*?)\\end\{matrix\}/g, (_, content) => {
    return formatMatrixContent(content, '', '');
  });

  // 处理 cases 环境
  result = result.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, (_, content) => {
    const rows = content.trim().split(/\\\\/).filter((r: string) => r.trim());
    return '{ ' + rows.map((r: string) => r.trim().replace(/&/g, ', ')).join('; ') + ' }';
  });

  // 处理 aligned 环境
  result = result.replace(/\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}/g, (_, content) => {
    const rows = content.trim().split(/\\\\/).filter((r: string) => r.trim());
    return rows.map((r: string) => r.trim().replace(/&/g, ' ')).join('; ');
  });

  // 处理 \left 和 \right 括号
  result = result.replace(/\\left\(/g, '(');
  result = result.replace(/\\right\)/g, ')');
  result = result.replace(/\\left\[/g, '[');
  result = result.replace(/\\right\]/g, ']');
  result = result.replace(/\\left\\\{/g, '{');
  result = result.replace(/\\right\\\}/g, '}');
  result = result.replace(/\\left\|/g, '|');
  result = result.replace(/\\right\|/g, '|');

  // 替换已知的 LaTeX 命令
  for (const [cmd, unicode] of Object.entries(latexToUnicode)) {
    result = result.replace(new RegExp(cmd.replace(/\\/g, '\\\\'), 'g'), unicode);
  }

  // 处理间距命令
  result = result.replace(/\\qquad/g, '    ');
  result = result.replace(/\\quad/g, '  ');
  result = result.replace(/\\;/g, ' ');
  result = result.replace(/\\:/g, ' ');
  result = result.replace(/\\,/g, ' ');
  result = result.replace(/\\!/g, '');

  // 处理上标
  result = result.replace(/\^{([^}]+)}/g, (_, content) => {
    return content.split('').map((c: string) => superscripts[c] || c).join('');
  });
  result = result.replace(/\^(\d)/g, (_, d) => superscripts[d] || d);

  // 处理下标
  result = result.replace(/_{([^}]+)}/g, (_, content) => {
    return content.split('').map((c: string) => subscripts[c] || c).join('');
  });
  result = result.replace(/_([a-zA-Z\d])/g, (_, c) => subscripts[c] || c);

  // 处理分数
  result = result.replace(/\\frac{([^}]+)}{([^}]+)}/g, '($1/$2)');

  // 处理平方根
  result = result.replace(/\\sqrt{([^}]+)}/g, '√($1)');

  // 移除剩余 LaTeX 命令
  result = result.replace(/\\text{([^}]+)}/g, '$1');
  result = result.replace(/\\mathrm{([^}]+)}/g, '$1');
  result = result.replace(/\\mathbf{([^}]+)}/g, '$1');
  result = result.replace(/\\begin\{[^}]+\}/g, '');
  result = result.replace(/\\end\{[^}]+\}/g, '');

  // 清理花括号
  result = result.replace(/{([^{}]+)}/g, '$1');
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

// ===== OMML 原生 Word 公式支持 =====

// DOM 节点转 docx XML 对象（使用 any 避免 @xmldom 与 DOM 类型冲突）
function domNodeToXmlObject(node: any): Record<string, any> {
  const children: any[] = [];

  const attrs: Record<string, string> = {};
  if (node.attributes && node.attributes.length > 0) {
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      attrs[attr.name] = attr.value;
    }
  }
  if (Object.keys(attrs).length > 0) {
    children.push({ _attr: attrs });
  }

  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (child.nodeType === 1) {
      children.push(domNodeToXmlObject(child));
    } else if (child.nodeType === 3) {
      const text = child.nodeValue?.trim();
      if (text) {
        children.push(text);
      }
    }
  }

  return { [node.tagName]: children.length > 0 ? children : {} };
}

// 自定义 Math 类：覆盖 prepForXml 输出原生 OMML
class OmmlMath extends DocxMath {
  private ommlData: Record<string, any>;

  constructor(ommlXml: string) {
    super({ children: [] });
    const doc = new DOMParser().parseFromString(ommlXml, 'text/xml');
    const mathElement = doc.documentElement;
    if (!mathElement) throw new Error('Failed to parse OMML XML');
    this.ommlData = domNodeToXmlObject(mathElement);
  }

  prepForXml(_context: any): Record<string, any> | undefined {
    return this.ommlData;
  }
}

/**
 * 将 LaTeX 转换为 docx 原生 Math 对象
 * @returns 原生 Math 对象，失败时返回 null
 */
export async function latexToNativeMath(latex: string, isBlock: boolean = false): Promise<DocxMath | null> {
  try {
    const ommlXml = await latexToOMML(latex, { displayMode: isBlock });
    if (ommlXml && ommlXml.includes('m:oMath')) {
      return new OmmlMath(ommlXml);
    }
    return null;
  } catch (e) {
    return null;
  }
}
