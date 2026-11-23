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
  const nodes = getSelectedNodes(
    startNode,
    startOffset,
    endNode,
    endOffset,
    root,
  )
  nodes.forEach(({ node }) => {
    const wrap = document.createElement('span')
    wrap.setAttribute('class', 'qhelper-dictionary-highlight')
    wrap.appendChild(node.cloneNode(false))
    node.parentNode?.replaceChild(wrap, node)
  })
}
