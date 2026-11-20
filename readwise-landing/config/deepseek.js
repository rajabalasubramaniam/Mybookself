// DeepSeek API Configuration
// Store your API key in an environment variable for security

const deepseekConfig = {
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  timeout: 30000,
};

// Validate API key on module load
if (!deepseekConfig.apiKey) {
  console.warn(
    'Warning: DEEPSEEK_API_KEY environment variable is not set. ' +
    'DeepSeek integration will not work until the API key is configured.'
  );
}

module.exports = deepseekConfig;
