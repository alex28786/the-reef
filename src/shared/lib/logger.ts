type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

const levelOrder: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    silent: 50,
}

const defaultLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'warn'
const configuredLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined) ?? defaultLevel

function shouldLog(level: LogLevel) {
    return levelOrder[level] >= levelOrder[configuredLevel]
}

export const logger = {
    debug: (...args: unknown[]) => {
        if (shouldLog('debug')) {
            console.debug(...args)
        }
    },
    info: (...args: unknown[]) => {
        if (shouldLog('info')) {
            console.info(...args)
        }
    },
    warn: (...args: unknown[]) => {
        if (shouldLog('warn')) {
            console.warn(...args)
        }
    },
    error: (...args: unknown[]) => {
        if (shouldLog('error')) {
            console.error(...args)
        }
    },
}
