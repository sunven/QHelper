import { useSyncExternalStore } from 'react'
import { ballStore, panelStore } from '@/lib/dictionary/stores'
import type { DictionaryData } from '@/lib/dictionary/types'
import { highlight, serialize } from '@/lib/dictionary/text-node'

const cranberrySvg = `data:image/svg+xml,${encodeURIComponent(
  '<svg t="1700581228922" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M808.234667 466.858667c96.469333 80.981333 112.213333 221.610667 34.56 314.197333-59.690667 71.125333-158.72 94.208-246.869334 60.8l-8.789333-3.498667 15.146667-35.84c74.837333 31.829333 160.170667 13.568 210.602666-46.506666 63.616-75.861333 50.645333-192-29.653333-259.413334-50.389333-42.24-116.821333-56.106667-176.170667-38.912l-8.405333 2.688-12.842667-36.821333c74.325333-25.6 159.061333-9.813333 222.421334 43.306667z" fill="#A855F7"></path><path d="M405.333333 362.666667a277.333333 277.333333 0 1 1 0 554.666666 277.333333 277.333333 0 0 1 0-554.666666z m0 39.637333a237.696 237.696 0 1 0 0 475.392 237.696 237.696 0 0 0 0-475.392z" fill="#A855F7"></path><path d="M403.626667 143.146667a38.528 38.528 0 0 1 39.253333-26.026667l4.736 0.64 12.288 2.602667c72.533333 16.768 123.861333 51.2 154.026667 103.466666 35.968 62.336 34.986667 138.197333-2.986667 227.541334-96.426667-11.776-162.56-48.810667-198.570667-111.189334-31.829333-55.125333-34.773333-120.789333-8.746666-197.034666z m36.778666 12.885333-3.712 11.562667c-18.517333 60.928-14.933333 111.274667 9.258667 153.173333 25.045333 43.392 69.12 72.234667 134.741333 86.186667l5.12 0.981333 1.706667-4.949333c19.626667-60.288 18.090667-110.506667-3.242667-152.448l-3.968-7.338667c-22.826667-39.509333-61.184-66.773333-116.864-81.792l-11.349333-2.858667-11.690667-2.517333z" fill="#A855F7"></path><path d="M843.221333 302.677333a30.848 30.848 0 0 0-19.797333-35.669333l-4.096-1.152-10.581333-2.005333c-49.066667-8.234667-93.184-1.066667-132.224 21.461333-49.877333 28.8-82.090667 77.226667-96.682667 145.408 66.304 21.418667 124.373333 17.749333 174.293333-11.050667 39.04-22.528 67.242667-57.130667 84.650667-103.765333l3.584-10.154667a31.146667 31.146667 0 0 0 0.853333-3.072z m-40.874666-0.426666-0.469334 1.322666c-14.336 37.845333-36.565333 64.853333-67.157333 82.517334-29.738667 17.152-63.402667 23.125333-102.144 17.365333l-4.181333-0.725333 1.450666-4.053334c13.141333-33.408 32.725333-58.154667 58.794667-75.306666l7.296-4.48c28.330667-16.341333 59.946667-22.442667 95.488-18.261334l10.922667 1.621334z" fill="#A855F7"></path></svg>',
)}`

