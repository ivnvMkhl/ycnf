#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const program = new Command();

// CLI configuration
program
  .name('ycnf')
  .description('CLI utility for managing Yandex Cloud Functions')
  .version(require('./package.json').version);

// Helper functions
function loadConfig() {
  const configPath = path.join(process.cwd(), '.functionconfig.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Configuration file .functionconfig.json not found');
  }
  return fs.readJsonSync(configPath);
}

function validateEnv() {
  const required = ['YC_FOLDER_ID'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function getFunctionName(config) {
  if (!config.name) {
    throw new Error('Function name is required in .functionconfig.json');
  }
  return config.name;
}

function execCommand(command, options = {}) {
  const { execSync } = require('child_process');
  const env = { ...process.env };
  
  if (process.env.YC_PROFILE) {
    env.YC_PROFILE = process.env.YC_PROFILE;
  }
  
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      env,
      stdio: options.silent ? 'pipe' : 'inherit'
    });
  } catch (error) {
    if (options.silent) {
      throw error;
    }
    console.error(chalk.red(`Error executing command: ${command}`));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

// Public command
program
  .command('public')
  .description('Publish function to Yandex Cloud')
  .option('-f, --force', 'Force create new version (currently same as regular publish)')
  .action(async (options) => {
    const spinner = ora('Publishing function...').start();
    
    try {
      validateEnv();
      const config = loadConfig();
      const functionName = getFunctionName(config);
      
      // Create deployment package
      spinner.text = 'Creating deployment package...';
      const packagePath = path.join(process.cwd(), 'function.zip');
      
      // Remove existing package if exists
      if (fs.existsSync(packagePath)) {
        fs.removeSync(packagePath);
      }
      
      // Create zip archive
      const archiver = require('archiver');
      const output = fs.createWriteStream(packagePath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', () => {
        console.log(chalk.green(`Archive created: ${archive.pointer()} bytes`));
      });
      
      archive.pipe(output);
      archive.directory('src/', false);
      
      // Add package.json if exists in src
      const srcPackagePath = path.join(process.cwd(), 'src', 'package.json');
      if (fs.existsSync(srcPackagePath)) {
        archive.file(srcPackagePath, { name: 'package.json' });
      }
      
      await archive.finalize();
      
      // Wait for archive to be ready
      await new Promise(resolve => output.on('close', resolve));
      
      spinner.text = 'Uploading function...';
      
      // Build yc command
      let ycCommand;
      
      // Check if function exists
      let functionExists = false;
      try {
        execCommand(`yc serverless function get --name=${functionName} --folder-id=${process.env.YC_FOLDER_ID}`, { silent: true });
        functionExists = true;
      } catch (error) {
        functionExists = false;
      }
      
      if (!functionExists) {
        // Create new function first
        spinner.text = 'Creating function...';
        const createFunctionCommand = `yc serverless function create --name=${functionName} --folder-id=${process.env.YC_FOLDER_ID} --description="${config.description || ''}"`;
        execCommand(createFunctionCommand, { silent: true });
      }
      
      // Create version (new or update)
      ycCommand = `yc serverless function version create --function-name=${functionName} --folder-id=${process.env.YC_FOLDER_ID}`;
      
      // Add configuration parameters for version
      ycCommand += ` --runtime=${config.runtime}`;
      ycCommand += ` --memory=${config.memory}MB`;
      ycCommand += ` --execution-timeout=${config.timeout}s`;
      ycCommand += ` --entrypoint=${config.entrypoint}`;
      ycCommand += ` --source-path=${packagePath}`;
      
      if (config.logging === false) {
        // Explicitly disable logging
        ycCommand += ' --no-logging';
      } else if (config.logging === true) {
        // Use default log group for the folder instead of hardcoded 'default'
        ycCommand += ` --log-folder-id=${process.env.YC_FOLDER_ID}`;
      }
      // If logging is undefined, use default behavior (no explicit flag)
      
      if (config.description) {
        ycCommand += ` --description="${config.description}"`;
      }
      
      // Add environment variables (only if explicitly configured)
      // If environment is null or not specified in config, existing variables in YC will be preserved
      if (config.environment && config.environment !== null && typeof config.environment === 'object' && Object.keys(config.environment).length > 0) {
        const envVars = Object.entries(config.environment)
          .map(([key, value]) => `${key}=${value}`)
          .join(',');
        ycCommand += ` --environment=${envVars}`;
      }
      
      // Add tags
      if (config.tags && config.tags.length > 0) {
        ycCommand += ` --tags=${config.tags.join(',')}`;
      }
      
      // Add service account
      if (config.serviceAccountId) {
        ycCommand += ` --service-account-id=${config.serviceAccountId}`;
      }
      
      // Add network
      if (config.networkId) {
        ycCommand += ` --network-id=${config.networkId}`;
      }
      
      execCommand(ycCommand);
      
      // Handle public access setting
      if (config.public === true) {
        spinner.text = 'Setting public access...';
        const publicCommand = `yc serverless function allow-unauthenticated-invoke --name=${functionName} --folder-id=${process.env.YC_FOLDER_ID}`;
        execCommand(publicCommand, { silent: true });
      } else if (config.public === false) {
        spinner.text = 'Removing public access...';
        const privateCommand = `yc serverless function deny-unauthenticated-invoke --name=${functionName} --folder-id=${process.env.YC_FOLDER_ID}`;
        execCommand(privateCommand, { silent: true });
      }
      
      // Clean up
      fs.removeSync(packagePath);
      
      spinner.succeed(chalk.green('Function published successfully!'));
      
    } catch (error) {
      spinner.fail(chalk.red('Failed to publish function'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Delete command
program
  .command('delete')
  .description('Delete function from Yandex Cloud')
  .option('-f, --force', 'Force delete without confirmation')
  .action(async (options) => {
    try {
      validateEnv();
      const config = loadConfig();
      const functionName = getFunctionName(config);
      
      if (!options.force) {
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
          rl.question(chalk.yellow(`Are you sure you want to delete function "${functionName}"? (y/N): `), resolve);
        });
        
        rl.close();
        
        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
          console.log(chalk.blue('Operation cancelled'));
          return;
        }
      }
      
      const spinner = ora('Deleting function...').start();
      
      const ycCommand = `yc serverless function delete --name=${functionName} --folder-id=${process.env.YC_FOLDER_ID}`;
      execCommand(ycCommand, { silent: true });
      
      spinner.succeed(chalk.green('Function deleted successfully!'));
      
    } catch (error) {
      console.error(chalk.red('Failed to delete function'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Check command
program
  .command('check')
  .description('Get information about the function')
  .action(async () => {
    try {
      validateEnv();
      const config = loadConfig();
      const functionName = getFunctionName(config);
      
      const spinner = ora('Getting function information...').start();
      
      const ycCommand = `yc serverless function get --name=${functionName} --folder-id=${process.env.YC_FOLDER_ID}`;
      const result = execCommand(ycCommand, { silent: true });
      
      spinner.stop();
      
      console.log(chalk.blue('Function Information:'));
      console.log(result);
      
    } catch (error) {
      console.error(chalk.red('Failed to get function information'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Create command
program
  .command('create')
  .description('Create a new Yandex Cloud Function project from template')
  .option('-n, --name <name>', 'Function name (will prompt if not provided)')
  .action(async (options) => {
    try {
      const { execSync } = require('child_process');
      const path = require('path');
      
      console.log(chalk.blue('🚀 Creating new Yandex Cloud Function project...'));
      
      // Check if lekalo is available
      try {
        execSync('npx lekalo --version', { stdio: 'pipe' });
      } catch (error) {
        console.log(chalk.yellow('Installing lekalo...'));
        execSync('npm install lekalo', { stdio: 'inherit' });
      }
      
      // Remove existing package files before generation
      const fs = require('fs-extra');
      const filesToRemove = ['package.json', 'package-lock.json'];
      
      console.log(chalk.yellow('🧹 Cleaning up existing files...'));
      filesToRemove.forEach(file => {
        if (fs.existsSync(file)) {
          fs.removeSync(file);
          console.log(chalk.gray(`   Removed ${file}`));
        }
      });
      
      // Copy template file to current directory
      const templatePath = path.join(__dirname, '.lekalo_templates.yml');
      fs.copyFileSync(templatePath, '.lekalo_templates.yml');
      
      // Build lekalo command
      let lekaloCommand = 'npx lekalo gen template-yc-function';
      
      if (options.name) {
        lekaloCommand += ` name=${options.name}`;
      }
      
      console.log(chalk.blue('📁 Generating project structure...'));
      
      // Execute lekalo command
      execSync(lekaloCommand, { stdio: 'inherit' });
      
      // Remove node_modules and template file after generation
      console.log(chalk.yellow('🧹 Cleaning up temporary files...'));
      if (fs.existsSync('node_modules')) {
        fs.removeSync('node_modules');
        console.log(chalk.gray('   Removed node_modules'));
      }
      if (fs.existsSync('.lekalo_templates.yml')) {
        fs.removeSync('.lekalo_templates.yml');
        console.log(chalk.gray('   Removed .lekalo_templates.yml'));
      }
      
      console.log(chalk.green('✅ Project created successfully!'));
      console.log(chalk.blue('\n📋 Next steps:'));
      console.log(chalk.white('1. Create .env file with your YC_FOLDER_ID:'));
      console.log(chalk.gray('   echo "YC_FOLDER_ID=your_folder_id" > .env'));
      console.log(chalk.white('2. Deploy your function:'));
      console.log(chalk.gray('   npx ycnf public'));
      console.log(chalk.white('3. Check function status:'));
      console.log(chalk.gray('   npx ycnf check'));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to create project'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
