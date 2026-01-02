/**
 * Validates that a state object has the required structure
 * @param state - The state object to validate
 * @returns True if the state has all required fields, false otherwise
 * @remarks Checks for presence of profile, activeStory, and required numeric fields
 */
export function validateState(state: any): boolean {
    if (!state || typeof state !== 'object') {
        return false;
    }

    return Boolean(
        state.profile &&
        state.activeStory &&
        typeof state.profile.level === 'number' &&
        typeof state.profile.xp === 'number'
    );
}
