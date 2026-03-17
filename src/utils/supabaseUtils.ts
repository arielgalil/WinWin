/**
 * Executes a Supabase query with a timeout.
 * Returns a tuple [data, error] similar to the old Supabase syntax.
 */
export async function withTimeout<T>(
    promise: PromiseLike<{ data: T | null; error: any }>,
    timeoutMs: number = 10000
): Promise<{ data: T | null; error: any }> {
    const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Connection Timeout')), timeoutMs)
    );

    try {
        const result = await Promise.race([promise, timeoutPromise]);
        return result as { data: T | null; error: any };
    } catch (err: any) {
        return { data: null, error: err };
    }
}

/**
 * Simple timeout wrapper for any promise
 */
export async function promiseTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 10000
): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    );
    return Promise.race([promise, timeoutPromise]);
}
