export class CronHelper {
    /**
     * Parses a cron string into next valid date.
     * Supports standard 5-part cron: "min hour day month weekday"
     * Also supports aliases: "daily", "weekly"
     */
    static getNextOccurrence(expression: string, fromDate: number = Date.now()): number | null {
        try {
            const expr = this.normalizeExpression(expression);
            if (!expr) return null;

            const now = new Date(fromDate);
            // Start searching from the next full minute
            // This ensures we don't accidentally skip a match if fromDate is late in the minute
            // e.g. 12:04:59 -> Start search at 12:05:00
            let search = new Date(now.getTime());
            search.setSeconds(0, 0);
            search.setMinutes(search.getMinutes() + 1);

            // Safety limit (e.g. look ahead 1 year max)
            const limit = new Date(search.getTime());
            limit.setFullYear(limit.getFullYear() + 1);

            while (search < limit) {
                if (this.matches(expr, search)) {
                    return search.getTime();
                }
                // Optimization: increment by minute
                // (Real cron parsers are smarter, but this is sufficient for 'lightweight')
                search.setMinutes(search.getMinutes() + 1);
            }
            return null;
        } catch (e) {
            console.error('Cron Parse Error', e);
            return null;
        }
    }

    /**
     * Counts how many scheduled occurrences happened strictly between start (exclusive) and end (inclusive).
     * Used for streak verification.
     */
    static getOccurrencesBetween(expression: string, start: number, end: number): number {
        let count = 0;
        let current = start;

        // Safety Break (max 100 missed events to prevent infinite loops)
        const MAX_LOOPS = 100;

        while (current < end && count < MAX_LOOPS) {
            const next = this.getNextOccurrence(expression, current);
            if (!next || next > end) {
                break;
            }
            count++;
            current = next;
        }
        return count;
    }

    private static normalizeExpression(expr: string): string[] | null {
        const lower = expr.toLowerCase().trim();
        if (lower === 'daily') return ['0', '0', '*', '*', '*'];
        if (lower === 'weekly') return ['0', '0', '*', '*', '1']; // Monday default

        const parts = lower.split(/\s+/);
        if (parts.length !== 5) return null;
        return parts;
    }

    private static matches(parts: string[], date: Date): boolean {
        const min = parts[0]!;
        const hour = parts[1]!;
        const day = parts[2]!;
        const month = parts[3]!;
        const weekday = parts[4]!;

        if (!this.checkPart(min, date.getMinutes())) return false;
        if (!this.checkPart(hour, date.getHours())) return false;
        if (!this.checkPart(day, date.getDate())) return false;
        if (!this.checkPart(month, date.getMonth() + 1)) return false;
        if (!this.checkPart(weekday, date.getDay())) return false;

        return true;
    }

    private static checkPart(pattern: string, value: number): boolean {
        if (pattern === '*') return true;

        // List: 1,2,3
        if (pattern.includes(',')) {
            return pattern.split(',').some(p => this.checkPart(p, value));
        }

        // Step: */5
        if (pattern.includes('/')) {
            const split = pattern.split('/');
            const base = split[0];
            const stepStr = split[1];
            if (!base || !stepStr) return false;

            const step = parseInt(stepStr, 10);
            if (base === '*') {
                return value % step === 0;
            }
            if (base.includes('-')) {
                const rangeSplit = base.split('-');
                const startStr = rangeSplit[0];
                const endStr = rangeSplit[1];
                if (!startStr || !endStr) return false;

                const start = parseInt(startStr, 10);
                const end = parseInt(endStr, 10);
                if (value < start || value > end) return false;
                return (value - start) % step === 0;
            }
        }

        // Range: 1-5
        if (pattern.includes('-')) {
            const rangeSplit = pattern.split('-');
            const startStr = rangeSplit[0];
            const endStr = rangeSplit[1];
            if (!startStr || !endStr) return false;

            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            return value >= start && value <= end;
        }

        // Exact match
        return parseInt(pattern, 10) === value;
    }
}
