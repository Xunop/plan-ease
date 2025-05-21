/**
 * Debounces an asynchronous function, ensuring all calls within the wait period
 * share the same promise for the result.
 *
 * When the debounced function is called, it returns a promise. If other calls
 * are made within the `wait` period, they will receive the *same* promise.
 * The actual async function `fn` is only called once after the `wait` period
 * has elapsed since the last call, using the arguments from the very last call.
 *
 * @param fn The asynchronous function to debounce. It must return a Promise.
 * @param wait The debounce delay in milliseconds.
 * @returns A new function that, when invoked, will delay the execution of `fn`
 * and return a shared Promise for its eventual result.
 */
export function debounceAsyncSharedPromise<Args extends any[], R>(
  fn: (...args: Args) => Promise<R>,
  wait: number
): (...args: Args) => Promise<R> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: Args | null = null;

  // To store the shared promise and its resolve/reject functions
  interface PromiseCache {
    promise: Promise<R>;
    resolve: (value: R | PromiseLike<R>) => void;
    reject: (reason?: any) => void;
  }
  let activePromiseCache: PromiseCache | null = null;

  return (...args: Args): Promise<R> => {
    latestArgs = args; // Capture the latest arguments

    if (timer) {
      clearTimeout(timer); // Reset the timer on each call
    }

    // If there's no active promise (e.g., first call in a series, or previous one completed)
    if (!activePromiseCache) {
      let resolveFn!: (value: R | PromiseLike<R>) => void;
      let rejectFn!: (reason?: any) => void;

      const newPromise = new Promise<R>((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;
      });

      activePromiseCache = {
        promise: newPromise,
        resolve: resolveFn,
        reject: rejectFn,
      };
    }

    timer = setTimeout(async () => {
      // Ensure latestArgs and activePromiseCache are available
      if (latestArgs && activePromiseCache) {
        const currentArgs = latestArgs; // Use args from the last call in this debounced window
        const cacheToSettle = activePromiseCache;

        // Reset for the next debounce cycle *before* calling fn.
        // This means if fn itself calls the debounced function, it starts a new cycle.
        // Or, more simply, reset after fn completes in the finally block.
        // Let's stick to resetting in finally for clarity that this cycle is truly over.

        try {
          const result = await fn(...currentArgs);
          cacheToSettle.resolve(result);
        } catch (err) {
          cacheToSettle.reject(err);
        } finally {
          // After the promise is settled (resolved or rejected),
          // clear the cache so the next call starts a fresh debounce cycle.
          activePromiseCache = null;
          timer = null;
          latestArgs = null;
        }
      }
    }, wait);

    return activePromiseCache.promise; // Return the same promise to all callers in this debounce cycle
  };
}
