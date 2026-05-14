// node-demo.js - Node.js Core Modules Demonstration (WAD Syllabus Requirement)
// This file demonstrates the use of built-in Node.js core modules

const http = require('http');       // HTTP module - create web servers
const os = require('os');           // OS module - system info
const path = require('path');       // Path module - file paths
const fs = require('fs');           // File System module
const events = require('events');   // Events module - event-driven programming
const crypto = require('crypto');   // Crypto module - hashing/encryption

console.log('\n═══════════════════════════════════════════');
console.log('   Node.js Core Modules Demo - EduTrack');
console.log('═══════════════════════════════════════════\n');

// ──────────────────────────────────────────
// 1. OS MODULE - System Information
// ──────────────────────────────────────────
console.log('📟 OS Module - System Information:');
console.log('  Platform:', os.platform());
console.log('  Architecture:', os.arch());
console.log('  Hostname:', os.hostname());
console.log('  Total RAM:', (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB');
console.log('  Free RAM:', (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB');
console.log('  CPUs:', os.cpus().length, 'cores');
console.log('  Home Dir:', os.homedir());
console.log('  Uptime:', Math.round(os.uptime() / 3600) + ' hours\n');

// ──────────────────────────────────────────
// 2. PATH MODULE - File Path Operations
// ──────────────────────────────────────────
console.log('📁 Path Module - File Path Operations:');
const samplePath = '/home/edutrack/uploads/notes/lecture1.pdf';
console.log('  Base name:', path.basename(samplePath));
console.log('  Directory:', path.dirname(samplePath));
console.log('  Extension:', path.extname(samplePath));
console.log('  Joined path:', path.join('/uploads', 'notes', 'lecture.pdf'));
console.log('  Resolved path:', path.resolve('uploads', 'notes'));
console.log('  Is absolute:', path.isAbsolute(samplePath));
console.log();

// ──────────────────────────────────────────
// 3. EVENTS MODULE - Event Emitter Pattern
// ──────────────────────────────────────────
console.log('⚡ Events Module - Event Emitter Pattern:');

class EduTrackEvents extends events.EventEmitter {}
const eduEvents = new EduTrackEvents();

// Register event listeners
eduEvents.on('studentLogin', (student) => {
  console.log(`  ✅ Student logged in: ${student.name} at ${new Date().toLocaleTimeString()}`);
});

eduEvents.on('assignmentSubmitted', (data) => {
  console.log(`  📝 Assignment submitted: ${data.assignmentName} by ${data.studentName}`);
});

eduEvents.on('lowAttendance', (student) => {
  console.warn(`  ⚠️ Low attendance alert for: ${student.name} (${student.percentage}%)`);
});

// Emit events (simulate real usage)
eduEvents.emit('studentLogin', { name: 'Rahul Sharma', id: 1001 });
eduEvents.emit('assignmentSubmitted', { assignmentName: 'Web Dev Lab 3', studentName: 'Priya Patel' });
eduEvents.emit('lowAttendance', { name: 'Amit Kumar', percentage: 62 });
console.log();

// ──────────────────────────────────────────
// 4. FS MODULE - File System Operations
// ──────────────────────────────────────────
console.log('💾 FS Module - File System Operations:');

// Write a sample log file (async using promises - ES6 feature)
const logContent = `EduTrack System Log
Generated: ${new Date().toISOString()}
Platform: ${os.platform()}
Node Version: ${process.version}
Memory: ${(os.freemem() / 1024 / 1024).toFixed(0)} MB free
`;

fs.writeFile('system.log', logContent, (err) => {
  if (err) { console.error('  ❌ Log write error:', err); return; }
  console.log('  ✅ system.log written successfully');
  
  // Read back the file
  fs.readFile('system.log', 'utf8', (err, data) => {
    if (err) return;
    console.log('  ✅ system.log read successfully (' + data.length + ' bytes)');
    
    // Append to log
    fs.appendFile('system.log', `\nLast read: ${new Date().toISOString()}\n`, () => {
      console.log('  ✅ system.log appended successfully');
    });
  });
});

// Check if uploads directory exists
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log('  ✅ Created uploads directory');
} else {
  console.log('  ✅ Uploads directory exists:', uploadPath);
}
console.log();

// ──────────────────────────────────────────
// 5. CRYPTO MODULE - Hashing (for security)
// ──────────────────────────────────────────
console.log('🔐 Crypto Module - Security Hashing:');
const password = 'student123';
const hash = crypto.createHash('sha256').update(password).digest('hex');
console.log('  Original password:', password);
console.log('  SHA-256 Hash:', hash);

const hmac = crypto.createHmac('sha256', 'edutrack-secret-key').update('user-data').digest('hex');
console.log('  HMAC Token:', hmac.substring(0, 32) + '...\n');

// ──────────────────────────────────────────
// 6. HTTP MODULE - Simple HTTP Server Demo
// ──────────────────────────────────────────
console.log('🌐 HTTP Module - Simple Server Demo:');

const demoServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  
  const response = {
    app: 'EduTrack',
    version: '1.0.0',
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    system: {
      platform: os.platform(),
      nodeVersion: process.version,
      memory: `${(os.freemem() / 1024 / 1024).toFixed(0)} MB free`
    }
  };
  
  res.end(JSON.stringify(response, null, 2));
});

// Start demo server on port 3333
demoServer.listen(3333, () => {
  console.log('  ✅ Demo HTTP server running on http://localhost:3333');
  console.log('  Visit the URL to see system info in JSON format\n');
  
  // Auto-close after 5 seconds (demo mode)
  setTimeout(() => {
    demoServer.close(() => {
      console.log('  ✅ Demo server stopped after 5 seconds');
    });
  }, 5000);
});

// ──────────────────────────────────────────
// 7. PROCESS MODULE - Process Information
// ──────────────────────────────────────────
console.log('⚙️ Process Module - Runtime Information:');
console.log('  PID:', process.pid);
console.log('  Node Version:', process.version);
console.log('  Environment:', process.env.NODE_ENV || 'not set');
console.log('  Memory Usage:', JSON.stringify({
  heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
  heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`
}));

console.log('\n═══════════════════════════════════════════');
console.log('   Core Modules Demo Complete!');
console.log('═══════════════════════════════════════════\n');
