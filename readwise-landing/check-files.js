const fs = require('fs');
const path = require('path');

console.log('🔍 CHECKING YOUR READWISE PROJECT\n');

// Check current directory
console.log(`Current directory: ${process.cwd()}\n`);

// List of all components we need
const components = [
  'Header.js', 'Hero.js', 'Problem.js', 'Solution.js', 
  'HowItWorks.js', 'Features.js', 'Testimonials.js', 
  'Pricing.js', 'WaitlistForm.js', 'Footer.js'
];

// Check components folder
console.log('📁 CHECKING COMPONENTS FOLDER:');
console.log('----------------------------');

const componentsPath = path.join(process.cwd(), 'components');

if (fs.existsSync(componentsPath)) {
  console.log('✅ components folder exists\n');
  
  // Check each component
  components.forEach(file => {
    const filePath = path.join(componentsPath, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
      
      // Read file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for "use client"
      if (content.includes('"use client"') || content.includes("'use client'")) {
        console.log(`   ✅ Has "use client" directive`);
      } else {
        console.log(`   ❌ MISSING "use client" directive - ADD THIS!`);
      }
      
      // Check first few lines for any issues
      const firstLine = content.split('\n')[0].trim();
      if (firstLine.includes('import')) {
        console.log(`   ⚠️ First line is import - "use client" should be FIRST`);
      }
    } else {
      console.log(`❌ ${file} MISSING!`);
    }
  });
} else {
  console.log('❌ components folder NOT FOUND!');
}

// Check app/page.js
console.log('\n📁 CHECKING APP/PAGE.JS:');
console.log('------------------------');

const pagePath = path.join(process.cwd(), 'app', 'page.js');
if (fs.existsSync(pagePath)) {
  console.log('✅ app/page.js exists');
  
  const pageContent = fs.readFileSync(pagePath, 'utf8');
  
  // Check imports
  if (pageContent.includes('@/components/')) {
    console.log('❌ Using @/components/ imports - CHANGE TO relative paths!');
    console.log('   Fix: Change "@/components/Header" to "../components/Header"');
  } else if (pageContent.includes('../components/')) {
    console.log('✅ Using correct relative paths');
  }
} else {
  console.log('❌ app/page.js MISSING!');
}

// Check package.json
console.log('\n📁 CHECKING PACKAGE.JSON:');
console.log('-------------------------');

const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  console.log('✅ package.json exists');
  
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log(`   Next.js version: ${packageContent.dependencies.next || 'NOT FOUND!'}`);
} else {
  console.log('❌ package.json MISSING!');
}

console.log('\n🔧 RECOMMENDED FIXES:');
console.log('1. Add "use client" to any component missing it');
console.log('2. Change @/components/ imports to ../components/ in app/page.js');
console.log('3. Run: npm install (if node_modules missing)');
console.log('4. Run: npm run dev\n');