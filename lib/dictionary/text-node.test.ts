import { describe, expect, it } from 'vitest'
import { highlight } from './text-node'

describe('dictionary/text-node', () => {
  it('highlights a selection spanning multiple text nodes', () => {
    document.body.innerHTML = '<p>Hello <strong>world</strong> again</p>'
    const paragraph = document.querySelector('p') as HTMLParagraphElement
    const startNode = paragraph.firstChild as Text
    const endNode = paragraph.lastChild as Text

    highlight(startNode, 3, endNode, 4, document.body)

    const highlightNodes = document.querySelectorAll(
      '.qhelper-dictionary-highlight',
    )
    expect(highlightNodes).toHaveLength(3)
    expect([...highlightNodes].map((node) => node.textContent).join('')).toBe(
      'lo world aga',
    )
    expect(document.body).toHaveTextContent('Hello world again')
  })

  it('highlights a selection inside one text node', () => {
    document.body.innerHTML = '<p>Hello world</p>'
    const textNode = document.querySelector('p')?.firstChild as Text

    highlight(textNode, 6, textNode, 11, document.body)

    const highlightNode = document.querySelector(
      '.qhelper-dictionary-highlight',
    )
    expect(highlightNode).toHaveTextContent('world')
    expect(document.body).toHaveTextContent('Hello world')
  })
})
