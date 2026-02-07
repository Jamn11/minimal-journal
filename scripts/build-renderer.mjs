import { cpSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const rendererSourceDir = join('src', 'renderer');
const rendererOutputDir = join('dist', 'renderer');

mkdirSync(rendererOutputDir, { recursive: true });

cpSync(join(rendererSourceDir, 'app-browser.js'), join(rendererOutputDir, 'app-browser.js'));
cpSync(join(rendererSourceDir, 'index.html'), join(rendererOutputDir, 'index.html'));
cpSync(join(rendererSourceDir, 'styles.css'), join(rendererOutputDir, 'styles.css'));
cpSync(join(rendererSourceDir, 'modules'), join(rendererOutputDir, 'modules'), { recursive: true });
