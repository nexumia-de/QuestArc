import { TaskStub } from '../../types/plugin-api';
import { QuestTaskData } from '../../types/quest-v2';
import { TaskNoteJSON } from '../../types/payloads';
import { PluginService } from '../../services/PluginService';

export class NoteParser {
    /**
     * Safely attempts to parse the JSON block from a task's notes.
     * Returns null if no block found or parse error.
     */
    static parse(notes?: string): TaskNoteJSON | null {
        if (!notes) return null;

        try {
            // Matches content between ```json and ``` tags
            const match = notes.match(/```json\s*([\s\S]*?)\s*```/);
            if (match && match[1]) {
                return JSON.parse(match[1]) as TaskNoteJSON;
            }
        } catch (e) {
            PluginService.log.warn('[NoteParser] Failed to parse JSON block', e);
        }
        return null;
    }

    /**
     * Extracts QuestTaskData, falling back to compiling from title if no JSON exists.
     * NOTE: This depends on compileTaskData which is currently in handlers/parsers/index.ts or lib/parsers if moved.
     * For now we assume compileTaskData is available or we temporarily duplicate/move it.
     */
    /**
     * Extracts QuestTaskData.
     * PRIORITY:
     * 1. If Title implies a Type match (e.g. [HP:100], [count:5]), use Title (allows user to re-define task).
     * 2. If Title is 'SIMPLE' (no tags) but JSON exists, use JSON (preserves history/meta).
     * 3. Else compile from Title.
     */
    static getQuestData(task: TaskStub, compilerFn: (title: string) => { data: QuestTaskData }): QuestTaskData {
        const compiled = compilerFn(task.title).data;
        const json = NoteParser.parse(task.notes);

        if (json) {
            // Check for Type Mismatch
            // If Title has a specific structure (BOSS/HABIT/GRIND) and JSON differs, Title wins.
            const titleType = compiled.meta.type;
            const jsonType = json.meta?.type;

            if (titleType !== 'SIMPLE' && titleType !== jsonType) {
                PluginService.log.info(`[NoteParser] Type mismatch (Title: ${titleType} vs JSON: ${jsonType}). Creating fresh data from Title.`);
                return compiled;
            }

            // If Title is SIMPLE, but JSON has data, we trust JSON (unless user deleted the tags intentionally?)
            // Usually, removing tags should revert to SIMPLE.
            // But for now, let's allow Title 'Boss [HP:100]' to override 'HABIT'. 
            // The above check handles strict overrides.

            return json as unknown as QuestTaskData;
        }

        return compiled;
    }
}
