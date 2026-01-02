import { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';

// Helper to inline chunks into JS content
const inlineJsChunks = (js: string, distDir: string): string => {
  const importRegex = /import\{([^}]*)\}from"([^"]+)";?/g;

  // We process matches one by one. note: replacing invalidates indices if we used a loop with regex.exec
  // simple replace with callback is better if safe, or loop and update string.
  // The logic below replaces the *exact match string*.

  // However, matchAll returns iterator. If we modify `js` inside the loop, subsequent matches might be wrong if we use indices? 
  // matchAll works on original string. `js.replace(match[0])` will replace the *first occurrence* of that import string.
  // Since imports are usually unique per file path, this is fine.
  // But if same file is imported twice (unlikely for top level static imports), replace would only replace first.
  // We should be careful.
  // Actually, standard iteration is safer if we reconstruct the string or just use replaceAll for that specific import line.

  const chunkMatches = [...js.matchAll(importRegex)];

  for (const match of chunkMatches) {
    const importedNames = match[1]; // e.g., "a as Te"
    const chunkPath = match[2].replace('./', '');
    const chunkFullPath = path.join(distDir, chunkPath);

    if (fs.existsSync(chunkFullPath)) {
      let chunkContent = fs.readFileSync(chunkFullPath, 'utf8');

      // Parse the import to extract name mappings
      // import { a as x } from ... -> map[a] = x
      const importMap: Record<string, string> = {};
      importedNames.split(',').forEach(part => {
        const trimmed = part.trim();
        const asMatch = trimmed.match(/(\w+)\s+as\s+(\w+)/);
        if (asMatch) {
          importMap[asMatch[1]] = asMatch[2];
        } else {
          importMap[trimmed] = trimmed;
        }
      });

      // Find the export statement in the chunk
      const exportMatch = chunkContent.match(/export\{([^}]+)\}/);
      let returnObject = '{}';

      if (exportMatch) {
        const exports = exportMatch[1];
        const exportParts = exports.split(',');
        const returnPairs: string[] = [];

        exportParts.forEach(part => {
          const trimmed = part.trim();
          const asMatch = trimmed.match(/(\w+)\s+as\s+(\w+)/);

          if (asMatch) {
            const [_, originalName, exportedAs] = asMatch;
            returnPairs.push(`${exportedAs}: ${originalName}`);
          } else {
            // shorthand export { foo }
            returnPairs.push(`${trimmed}: ${trimmed}`);
          }
        });

        returnObject = `{ ${returnPairs.join(', ')} }`;

        // Remove the export statement from chunk
        chunkContent = chunkContent.replace(/export\{[^}]+\};?/, '');
      }

      // Generate unique safe name for the chunk exports
      const safeChunkName = '_' + chunkPath.replace(/[^a-zA-Z0-9]/g, '_');

      // Create declarations for imported vars
      let variableDeclarations = '';
      Object.keys(importMap).forEach(exportedAs => {
        const localName = importMap[exportedAs];
        variableDeclarations += `const ${localName} = ${safeChunkName}.${exportedAs};\n`;
      });

      // Replace the import with the chunk content wrapped in IIFE + variable declarations
      // We use replace with literal string to avoid special replacement patterns in second arg

      const replacement = `/* Inlined: ${chunkPath} */
const ${safeChunkName} = (() => {
${chunkContent}
return ${returnObject};
})();
${variableDeclarations}
`;

      js = js.replace(match[0], () => replacement);
    }
  }
  return js;
};

export interface SuperProductivityPluginOptions {
  inlineAssets?: boolean;
  copyTo?: string;
}

