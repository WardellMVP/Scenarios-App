import { spawn } from 'child_process';
import WebSocket from 'ws';
import { storage } from './storage';
import { ScenarioRun, UpdateScenarioRun } from '@shared/schema';

interface ExecutionClient {
  ws: WebSocket;
  runId: number;
}

// Map to track active clients
const activeClients = new Map<number, ExecutionClient[]>();

// Execute a scenario and stream output via WebSocket
export async function executeScenario(
  scenarioId: number,
  userId: number,
  command: string
): Promise<number> {
  // Create run record
  const run = await storage.createScenarioRun({
    scenarioId,
    userId,
    status: 'running',
  });

  // Execute in background
  executeInBackground(run.id, command);
  
  return run.id;
}

// Background execution function
async function executeInBackground(runId: number, command: string) {
  console.log(`Executing scenario run ${runId} with command: ${command}`);
  
  let output = '';
  const startTime = Date.now();
  
  try {
    // Execute the command
    const process = spawn(command, { shell: true });
    
    // Handle stdout
    process.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      broadcastToClients(runId, chunk);
    });
    
    // Handle stderr
    process.stderr.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      broadcastToClients(runId, chunk);
    });
    
    // Handle process exit
    await new Promise<void>((resolve, reject) => {
      process.on('close', (code) => {
        const endTime = new Date();
        const duration = Math.floor((Date.now() - startTime) / 1000);
        
        const status = code === 0 ? 'success' : 'failed';
        const update: UpdateScenarioRun = {
          status,
          endTime,
          duration,
          output
        };
        
        // Update the run record
        storage.updateScenarioRun(runId, update)
          .then(() => {
            broadcastToClients(runId, `\n[INFO] Process exited with code ${code}`);
            broadcastToClients(runId, '\n[INFO] Execution completed');
            resolve();
          })
          .catch(reject);
      });
      
      process.on('error', (err) => {
        output += `\n[ERROR] ${err.message}`;
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Error executing scenario run ${runId}:`, error);
    
    // Update the run as failed
    const endTime = new Date();
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    output += `\n[ERROR] Execution failed: ${error}`;
    
    await storage.updateScenarioRun(runId, {
      status: 'failed',
      endTime,
      duration,
      output
    });
    
    broadcastToClients(runId, `\n[ERROR] Execution failed: ${error}`);
  }
}

// Send output to all connected clients for a specific run
function broadcastToClients(runId: number, message: string) {
  const clients = activeClients.get(runId) || [];
  
  clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

// Handle WebSocket connections
export function handleWebSocketConnection(ws: WebSocket) {
  console.log('New WebSocket connection established');
  
  let registeredRunId: number | null = null;
  
  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Handle subscription to a scenario run
      if (data.type === 'subscribe' && data.runId) {
        const runId = parseInt(data.runId);
        
        if (isNaN(runId)) {
          ws.send(JSON.stringify({ error: 'Invalid runId' }));
          return;
        }
        
        // Register this client for the specified run
        const clients = activeClients.get(runId) || [];
        clients.push({ ws, runId });
        activeClients.set(runId, clients);
        
        registeredRunId = runId;
        
        // Send confirmation
        ws.send(JSON.stringify({ type: 'subscribed', runId }));
        
        // Retrieve existing output if any
        storage.getScenarioRun(runId).then(run => {
          if (run && run.output) {
            ws.send(run.output);
          }
        });
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    
    if (registeredRunId) {
      // Remove this client from the active clients list
      const clients = activeClients.get(registeredRunId) || [];
      const updatedClients = clients.filter(client => client.ws !== ws);
      
      if (updatedClients.length > 0) {
        activeClients.set(registeredRunId, updatedClients);
      } else {
        activeClients.delete(registeredRunId);
      }
    }
  });
}
