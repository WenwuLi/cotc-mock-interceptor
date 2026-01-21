import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);

async function createRelease() {
    const rootDir = resolve(__dirname, '..');
    const distDir = join(rootDir, 'dist');
    const releaseDir = join(rootDir, 'release');

    // 检查 dist 目录是否存在
    if (!existsSync(distDir)) {
        console.error('❌ Error: dist directory not found. Please run build first.');
        process.exit(1);
    }

    // 创建 release 目录（如果不存在）
    if (!existsSync(releaseDir)) {
        mkdirSync(releaseDir, { recursive: true });
        console.log('✅ Created release directory');
    }

    // 生成文件名（包含时间戳）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const zipFileName = `cotc-mock-interceptor_${timestamp}.zip`;
    const zipFilePath = join(releaseDir, zipFileName);

    console.log('📦 Creating release package...');
    console.log(`   Source: ${distDir}`);
    console.log(`   Output: ${zipFilePath}`);

    try {
        // 使用 PowerShell 的 Compress-Archive 命令
        const powershellCmd = `Compress-Archive -Path "${distDir}\\*" -DestinationPath "${zipFilePath}" -Force`;
        await execAsync(powershellCmd, { shell: 'powershell.exe' });

        console.log('✅ Release package created successfully!');
        console.log(`📍 Location: ${zipFilePath}`);
        console.log('');
        console.log('💡 You can now upload this file to GitHub Releases');
    } catch (error) {
        console.error('❌ Error creating zip file:', error.message);
        process.exit(1);
    }
}

createRelease();
