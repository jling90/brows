import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { normalizeBrow, normalizeMouth, type CalibrationData } from './calibration'
import type { FaceFrame, FaceSignalSource } from './types'

interface Category {
  categoryName: string
  score: number
}

const score = (cats: Category[], name: string) =>
  cats.find((c) => c.categoryName === name)?.score ?? 0

export function rawBrowFromBlendshapes(cats: Category[]): number {
  return score(cats, 'browInnerUp') - (score(cats, 'browDownLeft') + score(cats, 'browDownRight')) / 2
}

export function rawMouthFromBlendshapes(cats: Category[]): number {
  return score(cats, 'jawOpen')
}

export interface RawReading {
  brow: number
  mouth: number
  landmarks: Float32Array
}

export class MediaPipeSource implements FaceSignalSource {
  calibration: CalibrationData | null = null
  readonly video = document.createElement('video')
  private landmarker: FaceLandmarker | null = null
  private stream: MediaStream | null = null
  private landmarkBuf = new Float32Array(478 * 3)

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 },
    })
    this.video.srcObject = this.stream
    this.video.muted = true
    this.video.playsInline = true
    await this.video.play()
    const fileset = await FilesetResolver.forVisionTasks('/wasm')
    this.landmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: '/models/face_landmarker.task', delegate: 'GPU' },
      runningMode: 'VIDEO',
      outputFaceBlendshapes: true,
      numFaces: 1,
    })
  }

  /** Uncalibrated reading for the calibration screen. Null when no face. */
  readRaw(): RawReading | null {
    if (!this.landmarker || this.video.readyState < 2) return null
    const result = this.landmarker.detectForVideo(this.video, performance.now())
    const lm = result.faceLandmarks[0]
    const cats = result.faceBlendshapes?.[0]?.categories
    if (!lm || !cats) return null
    for (let i = 0; i < lm.length && i < 478; i++) {
      this.landmarkBuf[i * 3] = lm[i].x
      this.landmarkBuf[i * 3 + 1] = lm[i].y
      this.landmarkBuf[i * 3 + 2] = lm[i].z
    }
    return {
      brow: rawBrowFromBlendshapes(cats),
      mouth: rawMouthFromBlendshapes(cats),
      landmarks: this.landmarkBuf,
    }
  }

  /** Calibrated frame for the game. Null when no face or not yet calibrated. */
  read(): FaceFrame | null {
    const raw = this.readRaw()
    if (!raw || !this.calibration) return null
    return {
      brow: normalizeBrow(raw.brow, this.calibration),
      mouth: normalizeMouth(raw.mouth, this.calibration),
      landmarks: raw.landmarks,
    }
  }

  stop(): void {
    this.stream?.getTracks().forEach((t) => t.stop())
    this.landmarker?.close()
    this.landmarker = null
  }
}
