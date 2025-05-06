# Project Overview

This is a starter monorepo project framework intended for hosting on Vercel and built on the following:

- SvelteKit and Svelte 5
- shadcn-svelte UI components
- Supabase for database and auth
- Drizzle ORM
- Supabase edge functions
- Vercel edge functions

# Structure

## Directories



## Edge Functions

On page load, `+page.server.ts` fetches the required data from the appropriate **edge function**.

```
// +page.server.ts
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ fetch }) => {
	const response = await fetch('/api/getUsers');
	const users = await response.json();
	return { users };
}
```

For a Vercel edge function:

```
// apps/functions/api/getUsers.js
import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/supabase-js';
import { users } from '@resoom/database/schema';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Drizzle
const db = drizzle(supabase);

export default async function handler(req) {
  try {
    // Query your database using Drizzle
    const result = await db.select().from(users);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Specify that this should run at the edge
export const config = {
  runtime: 'edge'
};
```

# Test-Driven Development

Make use of **dependency injection** for easier mocking, and thus, testing.

## Drizzle ORM

Every Drizzle driver now has a built-in API for mocks:

```
import { drizzle } from 'drizzle-orm/postgres-js';
const db = drizzle.mock();
```

Can also import a Drizzle schema for types:

```
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
const db = drizzle.mock({ schema });
```

## Supabase

There is a [mock HTTP client](https://github.com/supabase-community/mock_supabase_http_client) available.

# UI

Since **shadcn/ui** doesn't officially support Svelte, we can instead make use of **shadcn-svelte**.