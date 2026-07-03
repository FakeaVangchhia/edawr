import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  let todos: any[] = [];
  let errorMsg: string | null = null;

  try {
    const { data, error } = await supabase.from('todos').select();
    if (error) {
      errorMsg = error.message;
    } else {
      todos = data || [];
    }
  } catch (err: any) {
    errorMsg = err?.message || 'Failed to fetch todos';
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Supabase Todos Test Page</h1>
      {errorMsg ? (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          Error: {errorMsg}
        </div>
      ) : (
        <ul>
          {todos.map((todo) => (
            <li key={todo.id}>{todo.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
