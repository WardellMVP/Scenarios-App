import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { InsertScenario } from '@shared/schema';
import { storage } from './storage';
import { scheduleSync } from './cron';
import { simpleGit, SimpleGit } from 'simple-git';

// YAML schema for scenarios
export interface ScenarioYaml {
  name: string;
  description: string;
  target_apps: string[];
  exec_command: string;
}

// Directory where scenario YAML files are stored
const SCENARIOS_DIR = path.resolve(process.cwd(), 'scenarios');

// Initialize the scenarios directory if it doesn't exist
export async function initScenariosDir() {
  try {
    await fs.mkdir(SCENARIOS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating scenarios directory:', error);
  }
}

// Parse a single YAML file and return the scenario data
export async function parseScenarioYaml(filePath: string): Promise<ScenarioYaml | null> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const yamlData = yaml.load(fileContent) as ScenarioYaml;
    
    // Validate required fields
    if (!yamlData.name || !yamlData.exec_command) {
      console.error(`Invalid scenario YAML in ${filePath}: Missing required fields`);
      return null;
    }
    
    return yamlData;
  } catch (error) {
    console.error(`Error parsing scenario YAML ${filePath}:`, error);
    return null;
  }
}

// Load all scenarios from the scenarios directory
export async function loadScenarios() {
  try {
    await initScenariosDir();
    
    const files = await fs.readdir(SCENARIOS_DIR);
    const yamlFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
    
    for (const file of yamlFiles) {
      const filePath = path.join(SCENARIOS_DIR, file);
      const scenario = await parseScenarioYaml(filePath);
      
      if (scenario) {
        // Convert to database schema and store
        const insertScenario: InsertScenario = {
          name: scenario.name,
          description: scenario.description || '',
          targetApps: scenario.target_apps || [],
          execCommand: scenario.exec_command,
          filePath,
        };
        
        await storage.createScenario(insertScenario);
        console.log(`Loaded scenario: ${scenario.name}`);
      }
    }
    
    console.log(`Loaded ${yamlFiles.length} scenarios`);
  } catch (error) {
    console.error('Error loading scenarios:', error);
  }
}

// Clone or pull scenarios from GitLab repo
export async function syncScenariosFromGitLab(accessToken: string, repoUrl?: string) {
  if (!repoUrl) {
    // Default to the first project if no specific repo URL is provided
    try {
      const projects = await fetchGitLabProjects(accessToken);
      if (projects && projects.length > 0) {
        repoUrl = projects[0].http_url_to_repo;
      } else {
        throw new Error('No GitLab projects found');
      }
    } catch (error) {
      console.error('Error fetching GitLab projects:', error);
      throw error;
    }
  }
  
  if (!repoUrl) {
    throw new Error('No GitLab repository URL specified');
  }
  
  try {
    await initScenariosDir();
    
    // Set up authentication for git operations
    const git: SimpleGit = simpleGit();
    const gitlabUrlWithAuth = repoUrl.replace('https://', `https://oauth2:${accessToken}@`);
    
    // Check if the directory is already a git repo
    const isRepo = await fs.access(path.join(SCENARIOS_DIR, '.git'))
      .then(() => true)
      .catch(() => false);
    
    if (isRepo) {
      // Pull latest changes
      await git.cwd(SCENARIOS_DIR).pull();
      console.log('Pulled latest scenarios from GitLab');
    } else {
      // Clone the repo
      await git.clone(gitlabUrlWithAuth, SCENARIOS_DIR);
      console.log('Cloned scenarios from GitLab');
    }
    
    // Reload all scenarios
    await loadScenarios();
    
    // Schedule regular sync
    scheduleSync(accessToken, repoUrl);
    
    return true;
  } catch (error) {
    console.error('Error syncing scenarios from GitLab:', error);
    throw error;
  }
}

// Fetch user's GitLab projects
async function fetchGitLabProjects(accessToken: string) {
  try {
    const response = await fetch('https://gitlab.com/api/v4/projects?membership=true', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching GitLab projects:', error);
    throw error;
  }
}
