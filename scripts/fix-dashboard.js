const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '../frontend/src/pages/client/Dashboard.jsx');

console.log('Fixing Dashboard.jsx property access errors...\n');

// Read the file
let content = fs.readFileSync(dashboardPath, 'utf8');

// Track changes
let changesMade = 0;

// Fix 1: ticket.createdAt -> ticket.created_at
if (content.includes('ticket.createdAt')) {
    content = content.replace(/ticket\.createdAt/g, 'ticket.created_at');
    console.log('✓ Fixed: ticket.createdAt -> ticket.created_at');
    changesMade++;
}

// Fix 2: ticket.priority without null check
// Find the line with priority and add null check
const priorityPattern = /Prioridade: \{ticket\.priority\.charAt\(0\)\.toUpperCase\(\) \+ ticket\.priority\.slice\(1\)\}/g;
if (content.match(priorityPattern)) {
    content = content.replace(
        priorityPattern,
        '{ticket.priority && `Prioridade: ${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}`}'
    );
    console.log('✓ Fixed: Added null check for ticket.priority');
    changesMade++;
}

// Fix 3: ticket.device.type -> ticket.device_type (and similar)
const devicePattern = /\{`\$\{ticket\.device\.type\} \$\{ticket\.device\.brand\} \$\{ticket\.device\.model\}`\}/g;
if (content.match(devicePattern)) {
    // Replace the entire Chip component with device info
    content = content.replace(
        /<Box sx=\{\{ mt: 2 \}\}>\s*<Chip\s+label=\{`\$\{ticket\.device\.type\} \$\{ticket\.device\.brand\} \$\{ticket\.device\.model\}`\}\s+size="small"\s+variant="outlined"\s+\/>\s*<\/Box>/gs,
        `{(ticket.device_type || ticket.device_brand || ticket.device_model) && (
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      label={\`\${ticket.device_type || ''} \${ticket.device_brand || ''} \${ticket.device_model || ''}\`.trim()} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                )}`
    );
    console.log('✓ Fixed: ticket.device.* -> ticket.device_* with null checks');
    changesMade++;
}

// Fix 4: Update the date line to remove the bullet if priority is null
const dateLinePattern = /\{new Date\(ticket\.created_at\)\.toLocaleDateString\('pt-BR'\)\} • \s*\{ticket\.priority/g;
if (content.match(dateLinePattern)) {
    content = content.replace(
        dateLinePattern,
        '{new Date(ticket.created_at).toLocaleDateString(\'pt-BR\')}\n                  {ticket.priority'
    );
    console.log('✓ Fixed: Removed hardcoded bullet before priority');
    changesMade++;
}

// Write the fixed content back
fs.writeFileSync(dashboardPath, content, 'utf8');

console.log(`\n✅ Dashboard.jsx fixed successfully! (${changesMade} changes made)`);
console.log('\nYou can now refresh the browser to see the fixes applied.');
