import { Worker } from 'node:worker_threads';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_SCRIPT = path.join(__dirname, 'compressWorkerThread.js');

// Small bounded pool rather than one worker per request — each worker
// independently compiles the jsquash WASM modules on first use (real but
// one-time cost per worker), and an unbounded number of workers would let
// enough concurrent large-image requests still exhaust server memory/CPU.
const POOL_SIZE = 2;

let nextId = 0;
const queue = [];
const idle = [];
const currentTask = new Map(); // worker -> in-flight task

function spawnWorker() {
  const worker = new Worker(WORKER_SCRIPT);

  worker.on('message', (msg) => {
    const task = currentTask.get(worker);
    currentTask.delete(worker);
    if (task) {
      if (msg.error) task.reject(new Error(msg.error));
      else task.resolve({ buffer: Buffer.from(msg.buffer), mime: msg.mime, resizedFrom: msg.resizedFrom });
    }
    idle.push(worker);
    drain();
  });

  worker.on('error', (err) => {
    const task = currentTask.get(worker);
    currentTask.delete(worker);
    if (task) task.reject(err);
    // This worker's thread state is unknown after an uncaught error —
    // don't reuse it; replace it in the pool instead.
    idle.push(spawnWorker());
    drain();
  });

  return worker;
}

for (let i = 0; i < POOL_SIZE; i++) idle.push(spawnWorker());

function drain() {
  if (!queue.length || !idle.length) return;
  const worker = idle.pop();
  const task = queue.shift();
  currentTask.set(worker, task);
  worker.postMessage({ id: task.id, inputBuffer: task.inputBuffer, format: task.format, quality: task.quality });
}

/** Drop-in replacement for compressImage() that runs the work in a worker
 *  thread — see compressWorkerThread.js for why. */
export function compressImageIsolated(inputBuffer, { format, quality }) {
  return new Promise((resolve, reject) => {
    queue.push({ id: nextId++, inputBuffer, format, quality, resolve, reject });
    drain();
  });
}
