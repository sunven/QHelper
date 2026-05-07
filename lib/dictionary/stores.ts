import type { BallState, PanelState } from './types'

const initialBall: BallState = {
  show: false,
  x: 0,
  y: 0,
  onActive: () => undefined,
}

const initialPanel: PanelState = {
  show: false,
  x: 0,
  y: 0,
  data: undefined,
}

let ball = initialBall
let panel = { ...initialPanel }
let ballListeners: Array<() => void> = []
let panelListeners: Array<() => void> = []

function emitBallChange() {
  ballListeners.forEach((listener) => listener())
}

function emitPanelChange() {
  panelListeners.forEach((listener) => listener())
}

export const ballStore = {
  close() {
    ball = { ...ball, show: false }
    emitBallChange()
  },
  setBall(nextBall: BallState) {
    ball = { ...nextBall }
    emitBallChange()
  },
  subscribe(listener: () => void) {
    ballListeners = [...ballListeners, listener]
    return () => {
      ballListeners = ballListeners.filter((item) => item !== listener)
    }
  },
  getSnapshot() {
    return ball
  },
  reset() {
    ball = initialBall
    emitBallChange()
  },
}

export const panelStore = {
  reset() {
    panel = { ...initialPanel }
    emitPanelChange()
  },
  mergeData(nextPanel: Partial<PanelState>) {
    panel = { ...panel, ...nextPanel }
    emitPanelChange()
  },
  subscribe(listener: () => void) {
    panelListeners = [...panelListeners, listener]
    return () => {
      panelListeners = panelListeners.filter((item) => item !== listener)
    }
  },
  getSnapshot() {
    return panel
  },
}

export function resetDictionaryStores() {
  ball = initialBall
  panel = { ...initialPanel }
  ballListeners = []
  panelListeners = []
}

