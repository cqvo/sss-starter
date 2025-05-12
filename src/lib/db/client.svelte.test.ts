import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres, { type Sql } from 'postgres';
import { DATABASE_URL } from '$env/static/private';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

describe('Database Client Integration Tests', () => {
	let db: PostgresJsDatabase;
	let client: Sql;

	beforeAll(() => {
		if (!DATABASE_URL) {
			throw new Error('DATABASE_URL environment variable required for integration tests');
		}
		client = postgres(DATABASE_URL, { prepare: false, debug: true });
		db = drizzle(client);
	});

	afterAll(async () => {
		if (client) {
			await client.end();
		}
	})

	it('should connect to the database directly', async () => {
		try {
			const result = await client`SELECT 1 AS connected`;
			console.log('Postgres client:', result);
			expect(result).toBeDefined();
			expect(result.length).toBe(1);
		} catch (e) {
			console.error('Connection error:', e);
			throw e;
		}
	});

	it('should connect using drizzle', async () => {
		const result = await db.execute(sql`SELECT 1 AS connected`);
		console.log('Drizzle client:', result);
		expect(result).toBeDefined();
		expect(result.length).toBe(1);
	});

	it('should handle errors gracefully', async () => {
		try {
			// @ts-ignore
			await db.select().from('not_real_table');
			// should not get to this point
			expect(true).toBe(false);
		} catch (e) {
			expect(e).toBeDefined();
		}
	});

	it('should support transactions with Drizzle', async () => {
		// Create a temporary table outside the transaction
		await db.execute(sql`CREATE TEMPORARY TABLE IF NOT EXISTS temp_table (id SERIAL PRIMARY KEY, name TEXT)`);
		await db.execute(sql`DELETE FROM temp_table`); // Ensure it's empty

		// Start a Drizzle transaction
		let committed = false;

		await db.transaction(async (tx) => {
			// Insert data using Drizzle
			await tx.execute(sql`INSERT INTO temp_table (name) VALUES ('test')`);

			// Verify data was inserted within the transaction
			const result = await tx.execute(sql`SELECT * FROM temp_table`);
			expect(result).toBeDefined();
			expect(result.length).toBe(1);

			// Explicitly tell Drizzle to roll back the transaction instead of committing
			tx.rollback();
		}).catch(e => {
			// Transaction was rolled back (this is expected)
			committed = false;
		});

		// After rollback, the table should be empty
		const afterRollback = await db.execute(sql`SELECT * FROM temp_table`);
		expect(afterRollback.length).toBe(0);
	});
});