import { describe, expect, it } from 'vitest'
import { deSerialize, highlight, serialize } from './text-node'

describe('dictionary/text-node', () => {
  it('highlights a selection inside one text node', () => {
    document.body.innerHTML = '<p>Hello world</p>'
    const textNode = document.querySelector('p')?.firstChild as Text

    highlight(textNode, 6, textNode, 11, document.body)

    const highlightNode = document.querySelector('.highlight')
    expect(highlightNode).toHaveTextContent('world')
    expect(document.body).toHaveTextContent('Hello world')
  })

  it('serializes and deserializes selection metadata', () => {
    document.body.innerHTML = '<section><p>Hello world</p></section>'
    const paragraph = document.querySelector('p') as HTMLParagraphElement
    const textNode = paragraph.firstChild as Text

    const metadata = serialize(textNode, 0, textNode, 5, paragraph, document.body)

    expect(metadata).toEqual({
      startMeta: {
        parentTagName: 'P',
        parentIndex: 0,
        textOffset: 0,
      },
      endMeta: {
        parentTagName: 'P',
        parentIndex: 0,
        textOffset: 5,
      },
      ancestorMeta: {
        parentTagName: 'P',
        parentIndex: 0,
      },
    })

    expect(metadata?.startMeta).not.toBeNull()
    expect(metadata?.endMeta).not.toBeNull()

    expect(
      deSerialize(
        metadata as {
          startMeta: { parentTagName: string; parentIndex: number; textOffset: number }
          endMeta: { parentTagName: string; parentIndex: number; textOffset: number }
          ancestorMeta: { parentTagName: string; parentIndex: number }
        },
        document.body,
      ),
    ).toMatchObject({
      startNode: textNode,
      startOffset: 0,
      endNode: textNode,
      endOffset: 5,
      ancestorNode: paragraph,
    })
  })
})
