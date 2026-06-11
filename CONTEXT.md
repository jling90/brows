# Brows

A browser-based three.js endless runner (in the spirit of Chrome's Dino game) where a mine cart rides a track whose elevation the player sculpts in real time using their eyebrows, read from the webcam.

## Language

**Brow Signal**:
The continuous 1D input value derived from the player's eyebrow height, ranging from fully furrowed to fully raised. It steers the slope (climb/descend rate) of newly generated Track.
_Avoid_: Eyebrow input, face input, brow value

**Dead Zone**:
The band around the player's calibrated neutral brow position within which the Brow Signal produces exactly zero Track slope, absorbing tracking noise.
_Avoid_: Threshold, tolerance

**Calibration**:
The pre-game sequence (relax / raise / furrow) that captures a player's personal brow range, against which the Brow Signal is normalised. Re-runnable from the menu.
_Avoid_: Setup, training

**Track**:
The continuous rail path the cart rides on. Its upcoming elevation is steered by the Brow Signal.
_Avoid_: Rails, path, terrain

**Pen**:
The point roughly one cart-second ahead of the Cart where new Track is laid. The Brow Signal bends the Track at the Pen; Track behind the Pen is committed and cannot change.
_Avoid_: Frontier, cursor, generator point

**Hazard**:
A static cave obstacle the Cart must not touch: a stalagmite (floor), stalactite (ceiling), or rock wall with a gap at a set height. Contact ends the run.
_Avoid_: Obstacle, enemy

**Run**:
A single play session from start until the Cart hits a Hazard. Score is the distance travelled.
_Avoid_: Game, round, life

**Cart**:
The player character — a mine cart that follows the Track. The player does not steer the Cart directly; they shape the Track.
_Avoid_: Player, character, dino
