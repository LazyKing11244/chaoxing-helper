import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, 'src');
const OUTPUT_FILE = path.join(__dirname, 'chaoxing-helper.user.js');

// 按照依赖加载顺序排列的模块列表
const MODULES = [
    'core/context.js',
    'utils/helpers.js',
    'utils/crypto.js',
    'core/env.js',
    'core/config.js',
    'core/logger.js',
    'ui/template.js',
    'ui/panel.js',
    'tiku/search.js',
    'matcher/index.js',
    'pages/cards.js',
    'pages/studentstudy.js',
    'pages/homework.js',
    'pages/misc.js',
    'main.js'
];

function build() {
    console.log('[Build] 开始构建超星学习通小助手...');
    const startTime = Date.now();

    // 1. 读取元数据头
    const metaPath = path.join(SRC_DIR, 'meta.js');
    if (!fs.existsSync(metaPath)) {
        console.error(`[Error] 找不到元数据文件: ${metaPath}`);
        process.exit(1);
    }
    const metaContent = fs.readFileSync(metaPath, 'utf-8').trim();

    // 2. 依次读取各个子模块并拼装
    const moduleContents = [];
    for (const mod of MODULES) {
        const modPath = path.join(SRC_DIR, mod);
        if (!fs.existsSync(modPath)) {
            console.error(`[Error] 找不到模块文件: ${modPath}`);
            process.exit(1);
        }
        const content = fs.readFileSync(modPath, 'utf-8');
        moduleContents.push(`    // ==================== 模块: ${mod} ====================\n${content}\n`);
    }

    // 3. 拼装为完整的 IIFE 油猴单文件
    const bundleContent = `${metaContent}\n(() => {\n${moduleContents.join('\n')}\n})();\n`;

    // 4. 写入输出文件
    fs.writeFileSync(OUTPUT_FILE, bundleContent, 'utf-8');
    const elapsed = Date.now() - startTime;
    console.log(`[Build] 构建成功！输出至: ${OUTPUT_FILE} (耗时: ${elapsed}ms)`);

    // 5. 自动执行语法检查
    try {
        execSync(`node --check "${OUTPUT_FILE}"`);
        console.log('[Verify] 语法检查通过: node --check OK');
    } catch (err) {
        console.error('[Verify] 语法检查失败！请检查模块语法。');
        process.exit(1);
    }
}

build();
