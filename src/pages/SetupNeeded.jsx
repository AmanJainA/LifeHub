export default function SetupNeeded() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl p-6 sm:p-8">
        <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-4 text-lg">⚠️</div>
        <h1 className="font-display text-xl font-semibold mb-2">Supabase isn't configured yet</h1>
        <p className="text-sm text-muted mb-5">
          LifeHub can't connect to your database because <code className="text-accent">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-accent">VITE_SUPABASE_ANON_KEY</code> aren't set. That's why you saw a blank page —
          fix these two steps and reload.
        </p>

        <ol className="space-y-4 text-sm">
          <li>
            <p className="font-medium mb-1">1. Create your .env file</p>
            <p className="text-muted mb-1">In the project root, run:</p>
            <pre className="bg-surface-2 border border-border rounded-lg p-2.5 text-xs overflow-x-auto">cp .env.example .env</pre>
          </li>
          <li>
            <p className="font-medium mb-1">2. Add your Supabase keys</p>
            <p className="text-muted mb-1">
              Get them from{' '}
              <span className="text-accent">Project Settings → API</span> in your Supabase dashboard, then paste
              into <code className="text-accent">.env</code>:
            </p>
            <pre className="bg-surface-2 border border-border rounded-lg p-2.5 text-xs overflow-x-auto whitespace-pre-wrap">{`VITE_SUPABASE_URL=https://ixjdjvkktlzgiyojnsto.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon public key>`}</pre>
          </li>
          <li>
            <p className="font-medium mb-1">3. Restart the dev server</p>
            <p className="text-muted">
              Vite only reads <code className="text-accent">.env</code> on startup — stop the server (Ctrl+C) and run{' '}
              <code className="text-accent">npm run dev</code> again.
            </p>
          </li>
        </ol>

        <p className="text-xs text-muted mt-6 pt-4 border-t border-border">
          Also make sure you've run <code className="text-accent">supabase/schema.sql</code> in your Supabase SQL
          Editor at least once — see the README for the full checklist.
        </p>
      </div>
    </div>
  )
}
