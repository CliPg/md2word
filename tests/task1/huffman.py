"""第一题：霍夫曼编码计算与可视化"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

# 中文字体设置
plt.rcParams['font.sans-serif'] = ['Arial Unicode MS', 'SimHei', 'STHeiti']
plt.rcParams['axes.unicode_minus'] = False

# ==================== 数据定义 ====================
labels = ['r0=0', 'r1=1/7', 'r2=2/7', 'r3=3/7', 'r4=4/7', 'r5=5/7', 'r6=6/7', 'r7=1']
probs = [0.19, 0.25, 0.21, 0.16, 0.08, 0.06, 0.03, 0.02]

# ==================== 霍夫曼编码算法 ====================
class HuffmanNode:
    def __init__(self, label, prob, left=None, right=None):
        self.label = label
        self.prob = prob
        self.left = left
        self.right = right

def huffman_coding(symbols, probabilities):
    """构建霍夫曼树并返回编码"""
    nodes = [HuffmanNode(s, p) for s, p in zip(symbols, probabilities)]

    while len(nodes) > 1:
        nodes.sort(key=lambda x: x.prob)
        left = nodes.pop(0)
        right = nodes.pop(0)
        merged = HuffmanNode(f'({left.label},{right.label})', left.prob + right.prob, left, right)
        nodes.append(merged)

    codes = {}
    def traverse(node, code=''):
        if node.left is None and node.right is None:
            codes[node.label] = code
            return
        if node.left:
            traverse(node.left, code + '0')
        if node.right:
            traverse(node.right, code + '1')

    traverse(nodes[0])
    return nodes[0], codes

symbols = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7']
root, codes = huffman_coding(symbols, probs)

# ==================== 计算指标 ====================
# 平均码长
avg_len = sum(probs[i] * len(codes[symbols[i]]) for i in range(len(symbols)))

# 信息熵
entropy = -sum(p * np.log2(p) for p in probs if p > 0)

# 编码效率
efficiency = entropy / avg_len

# 压缩比 (假设原始为3bit编码，因为8个灰度级需要3位)
original_bits = 3  # log2(8) = 3
compression_ratio = original_bits / avg_len

# 相对冗余
relative_redundancy = 1 - efficiency

print("=" * 60)
print("霍夫曼编码结果")
print("=" * 60)
print(f"{'灰度级':<10} {'概率':<10} {'编码':<12} {'码长':<6}")
print("-" * 40)
for i, sym in enumerate(symbols):
    print(f"{labels[i]:<10} {probs[i]:<10.2f} {codes[sym]:<12} {len(codes[sym]):<6}")
print("-" * 40)
print(f"平均码长 L_avg = {avg_len:.4f} bit")
print(f"信息熵 H = {entropy:.4f} bit")
print(f"编码效率 η = {efficiency:.4f} ({efficiency*100:.2f}%)")
print(f"压缩比 C_r = {compression_ratio:.4f}")
print(f"相对冗余 R = {relative_redundancy:.4f} ({relative_redundancy*100:.2f}%)")

# ==================== 绘制霍夫曼编码表 ====================
fig, ax = plt.subplots(figsize=(10, 5))
ax.axis('off')

table_data = []
for i, sym in enumerate(symbols):
    table_data.append([labels[i], f'{probs[i]:.2f}', codes[sym], str(len(codes[sym]))])

table = ax.table(
    cellText=table_data,
    colLabels=['灰度级 rk', '概率 Pr(rk)', '霍夫曼编码', '码长'],
    cellLoc='center',
    loc='center',
    colWidths=[0.25, 0.25, 0.3, 0.15]
)
table.auto_set_font_size(False)
table.set_fontsize(12)
table.scale(1, 1.8)

# 表头样式
for j in range(4):
    table[0, j].set_facecolor('#4472C4')
    table[0, j].set_text_props(color='white', fontweight='bold')

# 交替行颜色
for i in range(1, len(table_data) + 1):
    for j in range(4):
        if i % 2 == 0:
            table[i, j].set_facecolor('#D6E4F0')

# 添加计算结果文本
result_text = (
    f'平均码长: Lavg = {avg_len:.4f} bit/符号\n'
    f'信息熵: H = {entropy:.4f} bit/符号\n'
    f'编码效率: η = H/Lavg = {efficiency:.4f} ({efficiency*100:.2f}%)\n'
    f'压缩比: Cr = {original_bits}/{avg_len:.4f} = {compression_ratio:.4f}\n'
    f'相对冗余: R = 1 - η = {relative_redundancy:.4f} ({relative_redundancy*100:.2f}%)'
)
fig.text(0.5, 0.02, result_text, ha='center', va='bottom', fontsize=11,
         bbox=dict(boxstyle='round,pad=0.5', facecolor='#FFF2CC', alpha=0.8))

plt.tight_layout()
plt.subplots_adjust(bottom=0.28)
plt.savefig('huffman_table.png', dpi=200, bbox_inches='tight', facecolor='white')
print("\n已保存: huffman_table.png")

# ==================== 绘制霍夫曼树 ====================
def get_tree_layout(node, x=0, y=0, layer=1, positions=None, edges=None):
    """获取树节点的位置和边"""
    if positions is None:
        positions = {}
    if edges is None:
        edges = []

    positions[node.label] = (x, y)

    if node.left:
        child_x = x - 2 ** (5 - layer) * 0.5
        child_y = y - 1
        edges.append(((x, y), (child_x, child_y), '0'))
        get_tree_layout(node.left, child_x, child_y, layer + 1, positions, edges)
    if node.right:
        child_x = x + 2 ** (5 - layer) * 0.5
        child_y = y - 1
        edges.append(((x, y), (child_x, child_y), '1'))
        get_tree_layout(node.right, child_x, child_y, layer + 1, positions, edges)

    return positions, edges

positions, edges = get_tree_layout(root)

fig, ax = plt.subplots(figsize=(16, 10))
ax.set_aspect('equal')
ax.axis('off')

# 绘制边和标签
for (x1, y1), (x2, y2), label in edges:
    ax.plot([x1, x2], [y1, y2], 'k-', linewidth=1.5)
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    ax.text(mx + (0.3 if label == '1' else -0.3), my + 0.15, label,
            fontsize=12, fontweight='bold', color='red',
            ha='center', va='center')

# 绘制节点
for name, (x, y) in positions.items():
    if name in symbols:
        # 叶子节点 - 查找对应的标签和编码
        idx = symbols.index(name)
        display_label = labels[idx]
        code = codes[name]
        display_text = f'{display_label}\np={probs[idx]}\n[{code}]'
        color = '#E2EFDA'
    else:
        display_text = f'{name}\np={root.prob if name == root.label else ""}'
        color = '#FCE4D6'

    circle = patches.FancyBboxPatch((x - 0.8, y - 0.45), 1.6, 0.9,
                                      boxstyle="round,pad=0.1",
                                      facecolor=color, edgecolor='black', linewidth=1.5)
    ax.add_patch(circle)
    ax.text(x, y, display_text, ha='center', va='center', fontsize=7, fontweight='bold')

ax.set_xlim(-12, 12)
ax.set_ylim(-6, 1.5)
plt.title('霍夫曼编码树', fontsize=16, fontweight='bold', pad=20)
plt.tight_layout()
plt.savefig('huffman_tree.png', dpi=200, bbox_inches='tight', facecolor='white')
print("已保存: huffman_tree.png")