const closeSvg = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 30 30"><path d="M 7 4 C 6.744125 4 6.4879687 4.0974687 6.2929688 4.2929688 L 4.2929688 6.2929688 C 3.9019687 6.6839688 3.9019687 7.3170313 4.2929688 7.7070312 L 11.585938 15 L 4.2929688 22.292969 C 3.9019687 22.683969 3.9019687 23.317031 4.2929688 23.707031 L 6.2929688 25.707031 C 6.6839688 26.098031 7.3170313 26.098031 7.7070312 25.707031 L 15 18.414062 L 22.292969 25.707031 C 22.682969 26.098031 23.317031 26.098031 23.707031 25.707031 L 25.707031 23.707031 C 26.098031 23.316031 26.098031 22.682969 25.707031 22.292969 L 18.414062 15 L 25.707031 7.7070312 C 26.098031 7.3170312 26.098031 6.6829688 25.707031 6.2929688 L 23.707031 4.2929688 C 23.316031 3.9019687 22.682969 3.9019687 22.292969 4.2929688 L 15 11.585938 L 7.7070312 4.2929688 C 7.5115312 4.0974687 7.255875 4 7 4 z"/></svg>',
)}`

let isDragging = false
let offsetX = 0
let offsetY = 0

function getFirstWord(data: DictionaryData) {
  return data.ec?.word?.[0]
}

type TranslationItem = NonNullable<
  NonNullable<ReturnType<typeof getFirstWord>>['trs']
>[number]

function getTranslationText(item: TranslationItem) {
  return item.tr?.[0]?.l?.i?.[0] ?? ''
}

function SaladBowl() {
  const ball = useSyncExternalStore(ballStore.subscribe, ballStore.getSnapshot)

  if (!ball.show) {
    return null
  }

  return (
    <div
      role="img"
      className="saladbowl saladict-external"
      style={{ transform: `translate(${ball.x}px, ${ball.y}px)` }}
      onClick={() => ball.onActive()}
    >
      <img src={cranberrySvg} alt="" />
    </div>
  )
}

function DictPanel() {
  const panel = useSyncExternalStore(panelStore.subscribe, panelStore.getSnapshot)
  const { data, query, range, x, y } = panel

  if (!panel.show) {
    return null
  }

  const word = data ? getFirstWord(data) : undefined
  const hasDictionaryData = data?.ec && data.simple && word

  const relWord = data?.rel_word || { stem: '', rels: [] }

  const handleCollect = () => {
    if (!range) {
      return
    }

    const {
      startContainer,
      startOffset,
      endContainer,
      endOffset,
      commonAncestorContainer,
    } = range
    highlight(
      startContainer as Text,
      startOffset,
      endContainer as Text,
      endOffset,
      commonAncestorContainer,
    )
    const obj = serialize(
      startContainer as Text,
      startOffset,
      endContainer as Text,
      endOffset,
      commonAncestorContainer,
    )
    console.log('obj', obj)
  }

  const handleDragStart = (event: React.MouseEvent<HTMLDivElement>) => {
    const panelElement = event.currentTarget.closest<HTMLDivElement>('.dictpanel')
    if (!panelElement) {
      return
    }

    isDragging = true
    offsetX = event.clientX - panelElement.offsetLeft
    offsetY = event.clientY - panelElement.offsetTop

    const handleMove = (moveEvent: MouseEvent) => {
      if (!isDragging) {
        return
      }

      panelElement.style.left = `${moveEvent.clientX - offsetX}px`
      panelElement.style.top = `${moveEvent.clientY - offsetY}px`
    }

    const handleUp = () => {
      isDragging = false
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  return (
    <div
      role="img"
      className="dictpanel saladict-external"
      style={{
        position: 'fixed',
        zIndex: 2147483647,
        left: x,
        top: y,
      }}
    >
      <div className="cranberry-panel-body">
        <div className="cranberry-panel-header">
          <div className="cranberry-title">Cranberry Dict</div>
          <div className="cranberry-clickable" onClick={handleCollect}>
            🤍❤️
          </div>
          <div
            data-testid="dictionary-drag-handle"
            className="cranberry-drag-handle"
            onMouseDown={handleDragStart}
          />
          <div
            data-testid="dictionary-close"
            className="cranberry-clickable"
            onClick={() => {
              panelStore.mergeData({
                show: false,
                x: 0,
                y: 0,
                query: undefined,
                data: undefined,
              })
            }}
          >
            <img src={closeSvg} alt="" />
          </div>
        </div>
        {hasDictionaryData ? (
          <>
            <div className="cranberry-word-line">
              <span className="cranberry-query">{data.simple?.query}</span>
              <span className="cranberry-phone">美/{word.usphone}/</span>
              <span className="cranberry-phone">英/{word.ukphone}/</span>
            </div>
            <div className="cranberry-translations">
              {(word.trs || []).map((item, index) => {
                const txt = getTranslationText(item)
                const ind = txt.indexOf(' ')
                return (
                  <div key={`${txt}-${index}`} className="cranberry-translation-row">
                    <div className="cranberry-pos">{txt.substring(0, ind)}</div>
                    <div className="cranberry-tran">{txt.substring(ind + 1)}</div>
                  </div>
                )
              })}
              <div className="cranberry-translation-row">
                <div className="cranberry-pos" />
                <div className="cranberry-tran">{(data.ec?.exam_type || []).join('|')}</div>
              </div>
              <div className="cranberry-word-forms">
                {(word.wfs || []).map((item, index) => (
                  <span key={`${item.wf?.name}-${index}`} className={index === 0 ? '' : 'cranberry-ml'}>
                    <span className="cranberry-form-name">{item.wf?.name}: </span>
                    {item.wf?.value}
                  </span>
                ))}
              </div>
            </div>
            <div className="cranberry-related">
              <p>
                词根: <span className="cranberry-stem">{relWord.stem}</span>
              </p>
              {(relWord.rels || []).map((item, index) => (
                <div key={`${item.rel?.pos}-${index}`} className="cranberry-related-item">
                  <p className="cranberry-related-pos">{item.rel?.pos}</p>
                  {(item.rel?.words || []).map((relatedWord, wordIndex) => (
                    <p key={`${relatedWord.word}-${wordIndex}`}>
                      {relatedWord.word}:{relatedWord.tran}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="cranberry-word-line">
            <span className="cranberry-query">{query}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function DictionaryOverlay() {
  return (
    <>
      <SaladBowl />
      <DictPanel />
    </>
  )
}
