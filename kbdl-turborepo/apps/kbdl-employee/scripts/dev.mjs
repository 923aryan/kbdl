import { spawn, execSync } from 'node:child_process';

function tryAdbReverse() {
  try {
    execSync('adb reverse tcp:8081 tcp:8081', { stdio: 'inherit' });
    execSync('adb reverse tcp:8000 tcp:8000', { stdio: 'inherit' });
  } catch {
    console.warn('⚠ adb not found — skipping port reverse (install Android platform-tools if you need a device).');
  }
}

tryAdbReverse();

const child = spawn('npx', ['expo', 'start', '--dev-client', '--localhost'], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
