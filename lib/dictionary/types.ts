export const DICTIONARY_FETCH_MESSAGE = 'QHELPER_DICTIONARY_FETCH_URL' as const

export type DictionaryFetchMessage = {
  type: typeof DICTIONARY_FETCH_MESSAGE
  url: string
}

export type DictionaryData = {
  ec?: {
    exam_type?: string[]
    word?: Array<{
      usphone?: string
      ukphone?: string
      trs?: Array<{
        tr?: Array<{
          l?: {
            i?: string[]
          }
        }>
      }>
      wfs?: Array<{
        wf?: {
          name?: string
          value?: string
        }
      }>
    }>
  }
  simple?: {
    query?: string
  }
  rel_word?: {
    stem?: string
    rels?: Array<{
      rel?: {
        pos?: string
        words?: Array<{
          word?: string
          tran?: string
        }>
      }
    }>
  }
}

export type BallState = {
  show: boolean
  x?: number
  y?: number
  onActive: () => void
}

export type PanelState = {
  show: boolean
  x?: number
  y?: number
  query?: string
  data?: DictionaryData
  range?: Range
}
