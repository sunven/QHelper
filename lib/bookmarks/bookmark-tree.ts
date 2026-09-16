import type { TreeData } from '@/components/fe-tools/TreeTable'

export type BookmarkDeletionPlan = {
  /** Selected nodes that cannot be deleted, such as the permanent browser folders. */
  blocked: TreeData[]
  /** Folders across the whole removal closure, not just the top-level removals. */
  folderCount: number
  /** Links across the whole removal closure, not just the top-level removals. */
  linkCount: number
  /** Every id that disappears once `removals` are gone, descendants included. */
  removedIds: Set<string>
  /** Top-level nodes to hand to the Chrome API; none of them is a descendant of another. */
  removals: TreeData[]
}

/**
 * Chrome omits `url` for folders, so this is authoritative. `Boolean(children)` is not:
 * a filtering pass may rewrite a link node into one that carries an empty `children` array.
 */
export function isBookmarkFolder(node: TreeData) {
  return !node.url
}

export function findBookmarkInTree(
  items: TreeData[],
  id: string,
): TreeData | undefined {
  for (const item of items) {
    if (item.id === id) {
      return item
    }

    const childMatch = findBookmarkInTree(item.children ?? [], id)

    if (childMatch) {
      return childMatch
    }
  }

  return undefined
}

export function collectBookmarkIds(items: TreeData[]): string[] {
  const ids: string[] = []

  function visit(nodes: TreeData[]) {
    for (const node of nodes) {
      ids.push(node.id)
      visit(node.children ?? [])
    }
  }

  visit(items)
  return ids
}

export function removeBookmarksFromTree(
  items: TreeData[],
  ids: ReadonlySet<string>,
): TreeData[] {
  return items.flatMap((item) => {
    if (ids.has(item.id)) {
      return []
    }

    if (!item.children) {
      return [item]
    }

    return [{ ...item, children: removeBookmarksFromTree(item.children, ids) }]
  })
}

/**
 * Resolves the selected ids into the nodes worth handing to `chrome.bookmarks`.
 *
 * Call this against the unfiltered tree: a filtered tree drops folders whose descendants
 * do not match, which loses the ancestor links that keep a node from being removed twice.
 */
export function planBookmarkDeletion(
  items: TreeData[],
  selectedIds: ReadonlySet<string>,
  isDeletable: (node: TreeData) => boolean = () => true,
): BookmarkDeletionPlan {
  const removals: TreeData[] = []
  const blocked: TreeData[] = []

  function collect(nodes: TreeData[], isCoveredByAncestor: boolean) {
    for (const node of nodes) {
      if (!selectedIds.has(node.id)) {
        collect(node.children ?? [], isCoveredByAncestor)
        continue
      }

      if (isCoveredByAncestor) {
        continue
      }

      if (!isDeletable(node)) {
        blocked.push(node)
        // The node stays, but its children are deletable on their own.
        collect(node.children ?? [], false)
        continue
      }

      removals.push(node)
      collect(node.children ?? [], true)
    }
  }

  collect(items, false)

  let folderCount = 0
  let linkCount = 0

  function count(nodes: TreeData[]) {
    for (const node of nodes) {
      if (isBookmarkFolder(node)) {
        folderCount += 1
      } else {
        linkCount += 1
      }

      count(node.children ?? [])
    }
  }

  count(removals)

  return {
    blocked,
    folderCount,
    linkCount,
    removedIds: new Set(collectBookmarkIds(removals)),
    removals,
  }
}
