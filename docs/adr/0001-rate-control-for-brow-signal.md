# Rate control (slope) for the Brow Signal, not position control

The Brow Signal steers the *slope* of newly generated Track (hold brows raised = keep climbing, neutral = level off), rather than mapping brow height directly to a target elevation. Position control was the conventional, easier-to-learn choice and was the initial recommendation, but rate control was chosen for its larger dynamic range and more active "hold to climb" feel.

## Consequences

- Rate control drifts with tracking noise at neutral and is unbounded; this is mitigated by a Dead Zone (~±15% around calibrated neutral = zero slope) and a hard clamp of elevation to the cave floor/ceiling band.
- Obstacle and difficulty tuning will assume rate-control dynamics; reversing this decision later invalidates that tuning.
