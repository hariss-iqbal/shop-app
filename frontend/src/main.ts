import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';
import { validateEnvironment } from './environments/environment.validator';

// Validate environment configuration before bootstrapping
try {
  validateEnvironment(environment);
} catch (error) {
  // In development, show a more helpful message
  if (!environment.production) {
    document.body.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #d32f2f;">Environment Configuration Required</h1>
        <p>The application cannot start because the environment is not configured.</p>
        <h2>Setup Instructions:</h2>
        <ol>
          <li>Copy <code>src/environments/environment.example.ts</code> to <code>src/environments/environment.ts</code></li>
          <li>Open your Supabase project dashboard</li>
          <li>Go to <strong>Settings → API</strong></li>
          <li>Copy the <strong>Project URL</strong> to <code>supabase.url</code></li>
          <li>Copy the <strong>anon public</strong> key to <code>supabase.anonKey</code></li>
          <li>Restart the development server</li>
        </ol>
        <p style="color: #666; font-size: 0.9em;">
          <strong>Note:</strong> Never use the service_role key in client-side code.
        </p>
      </div>
    `;
    throw error;
  }
  // In production, just throw the error
  throw error;
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
