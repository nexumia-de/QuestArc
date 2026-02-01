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
    const bossRegex = /(?:(?:⚔️|🛡️)\s*)?(.+?)\s*\[HP:(\d+)\]/iu;
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
        let cleanTitleTemp = title.replace(countMatch[0], '').trim();

        // Parse Damage Config
        const dmgRegex = /\[dmg:(\d+)\]/i;
        const dmgMatch = cleanTitleTemp.match(dmgRegex);
        let damage = undefined;
        if (dmgMatch && dmgMatch[0] && dmgMatch[1]) {
            damage = parseInt(dmgMatch[1], 10);
            cleanTitleTemp = cleanTitleTemp.replace(dmgMatch[0], '').trim();
        }

        const dmgeveryRegex = /\[dmgevery:(\d+)\]/i;
        const dmgeveryMatch = cleanTitleTemp.match(dmgeveryRegex);
        let damageEvery = undefined;
        if (dmgeveryMatch && dmgeveryMatch[0] && dmgeveryMatch[1]) {
            damageEvery = parseInt(dmgeveryMatch[1], 10);
            cleanTitleTemp = cleanTitleTemp.replace(dmgeveryMatch[0], '').trim();
        }

        return {
            type: 'GRIND',
            meta: {
                target: parseInt(targetStr, 10),
                damage,
                damageEvery
            },
            cleanTitle: cleanTitleTemp.replace(/\s+/g, ' ').trim()
        };
    }

    // Parse Damage Config for SIMPLE tasks too
    const dmgRegex = /\[dmg:(\d+)\]/i;
    const dmgMatch = title.match(dmgRegex);
    let damage = undefined;
    let cleanSimpleTitle = title;
    if (dmgMatch && dmgMatch[0] && dmgMatch[1]) {
        damage = parseInt(dmgMatch[1], 10);
        cleanSimpleTitle = cleanSimpleTitle.replace(dmgMatch[0], '').trim();
    }

    return {
        type: 'SIMPLE',
        meta: {
            damage
        },
        cleanTitle: cleanSimpleTitle
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
            originalTitle,
            damage: meta.damage,
            damageEvery: meta.damageEvery
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

        // Mod: Add Boss Visual "Name 100/100 ❤️"
        const current = meta.hp;
        const target = meta.hp;
        const visual = `${current}/${target} ❤️`;
        if (!cleanTitle.includes(visual)) {
            return { title: `${cleanTitle} ${visual}`, data };
        }
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
                titleWithSuffix += ` 0/${data.progress.streak.target} 🔥`;
            }

            return { title: titleWithSuffix, data };
        }
    }

    if (data.progress?.streak?.target) {
        const streakStr = `0/${data.progress.streak.target} 🔥`;
        if (!cleanTitle.includes(streakStr)) {
            return { title: `${cleanTitle} ${streakStr}`, data };
        }
    }

    return { title: cleanTitle, data };
}

/**
 * Removes dynamic status suffix (streak, progress) from a title.
 * Used for matching tasks against their definitions.
 */
export function cleanTaskTitle(title: string): string {
    let clean = title;
    // Match both "🔥 1/2" (old) and "1/2 🔥" (new) formats for backward compatibility
    clean = clean.replace(/(\s*🔥\s*\d+(\/\d+)?)|(\s*\d+(\/\d+)?\s*🔥)/g, '');
    clean = clean.replace(/\s*\(\d+\/\d+\)$/, '');
    return clean.trim();
}

/**
 * Formats a task title with progress and streak information.
 */
export function formatTaskTitle(baseTitle: string, progress?: QuestTaskData['progress']): string {
    let newTitle = baseTitle;
    const target = progress?.target || 0;
    const current = progress?.current || 0;

    // Append progress if target > 1
    if (target > 1) {
        newTitle = `${newTitle} (${current}/${target})`;
    }

    // Append streak if applicable
    if (progress?.streak) {
        const sCurrent = progress.streak.current || 0;
        const sTarget = progress.streak.target;

        let streakStr = `${sCurrent}`;
        if (sTarget) {
            streakStr += `/${sTarget}`;
        }
        streakStr += ` 🔥`;

        if (sTarget || sCurrent > 0) {
            newTitle = `${newTitle} ${streakStr}`;
        }
    }

    return newTitle;
}
