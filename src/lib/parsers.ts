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

    const freqRegex = /\[freq:([^\]]+)\]/i;
    const freqMatch = title.match(freqRegex);

    if (freqMatch && freqMatch[1]) {
        const frequency = freqMatch[1].trim();
        let cleanTitle = title.replace(freqMatch[0], '').trim();

        let target = 1;
        const countRegex = /\[count:(\d+)\]/i;
        const countMatch = cleanTitle.match(countRegex);

        if (countMatch && countMatch[1]) {
            target = parseInt(countMatch[1], 10);
            cleanTitle = cleanTitle.replace(countMatch[0], '').trim();
        }

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
                target,
                frequency, // Passes raw string (e.g., "daily", "weekly", "5 4 * * *")
                streakTarget
            },
            cleanTitle: cleanTitle.replace(/\s+/g, ' ').trim()
        };
    }

    const countRegex = /\[count:(\d+)\]/i;
    const countMatch = title.match(countRegex);

    if (countMatch && countMatch[1]) {
        const targetStr = countMatch[1];
        const cleanTitle = title.replace(countMatch[0], '').trim();

        return {
            type: 'GRIND',
            meta: {
                target: parseInt(targetStr, 10)
            },
            cleanTitle: cleanTitle.replace(/\s+/g, ' ').trim()
        };
    }

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
    const { xp, cleanTitle: titleWithoutXp } = parseXpTag(originalTitle);

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
            let titleWithSuffix = `${cleanTitle} ${progressStr}`

            if (data.progress.streak && data.progress.streak.target) {
                titleWithSuffix += ` 🔥 0/${data.progress.streak.target}`;
            }

            return { title: titleWithSuffix, data };
        }
    }

    if (data.progress?.streak?.target) {
        const streakStr = `🔥 0/${data.progress.streak.target}`;
        if (!cleanTitle.includes(streakStr)) {
            return { title: `${cleanTitle} ${streakStr}`, data };
        }
    }

    return { title: cleanTitle, data };
}
