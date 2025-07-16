#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// Get the app's user data directory
const userDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'minimal-journal');
const securityConfigPath = path.join(userDataPath, 'security.json');

console.log('Resetting password protection...');
console.log('Security config path:', securityConfigPath);

// Check if security.json exists
if (fs.existsSync(securityConfigPath)) {
  console.log('Found existing security.json file');
  
  // Read current config
  try {
    const config = JSON.parse(fs.readFileSync(securityConfigPath, 'utf8'));
    console.log('Current config:', config);
    
    // Disable password protection
    config.passwordProtectionEnabled = false;
    
    // Save updated config
    fs.writeFileSync(securityConfigPath, JSON.stringify(config, null, 2), 'utf8');
    console.log('Password protection disabled successfully!');
    
  } catch (error) {
    console.error('Error reading/writing security config:', error);
    
    // Create new config with protection disabled
    const newConfig = {
      passwordProtectionEnabled: false
    };
    
    fs.writeFileSync(securityConfigPath, JSON.stringify(newConfig, null, 2), 'utf8');
    console.log('Created new security config with password protection disabled');
  }
} else {
  console.log('No security.json file found');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
    console.log('Created user data directory');
  }
  
  // Create new config with protection disabled
  const newConfig = {
    passwordProtectionEnabled: false
  };
  
  fs.writeFileSync(securityConfigPath, JSON.stringify(newConfig, null, 2), 'utf8');
  console.log('Created new security config with password protection disabled');
}

console.log('Password reset complete. You can now run the app without a password prompt.');