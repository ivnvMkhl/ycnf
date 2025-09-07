const fs = require('fs');

console.log('Validating package.json...');

try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check required fields
  const required = ['name', 'version', 'description', 'main', 'bin'];
  const missing = required.filter(field => !pkg[field]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required fields:', missing.join(', '));
    process.exit(1);
  }
  
  // Check bin field
  if (!pkg.bin || !pkg.bin.ycnf) {
    console.error('❌ Missing or invalid bin field');
    process.exit(1);
  }
  
  // Check CLI file exists
  if (!fs.existsSync('cli.js')) {
    console.error('❌ CLI file cli.js not found');
    process.exit(1);
  }
  
  console.log('✅ Package.json validation passed');
  console.log('✅ CLI file exists');
  console.log('✅ All validations passed');
  
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}
