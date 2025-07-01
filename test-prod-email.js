// Simple script to test production email configuration
// Run this with: node test-prod-email.js <your-production-url>

const url = process.argv[2] || 'https://your-app.vercel.app';

console.log('🧪 Testing Production Email Configuration...\n');

async function testEndpoints() {
  try {
    console.log('📡 Testing health endpoint...');
    const healthResponse = await fetch(`${url}/api/health`);
    const healthData = await healthResponse.json();
    
    console.log('\n📊 Health Status:');
    console.log(`- Status: ${healthData.status}`);
    console.log(`- Email Status: ${healthData.email?.status || 'unknown'}`);
    console.log(`- RESEND_API_KEY: ${healthData.environment?.RESEND_API_KEY || 'missing'}`);
    
    if (healthData.warnings?.length > 0) {
      console.log('\n⚠️  Warnings:');
      healthData.warnings.forEach(warning => console.log(`- ${warning}`));
    }
    
    console.log('\n📧 Testing email configuration...');
    const testEmailResponse = await fetch(`${url}/api/test-email`);
    const testEmailData = await testEmailResponse.json();
    
    console.log('\n📋 Email Configuration:');
    console.log(`- Status: ${testEmailData.status}`);
    console.log(`- From Email: ${testEmailData.configuration?.fromEmail || 'not set'}`);
    console.log(`- Admin Email: ${testEmailData.configuration?.adminEmail || 'not set'}`);
    
    if (testEmailData.status === 'configured') {
      console.log('\n✅ Email service is properly configured!');
    } else {
      console.log('\n❌ Email service needs configuration:');
      console.log(testEmailData.message);
    }
    
  } catch (error) {
    console.error('\n❌ Error testing endpoints:', error.message);
    console.log('\nMake sure the URL is correct and the server is running.');
  }
}

if (!url.startsWith('http')) {
  console.log('❌ Please provide a valid URL');
  console.log('Usage: node test-prod-email.js https://your-app.vercel.app');
  process.exit(1);
}

testEndpoints(); 