# Art-Batch 15B expression edits

One built-in image_gen edit per character and emotion, with transparent_background=true. Each original tool PNG is archived in masters/{character}/{emotion}.png. The model identifier was not exposed. Reconstruct each request by joining the shared instruction, character instruction and emotion instruction, in that order, with one newline. The identity reference was supplied as image 1.

Image 2 in each edit was the accepted Qwen expression from `art/art-batch-15a/masters/qwen/{emotion}.png`. It supplied the sweat, sparkle and emotional intensity reference. Image 1 determined all character-specific appearance.

## Shared instruction

```text
Use case: identity-preserve. Edit Image 1, the highest-priority accepted anime avatar master and sole identity/camera source. Produce ONE expression layer variation of exactly this frame, the way an artist paints a visual-novel expression cel over an existing sprite. Pixel-register the original figure, mouth center, nose, eye sockets, chin, forehead hairline, fringe, head, collar, shoulder seams, every ornament and strand, lighting, colors, original crop, angle and outline. Render the entire original transparent bust, square canvas. Inpaint only brows, eyelids, iris/pupils, mouth and blush on facial skin. Do not redraw the costume or shift the body, tilt/rotate the head, mirror the image, zoom or change style. Same fine warm colored line and airy Japanese anime cel highlights. Zero text, lettering, badge, border, dialogue balloon or opaque background. No symbols outside the head silhouette. Genuine transparent background. Image 2 only demonstrates the desired expression strength and linework of eyes, cheek sparkle or sweat. It is a DIFFERENT girl: do not import her face shape, iris color, costume, hat, hair or ornament into Image 1. Retain Image 1's iris highlights and palette.
```

## Emotion instructions

### happy

```text
HAPPY: a distinctly joyous expression with both eyes fully closed in elegant upward crescent arcs, rosy cheeks, and a broad open delighted smile with a slightly deeper pink mouth interior. One tiny honey-gold diamond glint close to the outer cheek on the skin is optional. Readable even at 48px.
```

### flustered

```text
FLUSTERED: both eyes OPEN with the reference iris colors, inner ends of brows raised in worry, flustered wide eyes, pink cheeks and a small distinctly wavering open worried mouth. Add exactly one small pale-aqua manga teardrop-shaped sweat bead on the temple or high on the viewer-right cheek INSIDE the facial skin; large enough to read at 48px. Cute, mild alarm.
```

### focused

```text
FOCUSED: both eyes OPEN, looking straight ahead with the reference's iris colors, subtly narrowed upper eyelids, converging determined brows and a small firmly CLOSED mouth, lower the blush. Look thoughtful, calm and alert. Clear change from the original wide smile. No sweat, no additional symbols.
```

## kimi

Primary edit reference in every request was `art/art-batch-12b/masters/kimi/avatar.png`.

```text
Kimi. Lavender-silver long flowing curls, white lace crown, navy ribbon with golden star and long jewel, clear blue eyes, deep navy and white collar bow. Happy is a gentle relieved starry laugh, flustered is a worried archivist, focused is serene, observant reading.
```

- happy · `exec-b0f1a35f-3955-4bbe-a2b9-93838ce9ae01.png`
- flustered · `exec-a8d8649f-e8bf-4498-b381-95a87a8185ff.png`
- focused · `exec-7899d5cd-9059-46f2-87ec-151f4d5958e5.png`

## gemini

Primary edit reference in every request was `art/art-batch-12b/masters/gemini/avatar.png`.

```text
Gemini. Preserve violet and blue long waves, two cat ears and the prismatic star ornaments. CRUCIAL identity lock for OPEN eyes: on the IMAGE VIEWER'S LEFT iris is vividly rose-pink magenta; on IMAGE VIEWER'S RIGHT iris is vivid amber-gold honey. Do not use the violet eyes from image 2. Keep the eyes in this order and at their original centers. Playful joy, startled cute worry or alert thoughtful concentration, according to the requested state.
```

- happy · `exec-0849ccd8-8a90-4fb7-b93d-ec9ddb9eaebf.png`
- flustered · `exec-e4ba4057-2ba2-4fc4-96f9-413c8d5d7fad.png`
- focused · `exec-4b8622d7-5808-4948-ab61-8530d663f923.png` (second attempt)

