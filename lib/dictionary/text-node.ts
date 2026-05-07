type SelectedTextNode = {
  node: Text
  type: 'text'
  splitType: 'both' | 'head' | 'tail' | 'none'
}

const getNodesIfSameStartEnd = (
  node: Text,
  startOffset: number,
  endOffset: number,
) => {
  node.splitText(startOffset)
  const passedNode = node.nextSibling as Text | null
  if (!passedNode) {
    return []
  }
  passedNode.splitText(endOffset - startOffset)
  return [
    {
      node: passedNode,
      type: 'text',
      splitType: 'both',
    } satisfies SelectedTextNode,
  ]
}

const getSelectedNodes = (
  startNode: Text,
  startOffset: number,
  endNode: Text,
  endOffset: number,
  root: Node,
) => {
  if (startNode === endNode) {
    return getNodesIfSameStartEnd(startNode, startOffset, endOffset)
  }

  const nodeStack: Node[] = [root]
  const selectedNodes: SelectedTextNode[] = []
  let withinSelectedRange = false
  let curNode: Node | undefined

  while ((curNode = nodeStack.pop())) {
    const children = curNode.childNodes
    for (let i = children.length - 1; i >= 0; i--) {
      nodeStack.push(children[i])
    }

    if (curNode === startNode) {
      if (curNode.nodeType === Node.TEXT_NODE) {
        const node = curNode as Text
        node.splitText(startOffset)
        const { nextSibling } = node
        if (nextSibling) {
          selectedNodes.push({
            node: nextSibling as Text,
            type: 'text',
            splitType: 'head',
          })
        }
      }
      withinSelectedRange = true
    } else if (curNode === endNode) {
      if (curNode.nodeType === Node.TEXT_NODE) {
        const node = curNode as Text
        node.splitText(endOffset)
        selectedNodes.push({
          node,
          type: 'text',
          splitType: 'tail',
        })
      }
      break
    } else if (withinSelectedRange && curNode.nodeType === Node.TEXT_NODE) {
      selectedNodes.push({
        node: curNode as Text,
        type: 'text',
        splitType: 'none',
      })
    }
  }
  return selectedNodes
}

export function highlight(
  startNode: Text,
  startOffset: number,
  endNode: Text,
  endOffset: number,
  root: Node = document.body,
) {
  const nodes = getSelectedNodes(startNode, startOffset, endNode, endOffset, root)
  nodes.forEach(({ node }) => {
    const wrap = document.createElement('span')
    wrap.setAttribute('class', 'highlight')
    wrap.appendChild(node.cloneNode(false))
    node.parentNode?.replaceChild(wrap, node)
  })
}

const getOriginParent = (node: Node) => {
  if (node instanceof HTMLElement) {
    return node
  }
  return node.parentElement
}

function getTextPreOffset(parentElement: HTMLElement, text: Text) {
  const nodeStack: Node[] = [parentElement]
  let curNode: Node | undefined
  let offset = 0

  while ((curNode = nodeStack.pop())) {
    const children = curNode.childNodes
    for (let i = children.length - 1; i >= 0; i--) {
      nodeStack.push(children[i])
    }

    if (curNode.nodeType === Node.TEXT_NODE && curNode !== text) {
      offset += curNode.textContent?.length ?? 0
    } else if (curNode.nodeType === Node.TEXT_NODE) {
      break
    }
  }

  return offset
}

const countGlobalNodeIndex = (element: HTMLElement, root: HTMLElement) => {
  const { tagName } = element
  const list = root.getElementsByTagName(tagName)
  for (let i = 0; i < list.length; i++) {
    if (element === list[i]) {
      return i
    }
  }
  return -1
}

const getDomMeta = (node: Text, offset: number, root: HTMLElement) => {
  const originParent = getOriginParent(node)
  if (!originParent) {
    return null
  }
  const index = countGlobalNodeIndex(originParent, root)
  const preNodeOffset = getTextPreOffset(originParent, node)
  const { tagName } = originParent
  return {
    parentTagName: tagName,
    parentIndex: index,
    textOffset: preNodeOffset + offset,
  }
}

export function serialize(
  startNode: Text,
  startOffset: number,
  endNode: Text,
  endOffset: number,
  ancestorNode: Node,
  root: HTMLElement = document.body,
) {
  const startMeta = getDomMeta(startNode, startOffset, root)
  const endMeta = getDomMeta(endNode, endOffset, root)
  const ancestorElement =
    ancestorNode.nodeType === Node.TEXT_NODE
      ? getOriginParent(ancestorNode)
      : (ancestorNode as HTMLElement)
  if (!ancestorElement) {
    return null
  }
  const index = countGlobalNodeIndex(ancestorElement, root)
  return {
    startMeta,
    endMeta,
    ancestorMeta: {
      parentTagName: ancestorElement.tagName,
      parentIndex: index,
    },
  }
}

const queryElementNode = (
  meta: { parentTagName: string; parentIndex: number },
  root: HTMLElement,
) => root.getElementsByTagName(meta.parentTagName)[meta.parentIndex]

function getTextChildByOffset(parent: HTMLElement, offset: number) {
  const nodeStack: Node[] = [parent]
  let curNode: Node | undefined
  let curOffset = 0
  let startOffset = 0

  while ((curNode = nodeStack.pop())) {
    const children = curNode.childNodes
    for (let i = children.length - 1; i >= 0; i--) {
      nodeStack.push(children[i])
    }
    if (curNode.nodeType === Node.TEXT_NODE) {
      startOffset = offset - curOffset
      curOffset += curNode.textContent?.length ?? 0
      if (curOffset >= offset) {
        break
      }
    }
  }

  return { node: curNode || parent, offset: startOffset }
}

export function deSerialize(
  meta: {
    startMeta: { parentTagName: string; parentIndex: number; textOffset: number }
    endMeta: { parentTagName: string; parentIndex: number; textOffset: number }
    ancestorMeta: { parentTagName: string; parentIndex: number }
  },
  root: HTMLElement = document.body,
) {
  const { startMeta, endMeta, ancestorMeta } = meta
  const startElement = queryElementNode(startMeta, root) as HTMLElement
  const endElement = queryElementNode(endMeta, root) as HTMLElement
  const startNode = getTextChildByOffset(startElement, startMeta.textOffset)
  const endNode = getTextChildByOffset(endElement, endMeta.textOffset)

  return {
    startNode: startNode.node,
    startOffset: startNode.offset,
    endNode: endNode.node,
    endOffset: endNode.offset,
    ancestorNode: queryElementNode(ancestorMeta, root),
  }
}

