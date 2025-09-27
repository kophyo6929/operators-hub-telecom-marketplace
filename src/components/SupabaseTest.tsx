import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { testSupabaseConnection, testSupabaseAuth, listTables } from '@/utils/test-supabase-connection';

export default function SupabaseTest() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setResults(null);

    try {
      const connectionTest = await testSupabaseConnection();
      const authTest = await testSupabaseAuth();
      const tablesTest = await listTables();

      setResults({
        connection: connectionTest,
        auth: authTest,
        tables: tablesTest
      });
    } catch (error) {
      setResults({
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold">Supabase Connection Test</h2>
      
      <Button onClick={runTests} disabled={loading}>
        {loading ? 'Testing...' : 'Run Connection Tests'}
      </Button>
      
      {results &&
      <div className="space-y-4">
          {results.error ?
        <Alert variant="destructive">
              <AlertDescription>
                Test Error: {results.error}
              </AlertDescription>
            </Alert> :

        <>
              <Alert variant={results.connection?.success ? "default" : "destructive"}>
                <AlertDescription>
                  <strong>Connection Test:</strong> {results.connection?.success ? 'Success' : 'Failed'}
                  {results.connection?.error &&
              <div className="mt-2">Error: {results.connection.error}</div>
              }
                </AlertDescription>
              </Alert>
              
              <Alert>
                <AlertDescription>
                  <strong>Auth Session:</strong> {results.auth ? 'Active session found' : 'No active session'}
                </AlertDescription>
              </Alert>
              
              <Alert>
                <AlertDescription>
                  <strong>Tables Status:</strong>
                  <pre className="mt-2 text-sm">
                    {JSON.stringify(results.tables, null, 2)}
                  </pre>
                </AlertDescription>
              </Alert>
            </>
        }
        </div>
      }
    </div>);

}