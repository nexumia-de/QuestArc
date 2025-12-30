# UI Design Guidelines & Best Practices

**Goal:** To reuse as much UI as possible from the original Super Productivity so it looks as a part of the project, while adhering to strict UX standards.

## The 7 Deadly Sins of Game UI (and how to avoid them)

### Mistake #1 - You're putting way too much information on the screen

If you are adding more confusion than clarity, you’re not providing much in the “Heads-Up” department. Let’s try a more tempered approach to throwing in the Kitchen Sink.

*   **Opt-in Information:** Inform the player only as they need to know it. (e.g., prices inset on buy buttons, click-and-hold for full notes, simplified weapon stats). All information can be “rounded down”.
*   **Fade Over Time:** Some widgets can fade or hide (e.g., hiding combat UI outside encounters, tutorials with [Do Not Show Me Again]).
*   **Hierarchy:** Write a list of HUD elements, assign priority numbers, build high priority first, and remove low-priority items until there is a measurable negative impact on gameplay.

### Mistake #2 - You didn't test early and in-context

Every HUD functions perfectly well in Photoshop on a 16:9 screen against a black background. Unfortunately, your designs will collapse in any other context.

*   **Superimpose:** Place wireframes over screenshots or gameplay movies to check motion and contrast.
*   **Distance Test:** For console, test text/button legibility at a distance. For mobile, test on the actual phone screen size.
*   **Game Feel:** Adjust density based on gameplay pace. Fast-paced games need cleaner HUDs; strategy games can handle more data.

### Mistake #3 - You're rocking bad typography

Typography is a difficult skill to master, but strong game interfaces are borne on equally strong wordcraft.

*   **Simple & Consistent:** Pick two fonts: a title font (can be all caps) and a body font (legible at small sizes).
*   **Sans-Serif:** Generally safer and more legible for digital screens.
*   **Contrast Hacks:** If text doesn't pop against the background, use a stroke or a dark, faded polygon behind it.

### Mistake #4 - You’re using colors like a madman

Thoughtless color choice can make a monochrome wireframe unravel before your eyes in-game.

*   **Tool, Not Toy:** High contrast/vibrancy draws the eye; darkness/desaturation dials details down.
*   **Hot-Action Color:** Use ONE consistent color for "Hot-Action" (highlights, titles, important interactions) throughout the entire game.
*   **Avoid All-Red:** Try not to make the entire HUD red, as it clashes with critical indicators like health or danger.

### Mistake #5 - You made some real unsexy math

Plain numerators, denominators, and text strings simply will not do.

*   **Sensual Representation:** Use meters, toggle lights, haptic feedback, or voice lines instead of just numbers.
*   **Combine Feedback:** Combine multiple sensory inputs for stronger feedback.
*   **Worldbuilding:** Information design is part of the world. Make stats and feedback feel like they belong to the lore (e.g., purely visual health indicators, thematic charts).

### Mistake #6 - You’re Clumping or Spacing too much

Do you clump widgets together, or scatter them to the four winds?

*   **Group by Function:** Clump elements of equal importance or similar species (Health/Mana/Stamina). Don't mix Ammo with Health.
*   **Balance:** If spacing, balance the composition (Health left, Ammo right).
*   **Correlation:** Place info near related elements (Mission updates by Quest widget, Location by Map).
*   **Naturalistic Design:** Embed info in the world or on the player character (Diegetic UI) where possible.

### Mistake #7 - You didn't think about the Medium you're building for

*   **PC:** Screen real-estate is vast, controls are precise. But remember key prompts for all mouse buttons.
*   **Console:** Distance is a factor. Icons must be legible from 10 feet away.
*   **Mobile:** Thumbs cover the screen. No tactile buttons. Screen size is small. Keep critical info away from touch zones.
*   **VR:** Gestures over buttons. Accessibility is key.

## Game Design UX Best Practices (Mobile Focus)

### UI Positions & Monetization
*   **Comfort Zones:** On mobile, place interactive elements (especially monetization) in the "comfort-to-reach" areas (usually bottom corners or sides depending on orientation).
*   **Dark UX (Handle with Care):** Users are likely to touch comfort zones by mistake. Placing Store/Ads here maximizes revenue but is considered "Dark UX".
*   **Ad margins:** Ensure at least 10px margin between ads and interactive content.
*   **Touch Events:** Activate Store/More Ops buttons on "touch begin", while game actions should be on "touch end".

### Sliders
*   **Partly Visible Items:** Ensure content expanding off-screen is partially visible so users know to scroll.
*   **Auto-Scroll Animation:** Upon launch, animate the slider from end to start (or at least a few steps) to demonstrate scrollability.
*   **IAP Visibility:** If the slider contains IAP items, keep them partially visible with clear call-to-actions.

### Pop-ups
*   **Origin Animation:** Animate pop-ups launching *from* the button that triggered them (e.g., scale up from Store button).
*   **Dim Background:** Use a semi-transparent background to pause the session but keep context visible. Tapping the background should close the pop-up (unless it's a Store pop-up).
*   **Avoid the 'X':** Users instinctively close 'X' buttons. Use labeled buttons like "Close", "Done", or "Claim" as choices.
*   **Delayed Exit:** For rich text (like story intros), delay the appearance of the close button by 2 seconds to encourage reading.

### User Choices
*   **The Right Choice:** Place "Good for Game" decisions (Confirm, Share, Buy) on the **RIGHT**.
*   **The Left Choice:** Place "Bad for Game" decisions (Cancel, Quit, Reset) on the **LEFT**.
*   **Color Coding:** Associate colors with function (Green = Positive/Right, Red = Negative/Left, Blue = Neutral).

### Rewarded Videos
*   **Iconography:** Use a film clapper board with a play icon.
*   **Mystery Rewards:** Don't explicitly state the reward to pique curiosity ("Open Surprise" vs "Get 100 Gold").
*   **Reward Duration:** Consider Permanent, Per Session, or Per Scene rewards.

### Draggable Objects
*   **Anchor Points:** Offset anchor points so the user's finger doesn't hide the object being dragged (e.g., anchor at the top if dragging with a finger below).
*   **Touch Area:** Grab area should be larger than the visual canvas for small items.
*   **Drop Zones:** Use glow or animations (e.g., mouth opening) instead of static outlines to indicate drop zones.
*   **Pull vs Push:** Pulling (left to right) is generally easier than pushing.

### Intro Video
*   **Duration:** Keep it under 20 seconds.
*   **Replayability:** Accessible from a menu/cover page after the first view.
*   **Invisible Skip:** Hide the skip button until the user taps the screen. If not tapped again, fade it out.

### Rate Us Dialogs
*   **Timing:** Trigger after a "High Satisfaction" point (Boss defeat, major achievement) or accumulated small wins.
*   **Presenter:** Use a character from the game looking at the user.
*   **Positive Reinforcement:** "Rate" button should be green and on the right. Avoid "5 Stars" text (platform guideline violation).

### Store Dialog
*   **Full Version Focus:** Make the "Full Version/Best Deal" button larger, with a "breathe" animation.
*   **Presenter:** Dedicated character looking at the user.
*   **Animation Sequence:** Show Full Version button first -> wait 1s -> Show other IAPs -> wait 1s -> Show Close button.
*   **Context:** Allow users to try entering locked content, then trigger the store dialog over that context.