export const superProductivityPlugin = (
  options: SuperProductivityPluginOptions = {},
): Plugin => {
  const { inlineAssets = true, copyTo } = options;

  return {
    name: 'super-productivity-plugin',
    config: () => {
      return {
        build: {
          outDir: 'dist',
          emptyOutDir: true,
          rollupOptions: {
            input: {
              plugin: path.resolve(process.cwd(), 'src/plugin.ts'),
              ...(fs.existsSync(path.resolve(process.cwd(), 'src/index.html'))
                ? { index: path.resolve(process.cwd(), 'src/index.html') }
                : {}),
            },
            output: {
              entryFileNames: '[name].js',
              chunkFileNames: '[name]-[hash].js',
              assetFileNames: '[name].[ext]',
            },
          },
          copyPublicDir: false,
        },
        publicDir: 'src/assets',
      };
    },
    closeBundle: {
      order: 'post',
      handler: () => {
        const distDir = path.resolve(process.cwd(), 'dist');

        // 1. Copy manifest.json
        const manifestSrc = path.resolve(process.cwd(), 'src/manifest.json');
        const manifestDest = path.join(distDir, 'manifest.json');
        if (fs.existsSync(manifestSrc)) {
          if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
          fs.copyFileSync(manifestSrc, manifestDest);
        }

        // 2. Copy icon.svg
        const iconSrc = path.resolve(process.cwd(), 'src/assets/icon.svg');
        const iconDest = path.join(distDir, 'icon.svg');
        if (fs.existsSync(iconSrc)) {
          if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
          fs.copyFileSync(iconSrc, iconDest);
        }

        // 3. Inline plugin.js dependencies (ALWAYS)
        const pluginJsPath = path.join(distDir, 'plugin.js');
        if (fs.existsSync(pluginJsPath)) {
          let js = fs.readFileSync(pluginJsPath, 'utf8');
          js = inlineJsChunks(js, distDir);
          fs.writeFileSync(pluginJsPath, js);
          console.log('✅ Inlined dependencies for plugin.js');
        }

        // 4. Handle index.html and inlining (UI)
        const htmlPath = path.join(distDir, 'index.html');
        const nestedHtmlPath = path.join(distDir, 'src/index.html');
        if (fs.existsSync(nestedHtmlPath) && !fs.existsSync(htmlPath)) {
          fs.renameSync(nestedHtmlPath, htmlPath);
          try {
            fs.rmSync(path.join(distDir, 'src'), { recursive: true, force: true });
          } catch (e) { }
        }

        if (inlineAssets && fs.existsSync(htmlPath)) {
          let html = fs.readFileSync(htmlPath, 'utf8');
          const jsPath = path.join(distDir, 'index.js');
          const cssPath = path.join(distDir, 'index.css');

          if (fs.existsSync(jsPath)) {
            let js = fs.readFileSync(jsPath, 'utf8');
            js = inlineJsChunks(js, distDir);

            html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');

            html = html.replace(
              /<script([^>]*)src="[^"]*index\.js"[^>]*><\/script>/g,
              (match, attrs) => {
                const typeAttr = attrs.includes('type="module"') || match.includes('type="module"') ? 'type="module"' : '';
                return `<script ${typeAttr}>${js}</script>`;
              },
            );
          }

          if (fs.existsSync(cssPath)) {
            const css = fs.readFileSync(cssPath, 'utf8');
            html = html.replace(
              /<link[^>]*rel="stylesheet"[^>]*href="[^"]*index\.css"[^>]*>/g,
              `<style>${css}</style>`,
            );
          }

          fs.writeFileSync(htmlPath, html);
          console.log('✅ Assets inlined successfully for index.html');
        }

        // 5. Copy to destination
        if (copyTo) {
          const destDir = path.resolve(process.cwd(), copyTo);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }

          const copyRecursive = (src: string, dest: string): void => {
            const entries = fs.readdirSync(src, { withFileTypes: true });
            if (!fs.existsSync(dest)) fs.mkdirSync(dest);
            for (const entry of entries) {
              const srcPath = path.join(src, entry.name);
              const destPath = path.join(dest, entry.name);
              if (entry.isDirectory()) {
                copyRecursive(srcPath, destPath);
              } else {
                fs.copyFileSync(srcPath, destPath);
              }
            }
          };
          copyRecursive(distDir, destDir);
          console.log(`✅ Copied build to ${copyTo}`);
        }
      },
    },
  };
};
