const { spawn } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname, '..', 'backend');
const isWindows = process.platform === 'win32';
const pythonCmd = isWindows 
  ? path.join(backendDir, 'venv', 'Scripts', 'python.exe')
  : path.join(backendDir, 'venv', 'bin', 'python');

const useReload = process.env.BACKEND_NO_RELOAD !== '1';
const args = ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'];
if (useReload) args.splice(3, 0, '--reload'); // omit --reload if BACKEND_NO_RELOAD=1 to avoid Windows reloader issues

console.log('Starting backend server...');
console.log(`Command: ${pythonCmd} ${args.join(' ')}`);

const backend = spawn(pythonCmd, args, {
  cwd: backendDir,
  stdio: 'inherit',
  shell: false
});

backend.on('error', (error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});

backend.on('exit', (code) => {
  console.log(`Backend exited with code ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  backend.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  backend.kill('SIGTERM');
  process.exit(0);
});