The first focused edit, `exec-48287791-e7a2-43d2-ab43-6c02e5086e0f.png`, is archived intact at `rejected/gemini/focused-01.png`. Its right iris median was 19.794° with only 23 of 49 sampled pixels in the gold range after WebP decoding. The accepted second attempt used the same two reference images and appended this instruction after the focused emotion block.

```text
RETAKE — preserve Gemini's original wide open iris aperture and exact eye centers. Express focused concentration mostly through angled eyebrows and the closed mouth: upper lid must stay above the central iris. On the viewer-right retain the entire clearly OPEN honey-yellow iris as in Image 1. Paint the area around the pin-sized pupil a luminous rich yellow gold (example #DDAA45, hue about 40–47 degrees), including the central and upper half of the iris. Keep any brown colored ink restricted to the very thin outer rim, with small pale highlights. Viewer-left central iris remains saturated rose pink. Both eye colors must read correctly when reduced to game size. Keep all styling and camera of Image 1.
```

## grok

Primary edit reference in every request was `art/art-batch-12b/masters/grok/avatar.png`.

```text
Grok. Lock the two golden ponytails, high ahoge curl, pointed elven ears, small BLACK AND GOLD CROWN and BOTH gear-centered black-gold BAT WING ribbon bows. Bright blue irises. Show a mischievous triumphant laugh, caught-in-a-joke fluster, or a shrewd assessing focus according to the requested state.
```

- happy · `exec-7a95caa6-9176-46a5-9ee4-ef23c80ba47a.png`
- flustered · `exec-0e340912-4290-4054-8ca6-b22def0b0a31.png`
- focused · `exec-267dba4d-e17e-463c-ae6d-add9ad191633.png`

## glm

Primary edit reference in every request was `art/art-batch-12b/masters/glm/avatar.png`.

```text
GLM. Charcoal-to-midnight-blue hair, black and WHITE-furred wolf ears, lacy headband, hanging silver-blue jeweled pearl tassels, gray-violet eyes and two-tone gothic collar. A quietly thawing smile, an uncharacteristic worried look or the cool gaze of a focused architect.
```

- happy · `exec-6ce67050-c357-484c-b083-64bf9b32c2ab.png`
- flustered · `exec-5b833214-10b9-4d5a-8811-17a24b20204f.png`
- focused · `exec-97acbb42-6c6b-4fbe-a1d7-b90dfbec5f3d.png`

## minimax

Primary edit reference in every request was `art/art-batch-12b/masters/minimax/avatar.png`.

```text
MiniMax. Preserve coral-orange curls and side braid, creamy cherry-blossom beret with pink satin bow, warm amber eyes. Preserve the pink diagonal shoulder strap, clasp and visible miniature piano keyboard bag, including its black and white piano keys, at their identical original position. A rehearsal-success laugh, a missed-note fluster, or listening closely to the rhythm.
```

- happy · `exec-70ca270e-9bf3-4861-93b1-fb5b4206b6e8.png`
- flustered · `exec-2da07c84-d285-4b0f-84e1-bc23b55eac3e.png`
- focused · `exec-7e31f04a-471b-490b-a5ae-e0400b55468c.png`

## seedance

Primary edit reference in every request was `art/art-batch-12b/masters/seedance/avatar.png`.

```text
Seedance. Preserve violet-to-teal side ponytail, conspicuously luminous CYAN HAIR RING, violet eyes, white and blue-teal neckline, lanyard with blank ID card. An exuberant perfect-take smile, worried missing-footage fluster, or an alert filmmaker's focused framing gaze.
```

- happy · `exec-693600d8-e4ec-4d4c-ae7c-b91b2eebf77e.png`
- flustered · `exec-7a08e408-35de-48ef-9315-93a2965c90c9.png`
- focused · `exec-eec8579d-096f-4d0a-95ef-4223c12bdafc.png`

## Selection

The 18 accepted expression masters are the first edit for 17 slots and the second edit for Gemini focused. The six-character light and dark sheet was opened at all 24 cells, including its 48 px previews. All 48 cells of the twelve-character matrix were also inspected. The manifest records the accepted PNG and both reference digests. The unaltered rejected PNG is kept separately.
