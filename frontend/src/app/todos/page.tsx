import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

interface Todo {
  id: string | number;
  name: string;
}

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  let todos: Todo[] = [];
  let errorMsg: string | null = null;

  try {
    const { data, error } = await supabase.from('todos').select();
    if (error) {
      errorMsg = error.message;
    } else {
      todos = (data as Todo[]) || [];
    }
  } catch (err: unknown) {
    errorMsg = err instanceof Error ? err.message : 'Failed to fetch todos';
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
