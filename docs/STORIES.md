# Story Data Model

## Example: Productivity Mastery
```json
{
    "id": "story_productivity_mastery",
    "title": "Productivity Mastery",
    "steps": [
        {
            "id": 1,
            "title": "Open Super Productivity",
            "condition": { "type": "streak", "targetValue": 3 },
            "xpReward": 50,
            "nextStepId": 2
        },
        {
            "id": 3,
            "title": "Boss Fight: Procrastination Monster",
            "type": "boss",
            "boss": {
                "hp": 100,
                "damageModifiers": [
                    { "trigger": { "type": "tag", "value": "deep-work" }, "multiplier": 2.0 }
                ]
            }
        }
    ]
}