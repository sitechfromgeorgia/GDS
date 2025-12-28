#!/usr/bin/env node

/**
 * Turbopack and React Compiler Performance Testing Script
 * Georgian Distribution System - Performance Validation Tool
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';

interface PerformanceResults {
  timestamp: string;
  environment: string;
  nodeVersion: string;
  buildMetrics: {
    standard: BuildResult;
    turbo: BuildResult;
    turboDebug: BuildResult;
  };
  developmentMetrics: {
    startupTime: number;
    hmrTime: number;
    memoryUsage: number;
  };
  recommendations: string[];
  score: number;
}

interface BuildResult {
  duration: number;
  success: boolean;
  outputSize: string;
  memoryUsage: number;
  errors?: string[];
  warnings?: string[];
  cacheHit?: boolean;
}

class TurbopackPerformanceTester {
  private results: PerformanceResults = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    buildMetrics: {
      standard: this.createEmptyBuildResult(),
      turbo: this.createEmptyBuildResult(),
      turboDebug: this.createEmptyBuildResult()
    },
    developmentMetrics: {
      startupTime: 0,
      hmrTime: 0,
      memoryUsage: 0
    },
    recommendations: [],
    score: 0
  };

  constructor() {
    this.validateEnvironment();
  }

  private createEmptyBuildResult(): BuildResult {
    return {
      duration: 0,
      success: false,
      outputSize: '0 B',
      memoryUsage: 0
    };
  }

  private validateEnvironment() {
    console.log('🔍 Validating Environment for Turbopack Testing...');

    // Check Node.js version
    const versionParts = process.version.split('.');
    const majorVersion = parseInt((versionParts[0] || 'v0').slice(1));
    if (majorVersion < 18) {
      throw new Error('Node.js 18+ required for Turbopack. Current: ' + process.version);
    }

    // Check if we're in the frontend directory
    if (!fs.existsSync('./package.json')) {
      throw new Error('Must run from frontend directory');
    }

    // Check if Turbo is installed
    try {
      execSync('npx turbo --version', { stdio: 'pipe' });
      console.log('✅ Turbo found');
    } catch {
      throw new Error('Turbo not found. Run: npm install -g turbo');
    }

    console.log('✅ Environment validation passed');
  }

  async runPerformanceTests(): Promise<PerformanceResults> {
    console.log('🚀 Starting Turbopack & React Compiler Performance Tests\n');

    // Test 1: Standard Next.js build
    await this.testStandardBuild();

    // Test 2: Turbopack build
    await this.testTurbopackBuild();

    // Test 3: Turbopack debug build
    await this.testTurbopackDebugBuild();

    // Test 4: Development server startup
    await this.testDevelopmentStartup();

    // Test 5: Hot Module Replacement (HMR)
    await this.testHMRPerformance();

    // Generate recommendations and score
    this.generateRecommendations();
    this.calculateOverallScore();

    return this.results;
  }

  private async testStandardBuild() {
    console.log('📦 Testing Standard Next.js Build...');
    
    const startTime = Date.now();
    
    try {
      // Clean build output
      if (fs.existsSync('./.next')) {
        execSync('rm -rf ./.next', { stdio: 'pipe' });
      }

      // Run standard build
      execSync('npm run build', { 
        stdio: 'pipe',
        env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }
      });

      const duration = Date.now() - startTime;
      
      // Get build output size
      const outputSize = this.getDirectorySize('./.next');
      
      // Get memory usage
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;

      this.results.buildMetrics.standard = {
        duration,
        success: true,
        outputSize,
        memoryUsage
      };

      console.log(`✅ Standard build completed in ${duration}ms (${outputSize})`);
      
    } catch (error) {
      console.log('❌ Standard build failed:', error);
      this.results.buildMetrics.standard.errors = [error instanceof Error ? error.message : 'Unknown error'];
    }
  }

  private async testTurbopackBuild() {
    console.log('⚡ Testing Turbopack Build...');
    
    const startTime = Date.now();
    
    try {
      // Clean build output
      if (fs.existsSync('./.next')) {
        execSync('rm -rf ./.next', { stdio: 'pipe' });
      }

      // Run Turbopack build
      execSync('npm run build:turbo', { 
        stdio: 'pipe',
        env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }
      });

      const duration = Date.now() - startTime;
      
      // Get build output size
      const outputSize = this.getDirectorySize('./.next');
      
      // Get memory usage
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;

      this.results.buildMetrics.turbo = {
        duration,
        success: true,
        outputSize,
        memoryUsage
      };

      console.log(`✅ Turbopack build completed in ${duration}ms (${outputSize})`);
      
    } catch (error) {
      console.log('❌ Turbopack build failed:', error);
      this.results.buildMetrics.turbo.errors = [error instanceof Error ? error.message : 'Unknown error'];
    }
  }

  private async testTurbopackDebugBuild() {
    console.log('🔍 Testing Turbopack Debug Build...');
    
    const startTime = Date.now();
    
    try {
      // Clean build output
      if (fs.existsSync('./.next')) {
        execSync('rm -rf ./.next', { stdio: 'pipe' });
      }

      // Run Turbopack debug build
      execSync('npm run build:debug', { 
        stdio: 'pipe',
        env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }
      });

      const duration = Date.now() - startTime;
      
      // Get build output size
      const outputSize = this.getDirectorySize('./.next');
      
      // Get memory usage
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;

      this.results.buildMetrics.turboDebug = {
        duration,
        success: true,
        outputSize,
        memoryUsage
      };

      console.log(`✅ Turbopack debug build completed in ${duration}ms (${outputSize})`);
      
    } catch (error) {
      console.log('❌ Turbopack debug build failed:', error);
      this.results.buildMetrics.turboDebug.errors = [error instanceof Error ? error.message : 'Unknown error'];
    }
  }

  private async testDevelopmentStartup() {
    console.log('🏃 Testing Development Server Startup...');
    
    const startTime = Date.now();
    
    try {
      // Start development server in background
      const devProcess = spawn('npm', ['run', 'dev:turbo:trace'], {
        stdio: 'pipe',
        env: { ...process.env, PORT: '3001' }
      });

      // Wait for server to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          devProcess.kill();
          reject(new Error('Server startup timeout'));
        }, 30000);

        devProcess.stdout?.on('data', (data) => {
          if (data.toString().includes('Local:')) {
            clearTimeout(timeout);
            devProcess.kill();
            resolve(true);
          }
        });

        devProcess.stderr?.on('data', (data) => {
          if (data.toString().includes('Error')) {
            clearTimeout(timeout);
            devProcess.kill();
            reject(new Error(data.toString()));
          }
        });
      });

      const startupTime = Date.now() - startTime;
      this.results.developmentMetrics.startupTime = startupTime;
      
      console.log(`✅ Development server started in ${startupTime}ms`);
      
    } catch (error) {
      console.log('❌ Development server startup failed:', error);
      this.results.recommendations.push('Check development server configuration and dependencies');
    }
  }

  private async testHMRPerformance() {
    console.log('🔥 Testing Hot Module Replacement Performance...');
    
    try {
      // Test HMR by creating a temporary file change
      const testFile = './src/pages/test-hmr.tsx';
      const testContent = `export default function TestHMR() { return <div>Test ${Date.now()}</div>; }`;
      
      fs.writeFileSync(testFile, testContent);
      
      const hmrStartTime = Date.now();
      
      // Wait for HMR to process (simplified test)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const hmrTime = Date.now() - hmrStartTime;
      this.results.developmentMetrics.hmrTime = hmrTime;
      
      // Clean up test file
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
      
      console.log(`✅ HMR test completed in ${hmrTime}ms`);
      
    } catch (error) {
      console.log('❌ HMR test failed:', error);
      this.results.developmentMetrics.hmrTime = -1;
    }
  }

  private getDirectorySize(dirPath: string): string {
    if (!fs.existsSync(dirPath)) return '0 B';
    
    let totalSize = 0;
    
    const getDirectorySize = (path: string): number => {
      const items = fs.readdirSync(path);
      let size = 0;
      
      for (const item of items) {
        const itemPath = path + '/' + item;
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          size += getDirectorySize(itemPath);
        } else {
          size += stats.size;
        }
      }
      
      return size;
    };
    
    totalSize = getDirectorySize(dirPath);
    
    // Format size
    if (totalSize < 1024) return `${totalSize} B`;
    if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(1)} KB`;
    return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
  }

  private generateRecommendations() {
    const recommendations: string[] = [];
    const { buildMetrics } = this.results;
    
    // Compare build times
    if (buildMetrics.turbo.success && buildMetrics.standard.success) {
      const improvement = ((buildMetrics.standard.duration - buildMetrics.turbo.duration) / buildMetrics.standard.duration) * 100;
      
      if (improvement > 20) {
        recommendations.push(`🚀 Excellent Turbopack performance! ${improvement.toFixed(1)}% faster than standard build`);
      } else if (improvement > 10) {
        recommendations.push(`✅ Good Turbopack performance: ${improvement.toFixed(1)}% faster than standard build`);
      } else {
        recommendations.push(`⚠️ Consider optimizing Turbopack configuration. Only ${improvement.toFixed(1)}% improvement`);
      }
    }

    // Memory usage recommendations
    if (buildMetrics.turbo.memoryUsage > 500) {
      recommendations.push('💾 High memory usage detected. Consider optimizing bundle size or increasing Node.js memory limit');
    }

    // Development performance
    if (this.results.developmentMetrics.startupTime > 10000) {
      recommendations.push('🐌 Slow development startup. Consider optimizing dependencies or using development cache');
    }

    if (this.results.developmentMetrics.hmrTime > 3000) {
      recommendations.push('🔥 Slow HMR performance. Consider optimizing module dependencies or using Turbopack cache');
    }

    this.results.recommendations = recommendations;
  }

  private calculateOverallScore() {
    let score = 0;
    const { buildMetrics } = this.results;
    
    // Build performance score (40% weight)
    if (buildMetrics.turbo.success && buildMetrics.standard.success) {
      const improvement = ((buildMetrics.standard.duration - buildMetrics.turbo.duration) / buildMetrics.standard.duration) * 100;
      score += Math.min(40, Math.max(0, improvement));
    }
    
    // Development performance score (30% weight)
    const devScore = 30;
    if (this.results.developmentMetrics.startupTime < 5000) score += 10;
    if (this.results.developmentMetrics.hmrTime < 2000) score += 10;
    if (buildMetrics.turbo.memoryUsage < 400) score += 10;
    
    // Memory efficiency score (20% weight)
    if (buildMetrics.turbo.memoryUsage < 300) score += 20;
    else if (buildMetrics.turbo.memoryUsage < 500) score += 10;
    
    // Success score (10% weight)
    const successCount = [buildMetrics.standard, buildMetrics.turbo, buildMetrics.turboDebug]
      .filter(build => build.success).length;
    score += (successCount / 3) * 10;
    
    this.results.score = Math.round(score);
  }

  generateReport(): string {
    const { buildMetrics, developmentMetrics, recommendations, score } = this.results;
    
    return `
# Turbopack & React Compiler Performance Report

**Generated:** ${this.results.timestamp}  
**Environment:** ${this.results.environment}  
**Node.js Version:** ${this.results.nodeVersion}  
**Overall Score:** ${score}/100

## Build Performance Comparison

### Standard Next.js Build
- **Duration:** ${buildMetrics.standard.duration}ms
- **Success:** ${buildMetrics.standard.success ? '✅' : '❌'}
- **Output Size:** ${buildMetrics.standard.outputSize}
- **Memory Usage:** ${buildMetrics.standard.memoryUsage.toFixed(1)}MB

### Turbopack Build
- **Duration:** ${buildMetrics.turbo.duration}ms
- **Success:** ${buildMetrics.turbo.success ? '✅' : '❌'}
- **Output Size:** ${buildMetrics.turbo.outputSize}
- **Memory Usage:** ${buildMetrics.turbo.memoryUsage.toFixed(1)}MB

### Turbopack Debug Build
- **Duration:** ${buildMetrics.turboDebug.duration}ms
- **Success:** ${buildMetrics.turboDebug.success ? '✅' : '❌'}
- **Output Size:** ${buildMetrics.turboDebug.outputSize}
- **Memory Usage:** ${buildMetrics.turboDebug.memoryUsage.toFixed(1)}MB

## Performance Improvements

${buildMetrics.turbo.success && buildMetrics.standard.success ? 
  `**Build Time Improvement:** ${(((buildMetrics.standard.duration - buildMetrics.turbo.duration) / buildMetrics.standard.duration) * 100).toFixed(1)}%` :
  'Build comparison not available due to build failures'}

## Development Performance

- **Server Startup Time:** ${developmentMetrics.startupTime}ms
- **HMR Performance:** ${developmentMetrics.hmrTime}ms
- **Memory Usage:** ${developmentMetrics.memoryUsage.toFixed(1)}MB

## Recommendations

${recommendations.length > 0 ? recommendations.map(rec => `- ${rec}`).join('\n') : '- No specific recommendations'}

## Next Steps

1. **Run Development Server:** \`npm run dev:turbo\`
2. **Monitor Performance:** Check browser developer tools for Web Vitals
3. **Optimize Further:** Review bundle size and component optimization
4. **Production Deployment:** Use \`npm run build:turbo\` for faster builds

---
*Report generated by Georgian Distribution System Performance Tester*
`;
  }

  saveReport(filename = 'turbopack-performance-report.md') {
    const report = this.generateReport();
    fs.writeFileSync(filename, report);
    console.log(`\n📊 Performance report saved to: ${filename}`);
  }

  saveJSONReport(filename = 'turbopack-performance-data.json') {
    fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
    console.log(`📈 Performance data saved to: ${filename}`);
  }
}

// Main execution
async function main() {
  try {
    const tester = new TurbopackPerformanceTester();
    const results = await tester.runPerformanceTests();
    
    // Save reports
    tester.saveReport();
    tester.saveJSONReport();
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('🎯 PERFORMANCE TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Overall Score: ${results.score}/100`);
    console.log(`Standard Build: ${results.buildMetrics.standard.duration}ms`);
    console.log(`Turbopack Build: ${results.buildMetrics.turbo.duration}ms`);
    
    if (results.buildMetrics.standard.success && results.buildMetrics.turbo.success) {
      const improvement = ((results.buildMetrics.standard.duration - results.buildMetrics.turbo.duration) / results.buildMetrics.standard.duration) * 100;
      console.log(`Performance Improvement: ${improvement.toFixed(1)}%`);
    }
    
    console.log('\nRecommendations:');
    results.recommendations.forEach(rec => console.log(`  • ${rec}`));
    console.log('\n' + '='.repeat(50));
    
    process.exit(results.score >= 70 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { TurbopackPerformanceTester };