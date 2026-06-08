"""第二题：医学图像处理 - 灰度直方图、信息熵、压缩比"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from skimage import data

plt.rcParams['font.sans-serif'] = ['Arial Unicode MS', 'SimHei', 'STHeiti']
plt.rcParams['axes.unicode_minus'] = False

# ==================== 读取医学图像 ====================
volume = data.brain()
image = volume[5]  # 取中间切片

print(f"原始体积尺寸: {volume.shape}")
print(f"选取切片尺寸: {image.shape}")
print(f"图像数据类型: {image.dtype}")
print(f"灰度范围: [{image.min()}, {image.max()}]")

max_val = image.max()
total_pixels = image.size

# ==================== 1. 计算并绘制灰度直方图 ====================
# uint16图像，使用合适的分箱数
n_bins = 256
hist, bin_edges = np.histogram(image.flatten(), bins=n_bins, range=(0, max_val))
bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2

# 归一化为概率分布
hist_prob = hist / total_pixels

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# 原始图像
axes[0].imshow(image, cmap='gray')
axes[0].set_title('原始医学图像（脑部切片）', fontsize=14, fontweight='bold')
axes[0].axis('off')

# 灰度直方图
axes[1].bar(bin_centers, hist, width=max_val / n_bins, color='steelblue', edgecolor='none', alpha=0.8)
axes[1].set_title('灰度直方图', fontsize=14, fontweight='bold')
axes[1].set_xlabel('灰度级', fontsize=12)
axes[1].set_ylabel('像素数', fontsize=12)
axes[1].grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('histogram.png', dpi=200, bbox_inches='tight', facecolor='white')
print("已保存: histogram.png")

# ==================== 2. 计算信息熵（理论无损压缩极限） ====================
# 基于实际像素值的概率分布计算（非分箱）
unique_vals, counts = np.unique(image.flatten(), return_counts=True)
probs = counts / total_pixels
entropy = -np.sum(probs * np.log2(probs))

print(f"\n{'='*50}")
print(f"信息熵计算")
print(f"{'='*50}")
print(f"图像总像素数: {total_pixels}")
print(f"不同灰度值数: {len(unique_vals)}")
print(f"信息熵 H = {entropy:.6f} bit/像素")
print(f"理论无损压缩极限: 每像素最少需要 {entropy:.6f} bit")

# ==================== 3. 16位图像最大无损压缩比 ====================
bit_depth = 16
original_bpp = bit_depth
max_compression_ratio = original_bpp / entropy

print(f"\n{'='*50}")
print(f"16位图像最大无损压缩比")
print(f"{'='*50}")
print(f"原始位深度: {bit_depth} bit")
print(f"原始每像素比特数: {original_bpp} bit")
print(f"信息熵: {entropy:.6f} bit/像素")
print(f"最大无损压缩比: Cr = {original_bpp}/{entropy:.4f} = {max_compression_ratio:.4f}")
print(f"即压缩比约为 {max_compression_ratio:.2f}:1")

# ==================== 绘制综合结果图 ====================
fig, axes = plt.subplots(1, 3, figsize=(18, 5))

# 原始图像
axes[0].imshow(image, cmap='gray')
axes[0].set_title('原始医学图像', fontsize=14, fontweight='bold')
axes[0].axis('off')

# 灰度直方图（概率分布）
axes[1].bar(bin_centers, hist_prob, width=max_val / n_bins, color='steelblue', edgecolor='none', alpha=0.8)
axes[1].set_title('灰度概率分布', fontsize=14, fontweight='bold')
axes[1].set_xlabel('灰度级', fontsize=12)
axes[1].set_ylabel('概率 P(rk)', fontsize=12)
axes[1].grid(axis='y', alpha=0.3)

# 自信息量图
self_info = np.zeros_like(hist_prob)
non_zero_mask = hist_prob > 0
self_info[non_zero_mask] = -np.log2(hist_prob[non_zero_mask])
axes[2].bar(bin_centers, self_info, width=max_val / n_bins, color='coral', edgecolor='none', alpha=0.8)
axes[2].set_title(f'各灰度级自信息量\n熵 H = {entropy:.4f} bit/像素', fontsize=14, fontweight='bold')
axes[2].set_xlabel('灰度级', fontsize=12)
axes[2].set_ylabel('-log₂P(rk) (bit)', fontsize=12)
axes[2].grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('analysis_result.png', dpi=200, bbox_inches='tight', facecolor='white')
print("已保存: analysis_result.png")
