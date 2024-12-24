import pkg from 'canvas';
const { createCanvas } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 工具函数：绘制圆角矩形
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// 工具函数：绘制代码文本
function drawCode(ctx, code, x, y, color = '#d4d4d4') {
    ctx.fillStyle = color;
    ctx.fillText(code, x, y);
}

// 工具函数：绘制 AI 建议框
function drawSuggestionBox(ctx, x, y, width, height) {
    ctx.fillStyle = '#2d2d2d';
    roundRect(ctx, x, y, width, height, 8);
    ctx.fill();
    ctx.strokeStyle = '#4CAF50';
    roundRect(ctx, x, y, width, height, 8);
    ctx.stroke();
}

// 生成函数补全示例图片
function generateFunctionCompletion() {
    const canvas = createCanvas(800, 500);
    const ctx = canvas.getContext('2d');

    // 设置背景
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, 800, 500);

    // 设置字体
    ctx.font = '14px "Fira Code"';

    // 绘制原始代码
    drawCode(ctx, 'function calculateDiscount(price) {', 20, 40);
    drawCode(ctx, '    |', 20, 70); // 光标位置

    // 绘制 AI 建议框
    drawSuggestionBox(ctx, 20, 90, 600, 280);

    // 绘制建议标题
    ctx.fillStyle = '#4CAF50';
    ctx.fillText('💡 AI 建议：根据价格计算折扣', 40, 120);

    // 绘制建议代码
    const suggestions = [
        'function calculateDiscount(price) {',
        '    // 根据价格区间计算折扣',
        '    if (price >= 1000) {',
        '        return price * 0.8;  // 8折',
        '    } else if (price >= 500) {',
        '        return price * 0.9;  // 9折',
        '    }',
        '    return price;  // 原价',
        '}'
    ];

    suggestions.forEach((line, index) => {
        drawCode(ctx, line, 40, 150 + index * 22);
    });

    // 绘制快捷键提示
    ctx.fillStyle = '#6A9955';
    ctx.fillText('📝 按 Tab 接受建议', 40, 400);
    ctx.fillText('⌨️ 按 Esc 取消', 40, 430);
    ctx.fillText('🔄 继续按 Tab 查看其他建议', 40, 460);

    // 保存图片
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(
        path.join(__dirname, '../src/assets/images/function-completion.png'),
        buffer
    );
}

// 生成组件补全示例图片
function generateComponentCompletion() {
    const canvas = createCanvas(800, 500);
    const ctx = canvas.getContext('2d');

    // 设置背景
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, 800, 500);

    // 设置字体
    ctx.font = '14px "Fira Code"';

    // 绘制原始代码
    drawCode(ctx, '<template>', 20, 40);
    drawCode(ctx, '  <div class="product-card">', 20, 70);
    drawCode(ctx, '    |', 20, 100); // 光标位置

    // 绘制 AI 建议框
    drawSuggestionBox(ctx, 20, 120, 600, 300);

    // 绘制建议标题
    ctx.fillStyle = '#4CAF50';
    ctx.fillText('💡 AI 建议：生成商品卡片组件', 40, 150);

    // 绘制建议代码
    const suggestions = [
        '<template>',
        '  <div class="product-card">',
        '    <img :src="product.image"',
        '         :alt="product.name"',
        '         class="product-image" />',
        '    <div class="product-info">',
        '      <h3>{{ product.name }}</h3>',
        '      <p>{{ formatPrice(product.price) }}</p>',
        '      <el-button @click="addToCart">',
        '        加入购物车',
        '      </el-button>',
        '    </div>',
        '  </div>',
        '</template>'
    ];

    suggestions.forEach((line, index) => {
        drawCode(ctx, line, 40, 180 + index * 22);
    });

    // 绘制提示
    ctx.fillStyle = '#6A9955';
    ctx.fillText('✨ 检测到 Element Plus 环境，自动引入相关组件', 40, 460);

    // 保存图片
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(
        path.join(__dirname, '../src/assets/images/component-completion.png'),
        buffer
    );
}

// 生成代码重构示例图片
function generateRefactorCompletion() {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    // 设置背景
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, 800, 600);

    // 设置字体
    ctx.font = '14px "Fira Code"';

    // 绘制原始代码标题
    ctx.fillStyle = '#6A9955';
    ctx.fillText('// 原始代码', 20, 30);

    // 绘制原始代码
    const originalCode = [
        'const processOrders = orders.filter(order => {',
        '  return order.status === "pending";',
        '}).map(order => {',
        '  return {',
        '    id: order.id,',
        '    total: order.items.reduce((sum, item) =>',
        '      sum + item.price, 0',
        '    )',
        '  };',
        '});'
    ];

    originalCode.forEach((line, index) => {
        drawCode(ctx, line, 20, 60 + index * 22);
    });

    // 绘制 AI 建议框
    drawSuggestionBox(ctx, 20, 280, 600, 280);

    // 绘制建议标题
    ctx.fillStyle = '#4CAF50';
    ctx.fillText('💡 AI 建议：优化代码结构和可读性', 40, 310);

    // 绘制优化后的代码
    const optimizedCode = [
        'const processOrders = orders',
        '  .filter(({ status }) => status === "pending")',
        '  .map(({ id, items }) => ({',
        '    id,',
        '    total: items.reduce(',
        '      (sum, { price }) => sum + price,',
        '      0',
        '    )',
        '  }));'
    ];

    optimizedCode.forEach((line, index) => {
        drawCode(ctx, line, 40, 340 + index * 22);
    });

    // 绘制改进说明
    ctx.fillStyle = '#6A9955';
    ctx.fillText('✨ 使用解构赋值提高代码可读性', 40, 520);
    ctx.fillText('✨ 优化数组方法链的格式', 40, 550);
    ctx.fillText('✨ 简化 reduce 函数的实现', 40, 580);

    // 保存图片
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(
        path.join(__dirname, '../src/assets/images/refactor-completion.png'),
        buffer
    );
}

// 创建目录
const imagesDir = path.join(__dirname, '../src/assets/images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// 生成所有图片
generateFunctionCompletion();
generateComponentCompletion();
generateRefactorCompletion();

console.log('图片生成完成！'); 