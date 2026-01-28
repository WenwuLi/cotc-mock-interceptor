import { mkdirSync, existsSync, readFileSync } from 'fs';
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

    // 从 package.json 读取版本号
    const packageJsonPath = join(rootDir, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const version = packageJson.version;

    if (!version || version === '0.0.0') {
        console.warn('⚠️  Warning: Version is 0.0.0, consider updating package.json version first.');
    }

    // 创建 release 目录（如果不存在）
    if (!existsSync(releaseDir)) {
        mkdirSync(releaseDir, { recursive: true });
        console.log('✅ Created release directory');
    }

    // 使用版本号生成文件名
    const zipFileName = `cotc-mock-interceptor-v${version}.zip`;
    const zipFilePath = join(releaseDir, zipFileName);

    console.log('📦 Creating release package...');
    console.log(`   Version: v${version}`);
    console.log(`   Source: ${distDir}`);
    console.log(`   Output: ${zipFilePath}`);

    try {
        // 使用 PowerShell 的 Compress-Archive 命令
        const powershellCmd = `Compress-Archive -Path "${distDir}\\*" -DestinationPath "${zipFilePath}" -Force`;
        await execAsync(powershellCmd, { shell: 'powershell.exe' });

        console.log('✅ Release package created successfully!');
        console.log(`📍 Location: ${zipFilePath}`);
        console.log('');
        console.log(`💡 Upload this file to GitHub Releases with tag: v${version}`);
    } catch (error) {
        console.error('❌ Error creating zip file:', error.message);
        process.exit(1);
    }
}

createRelease();
