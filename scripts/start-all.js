const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

// Ensure Next.js runs from project root so module resolution finds node_modules
const next = spawn('npm', ['run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, INIT_CWD: rootDir },
});

const backendDir = path.join(rootDir, 'backend');
const pythonCmd = isWindows
  ? path.join(backendDir, 'venv', 'Scripts', 'python.exe')
  : path.join(backendDir, 'venv', 'bin', 'python');
const useReload = process.env.BACKEND_NO_RELOAD !== '1';
const args = ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'];
if (useReload) args.splice(3, 0, '--reload');

const backend = spawn(pythonCmd, args, {
  cwd: backendDir,
  stdio: 'inherit',
  shell: false,
});

[next, backend].forEach((proc, i) => {
  const name = i === 0 ? 'Next.js' : 'Backend';
  proc.on('error', (err) => {
    console.error(`${name} failed to start:`, err);
    process.exit(1);
  });
  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      next.kill();
      backend.kill();
      process.exit(code);
    }
  });
});

process.on('SIGINT', () => {
  next.kill('SIGINT');
  backend.kill('SIGINT');
  process.exit(0);
});
process.on('SIGTERM', () => {
  next.kill('SIGTERM');
  backend.kill('SIGTERM');
  process.exit(0);
});

console.log('Frontend: http://localhost:3000');
console.log('Backend:  http://localhost:8000');
console.log('Press Ctrl+C to stop both.\n');
