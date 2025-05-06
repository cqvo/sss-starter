import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        // Filtering out messages from third-party libs
        onConsoleLog(log: string, type: 'stdout' | 'stderr'): boolean | void {
            return !(log === 'message from third party library' && type === 'stdout')
        },
    },
});