/// <reference types="vitest" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        headers: {
          // Additional security headers for development
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // Monaco Editor in its own chunk
              'monaco-editor': ['@monaco-editor/react'],
              // AI services in separate chunk
              'ai-services': ['./services/gemini.ts'],
              // Database operations in separate chunk
              'database': ['idb', './lib/db.ts'],
              // React ecosystem
              'react-vendor': ['react', 'react-dom', 'react-markdown'],
              // UI components
              'ui-vendor': ['lucide-react']
            }
          }
        },
        // Increase chunk size warning limit slightly
        chunkSizeWarningLimit: 600
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        css: true,
        testTimeout: 15000, // Increased timeout for complex tests
        pool: 'threads',
        threads: true,
        singleThread: false, // Allow parallel execution
        maxThreads: 4, // Limit threads for stability
        minThreads: 1,
        include: [
          'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
          'components/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
          'hooks/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
          'services/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        ],
        exclude: [
          'node_modules',
          'dist',
          'build',
          '.{idea,git,cache,output,temp}/**',
          '**/*.config.{js,ts}',
        ],
        reporters: ['verbose', 'json', 'html'],
        outputFile: {
          json: './test-results.json',
          html: './test-report.html',
        },
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html', 'lcov'],
          exclude: [
            'node_modules/',
            'src/test/',
            'src/index.tsx',
            'src/vite-env.d.ts',
            '**/*.d.ts',
            'src/**/*.test.{ts,tsx}',
            'src/**/__tests__/**',
            'components/**/*.test.{ts,tsx}',
            'components/**/__tests__/**',
            'hooks/**/*.test.{ts,tsx}',
            'hooks/**/__tests__/**',
            'services/**/*.test.{ts,tsx}',
            'services/**/__tests__/**',
            'lib/**/*.test.{ts,tsx}',
            'lib/**/__tests__/**',
            'utils/**/*.test.{ts,tsx}',
            'utils/**/__tests__/**',
            '**/*.config.{ts,js}',
          ],
          include: [
            'src/**/*.{ts,tsx}',
            'components/**/*.{ts,tsx}',
            'hooks/**/*.{ts,tsx}',
            'lib/**/*.{ts,tsx}',
            'services/**/*.{ts,tsx}',
            'utils/**/*.{ts,tsx}',
          ],
          thresholds: {
            global: {
              branches: 70,
              functions: 70,
              lines: 70,
              statements: 70,
            },
            './src/hooks/': {
              branches: 80,
              functions: 80,
              lines: 80,
              statements: 80,
            },
            './src/components/': {
              branches: 75,
              functions: 75,
              lines: 75,
              statements: 75,
            },
            './src/lib/': {
              branches: 85,
              functions: 85,
              lines: 85,
              statements: 85,
            },
          },
        },
      },
    };
});
