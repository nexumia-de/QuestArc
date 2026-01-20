import { QuestTaskData, QuestTaskType } from '../types/quest-v2';

/**
 * Extracts XP tag from a title.
 * Example: "Chapter 1 [XP:100]" -> { xp: 100, cleanTitle: "Chapter 1" }
 */
export function parseXpTag(title: string): { xp: number | undefined; cleanTitle: string } {
    const xpRegex = /\[XP:(\d+)\]/i;
    const match = title.match(xpRegex);

    if (match) {
        const xpStr = match[1] || '0';
        const xp = parseInt(xpStr, 10);
        const cleanTitle = title.replace(xpRegex, '').trim();
        return { xp, cleanTitle };
    }

    return { xp: undefined, cleanTitle: title };
}

/**
 * Parses the task title to determine its type and metadata.
 */
export function parseTaskType(title: string): {
    type: QuestTaskType;
    meta: any;
    cleanTitle: string
} {
    // 1. Boss: ⚔️ Name [HP:500]
    // Regex looks for shield/swords emoji (optional range of emojis) or just the structure if emojis vary.
    // Roadmap says: ⚔️ Name [HP:INT]
    const bossRegex = /(?:⚔️|🛡️)\s*(.+?)\s*\[HP:(\d+)\]/u;
    const bossMatch = title.match(bossRegex);
    if (bossMatch) {
        const name = bossMatch[1] || 'Boss';
        const hpStr = bossMatch[2] || '0';
        return {
            type: 'BOSS',
            meta: { hp: parseInt(hpStr, 10) },
            cleanTitle: name.trim()
        };
    }

    // 2. Habit: 3x @daily TaskName OR TaskName 3x @daily
    // Supports:
    // - "3x @daily Task"
    // - "Task 3x @daily"
    // - "daily 2x@daily" (missing space)
    const habitRegex = /(?:^|\s)(\d+)x\s*(@daily|@weekly)(?:\s+|$)|(@daily|@weekly)\s*(\d+)x(?:\s+|$)/i;
    const habitMatch = title.match(habitRegex);

    if (habitMatch) {
        // Groups match depending on order. 
        // G1=Target, G2=Freq (Prefix style)
        // G3=Freq, G4=Target (Suffix/Mix style? - Actually regex above covers specific cases)
        // Let's simplify: Extract logic

        const targetStr = habitMatch[1] || habitMatch[4] || '1';
        const freq = habitMatch[2] || habitMatch[3] || '@daily';

        // Clean Title: Remove the matched part
        let cleanTitle = title.replace(habitMatch[0], '').trim();

        // Check for Streak: [streak:3], streak:3, [s:3], or s:3
        const streakRegex = /(?:\[|\s)(?:streak|s):(\d+)(?:\]|($|\s))/i;
        const streakMatch = cleanTitle.match(streakRegex);
        let streakTarget = undefined;

        if (streakMatch) {
            streakTarget = parseInt(streakMatch[1] || '0', 10);
            cleanTitle = cleanTitle.replace(streakMatch[0], '').trim();
        }

        return {
            type: 'HABIT',
            meta: {
                target: parseInt(targetStr, 10),
                frequency: freq.toLowerCase(),
                streakTarget
            },
            cleanTitle: cleanTitle.replace(/\s+/g, ' ').trim()
        };
    }

    // 3. Grind: 50x TaskName OR TaskName 50x
    // Supports:
    // - "50x Pushups"
    // - "Pushups 50x"
    // - "Multi 3x"
    // Must be careful not to match simple numbers (e.g. "Chapter 1") - needs 'x'
    const grindRegex = /(?:^|\s)(\d+)x(?:\s+|$)/i;
    const grindMatch = title.match(grindRegex);

    if (grindMatch) {
        const targetStr = grindMatch[1] || '1';

        // Clean Title: Remove the matched part "3x"
        const cleanTitle = title.replace(grindMatch[0], '').trim();

        return {
            type: 'GRIND',
            meta: {
                target: parseInt(targetStr, 10)
            },
            cleanTitle: cleanTitle.replace(/\s+/g, ' ').trim()
        };
    }

    // 4. Simple: Default
    return {
        type: 'SIMPLE',
        meta: {},
        cleanTitle: title
    };
}

/**
 * Helper to compile the full QuestTaskData
 */
export function compileTaskData(originalTitle: string): { title: string; data: QuestTaskData } {
    // First check for XP (Parent Task)
    const { xp, cleanTitle: titleWithoutXp } = parseXpTag(originalTitle);

    // Then check for Task Type (Subtasks)
    const { type, meta, cleanTitle } = parseTaskType(titleWithoutXp);

    const data: QuestTaskData = {
        meta: {
            type,
            version: 1,
            originalTitle
        }
    };

    if (xp !== undefined) {
        data.reward = { xp };
    }

    if (type === 'BOSS') {
        data.progress = {
            current: meta.hp,
            target: meta.hp,
            unit: 'HP'
        };
        data.boss = {
            hp: meta.hp
        };
    } else if (type === 'GRIND' || type === 'HABIT') {
        data.progress = {
            current: 0,
            target: meta.target,
        };
    }

    if (type === 'HABIT') {
        data.routine = {
            frequency: meta.frequency,
            lastDone: null
        };
        if (meta.streakTarget) {
            data.progress!.streak = {
                current: 0,
                target: meta.streakTarget,
                highest: 0
            };
        }
    }

    // Mod: Add initial progress to title
    if (
        (data.meta.type === 'GRIND' || data.meta.type === 'HABIT') &&
        data.progress &&
        (data.progress.target || 0) > 1
    ) {
        // Only if it doesn't already have it (though cleanTitle should be clean)
        const current = data.progress.current || 0;
        const target = data.progress.target!;
        const progressStr = `(${current}/${target})`;

        if (!cleanTitle.includes(progressStr)) {
            // We modify the returned title to include the starting progress
            // This ensures the task is created with "Count (0/5)" visible immediately
            return { title: `${cleanTitle} ${progressStr}`, data };
        }
    }

    return { title: cleanTitle, data };
}
