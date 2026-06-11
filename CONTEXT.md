# Brows

A browser-based three.js endless runner (in the spirit of Chrome's Dino game) where a mine cart rides a track whose elevation the player sculpts in real time using their eyebrows, read from the webcam.

## Language

**Avatar**:
The live low-poly rendering of the player's face, built from tracker landmarks and shown in a screen corner during play. It is the primary tracking feedback: it mirrors what the tracker sees and grays out on face loss. No raw webcam video is shown during a Run.
_Avoid_: Face preview, PiP, webcam view

**Brow Signal**:
The continuous 1D input value derived from the player's eyebrow height, ranging from fully furrowed to fully raised. It steers the slope (climb/descend rate) of newly generated Track.
_Avoid_: Eyebrow input, face input, brow value

**Dead Zone**:
The band around the player's calibrated neutral brow position within which the Brow Signal produces exactly zero Track slope, absorbing tracking noise.
_Avoid_: Threshold, tolerance

**Calibration**:
The pre-game sequence (relax / raise / furrow / open wide) that captures a player's personal brow and mouth ranges, against which the Brow Signal and Mouth Signal are normalised. Re-runnable from the menu.
_Avoid_: Setup, training

**Track**:
The continuous rail path the cart rides on. Its upcoming elevation is steered by the Brow Signal.
_Avoid_: Rails, path, terrain

**Pen**:
The point roughly one cart-second ahead of the Cart where new Track is laid. The Brow Signal bends the Track at the Pen; Track behind the Pen is committed and cannot change.
_Avoid_: Frontier, cursor, generator point

**Hazard**:
A cave obstacle the Cart must not touch: a stalagmite (floor), stalactite (ceiling), Maw, or Clamp. Contact ends the run.
_Avoid_: Obstacle, enemy

**Maw**:
A Hazard spanning floor to ceiling whose toothy gap aperture is driven live by the Mouth Signal, evaluated as the Cart crosses.
_Avoid_: Mouth-wall, door, gate, wall

**Clamp**:
A Hazard spanning floor to ceiling whose toothy gap closes as the Mouth Signal rises — the inverse of a Maw, crossed with the mouth shut. Mixed among Maws it forces open/closed alternation. Longer, denser fangs distinguish its silhouette from a Maw's.
_Avoid_: inverse maw, anti-maw, trap

**Mouth Signal**:
The continuous 0–1 input value derived from the player's mouth openness (jaw blendshapes), normalised against Calibration. It sets a Maw's gap aperture.
_Avoid_: Jaw input, mouth value

**Run**:
A single play session from start until the Cart hits a Hazard. Score is the distance travelled.
_Avoid_: Game, round, life

**Cart**:
The player character — a mine cart that follows the Track. The player does not steer the Cart directly; they shape the Track.
_Avoid_: Player, character, dino
