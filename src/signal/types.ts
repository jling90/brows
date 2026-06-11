/** One tracker reading. brow ∈ [-1,1] calibrated (furrow…raise), mouth ∈ [0,1] calibrated (closed…wide). */
export interface FaceFrame {
  brow: number
  mouth: number
  /** 478×3 normalised landmark coords for the Avatar, or null if the source has none (keyboard). */
  /** Buffer may be reused by the source each frame — consume immediately, copy if retaining. */
  landmarks: Float32Array | null
}

export interface FaceSignalSource {
  start(): Promise<void>
  /** Latest frame, or null when no face is detected. */
  read(): FaceFrame | null
  stop(): void
}
