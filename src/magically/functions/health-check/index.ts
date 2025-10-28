// TODO: This function is not deployed yet. This is a starter template.
// In order to deploy, make changes using the editFile tool and it will be auto deployed.
// Note: Logs arrive ~2 minutes later in getFunctionLogs.

interface Env {
  MAGICALLY_PROJECT_ID: string;
  MAGICALLY_API_BASE_URL: string;
  MAGICALLY_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      // CRITICAL PATTERN: Authenticate user from JWT token
      // This extracts JWT from Authorization header
      const authResponse = await fetch(`${env.MAGICALLY_API_BASE_URL}/auth/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
          'X-Project-ID': env.MAGICALLY_PROJECT_ID,
        },
      });

      let user = null;
      if (authResponse.ok) {
        const authData = await authResponse.json();
        user = authData.user;
      }
      
      if (!user) {
        return new Response(JSON.stringify({ 
          status: 'healthy',
          authenticated: false,
          message: 'No authentication provided'
        }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // User authenticated successfully
      console.log('Authenticated user:', user._id);

      // Now you can perform user-specific operations
      
      // Example 1: Check user data
      // const userData = await sdk.data.query('user_profiles', {
      //   userId: user._id
      // }, { limit: 1 });
      
      // Example 2: Use LLM in edge function
      // const aiResponse = await sdk.llm.invoke(
      //   "Generate a welcome message",
      //   { model: "openai/gpt-4o-mini" }
      // );
      
      // Example 3: List user's files
      // const userFiles = await sdk.files.list({
      //   limit: 10,
      //   tags: ['profile-images']
      // });

      return new Response(JSON.stringify({ 
        status: 'healthy',
        authenticated: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        }
        // hasProfile: userData.data.length > 0
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error: any) {
      return new Response(JSON.stringify({ 
        status: 'error',
        message: error.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};