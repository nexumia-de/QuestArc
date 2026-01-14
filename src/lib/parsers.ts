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

    // 2. Habit: 3x @daily TaskName
    const habitRegex = /(\d+)x\s+(@daily|@weekly)\s+(.+)/i;
    const habitMatch = title.match(habitRegex);
    if (habitMatch) {
        const targetStr = habitMatch[1] || '1';
        const freq = habitMatch[2] || '@daily';
        const name = habitMatch[3] || 'Task';
        return {
            type: 'HABIT',
            meta: {
                target: parseInt(targetStr, 10),
                frequency: freq.toLowerCase()
            },
            cleanTitle: name.trim()
        };
    }

    // 3. Grind: 50x TaskName (Must be checked AFTER Habit to avoid conflict if Grind doesn't have @interval)
    const grindRegex = /(\d+)x\s+(?!@)(.+)/i; // Negative lookahead to ensure it's not a habit
    const grindMatch = title.match(grindRegex);
    if (grindMatch) {
        const targetStr = grindMatch[1] || '1';
        const name = grindMatch[2] || 'Task';
        return {
            type: 'GRIND',
            meta: {
                target: parseInt(targetStr, 10)
            },
            cleanTitle: name.trim()
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
    }

    return { title: cleanTitle, data };
}
