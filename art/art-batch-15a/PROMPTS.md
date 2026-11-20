# Art-Batch 15A expression edits

One built-in image_gen edit per character and emotion, with transparent_background=true. Each original tool PNG is archived in masters/{character}/{emotion}.png. The model identifier was not exposed. Reconstruct each request by joining the shared instruction, character instruction and emotion instruction, in that order, with one newline. The identity reference was supplied as image 1.

## Shared instruction

```text
Use case: identity-preserve. Edit Image 1, the sole and highest-priority accepted anime avatar master. Produce ONE expression layer variation of exactly this frame, the way an artist paints a visual-novel expression cel over an existing sprite. Pixel-register the original figure, mouth center, nose, eye sockets, chin, forehead hairline, fringe, head, collar, shoulder seams, every ornament and strand, lighting, colors, original crop, angle and outline. Render the entire original transparent bust, square canvas. Inpaint only brows, eyelids, iris/pupils, mouth and blush on facial skin. Do not redraw the costume or shift the body, tilt/rotate the head, mirror the image, zoom or change style. Same fine warm colored line and airy Japanese anime cel highlights. Zero text, lettering, badge, border, dialogue balloon or opaque background. No symbols outside the head silhouette. Genuine transparent background.
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

## bluewhale

Primary edit reference in every request was `art/art-batch-12a/masters/bluewhale/avatar.png`.

```text
Bluewhale. Lock the deep blue waves, top curl, white ruffled maid headdress, blue bow on original side, whale fin ears, blue collar bow and brooch. Blue irises.
```

- happy · `exec-97b603b8-d6a9-4212-9d77-b53c39bf9b54.png`
- flustered · `exec-f259cf5c-3c0b-41a9-9a00-c33235351f44.png`
- focused · `exec-9e8a5a9a-fb20-4eec-9ebd-3116b0660dfa.png`

## qwen

Primary edit reference in every request was `art/art-batch-12a/masters/qwen/avatar.png`.

```text
Qwen. Keep violet-blue curls and side braid, blue beret with white flower and tassel, diamond earrings and blue/white cape collar. Violet irises. Gentle demeanor.
```

- happy · `exec-a0f52cdb-bfd6-43df-90ba-b854924ebb58.png`
- flustered · `exec-8da3f448-fdcd-44f7-83ee-dbee0eb35d5b.png`
- focused · `exec-03530072-485b-4c8f-b076-345c7e8bf868.png`

## llama

Primary edit reference in every request was `art/art-batch-12a/masters/llama/avatar.png`.

```text
Llama. Keep cream curls, fluffy alpaca ears, blue infinity hairpin, olive ribbons and white lace. Clear blue irises. Soft and endearing.
```

- happy · `exec-9f0e9708-052c-4828-9718-d0d22fe5ff8e.png`
- flustered · `exec-99b938e4-10d0-4dde-8439-1e62ac8b863b.png`
- focused · `exec-1f200e22-eb07-4582-83dc-e3dc4758ba9b.png`

## mistral

Primary edit reference in every request was `art/art-batch-12a/masters/mistral/avatar.png`.

```text
Mistral. Retain the sweeping brim of the red feather hat, fox ears, orange-red flowing hair, red-white neck bow, amber-gold irises. Lively demeanor.
```

- happy · `exec-5dd6a637-5b0d-4932-925b-e8f73b9864fd.png`
- flustered · `exec-c24e5f48-41df-46dc-9d2f-32494eab419a.png`
- focused · `exec-35469789-0b5b-49ff-bec6-f9a6d6101319.png`

## gpt

Primary edit reference in every request was `art/art-batch-12a/masters/gpt/avatar.png`.

```text
GPT. Preserve both white dragon horns, white rose, elven ear tips, silver lilac hair, violet eyes and purple collar bow. Gentle, composed.
```

- happy · `exec-6af1505b-5a46-461d-8bfa-1941c7469e10.png`
- flustered · `exec-a4a1aeef-0cf3-410c-b46d-a245cd6617da.png`
- focused · `exec-8d9771a6-eec5-45a5-ad85-00ed7975560a.png`

## claude

Primary edit reference in every request was `art/art-batch-12a/masters/claude/avatar.png`.

```text
Claude. Absolutely upright, head at top, shoulders below, vertical centerline as in the supplied image; no tilt, sideways or upside down render. Preserve orange curls, orange daisy and dark lace bow, amber irises, vintage collar and brooch. Reserved, precise.
```

- happy · `exec-0b17edb1-f6e0-4dcc-8c8b-7b74709a7249.png`
- flustered · `exec-a700d289-c3d9-44f4-bc11-0a9d8bb425ff.png`
- focused · `exec-97c3a384-68b6-41f2-8a93-34fb89dde41f.png`

## Selection

All 18 initial candidates passed the decoded pixel gates and the 24-cell review. The manifest records the master and reference digests.
