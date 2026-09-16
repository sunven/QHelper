import { describe, expect, it } from 'vitest'
import type { TreeData } from '@/components/fe-tools/TreeTable'
import {
  collectBookmarkIds,
  findBookmarkInTree,
  isBookmarkFolder,
  planBookmarkDeletion,
  removeBookmarksFromTree,
} from './bookmark-tree'

const tree: TreeData[] = [
  {
    id: 'folder',
    title: 'Folder',
    children: [
      { id: 'a', title: 'Alpha', url: 'https://example.com/a' },
      {
        id: 'nested',
        title: 'Nested',
        children: [{ id: 'b', title: 'Beta', url: 'https://example.com/b' }],
      },
    ],
  },
  { id: 'loose', title: 'Loose', url: 'https://example.com/loose' },
]

function idsOf(nodes: TreeData[]) {
  return nodes.map((node) => node.id)
}

describe('bookmark tree', () => {
  it('treats nodes without a url as folders', () => {
    expect(isBookmarkFolder({ id: 'folder' })).toBe(true)
    expect(isBookmarkFolder({ id: 'empty', children: [] })).toBe(true)
    expect(isBookmarkFolder({ id: 'link', url: 'https://example.com' })).toBe(
      false,
    )
    // A filtering pass rewrites links into this shape, which is not a folder.
    expect(
      isBookmarkFolder({ id: 'link', url: 'https://example.com', children: [] }),
    ).toBe(false)
  })

  it('finds nested bookmarks and collects subtree ids', () => {
    expect(findBookmarkInTree(tree, 'b')?.title).toBe('Beta')
    expect(findBookmarkInTree(tree, 'missing')).toBeUndefined()
    expect(collectBookmarkIds(tree)).toEqual([
      'folder',
      'a',
      'nested',
      'b',
      'loose',
    ])
  })

  it('keeps only the topmost node when a folder and its descendant are selected', () => {
    const plan = planBookmarkDeletion(tree, new Set(['folder', 'a']))

    expect(idsOf(plan.removals)).toEqual(['folder'])
    expect([...plan.removedIds].sort()).toEqual(['a', 'b', 'folder', 'nested'])
  })

  it('counts folders and links across the whole removal closure', () => {
    const plan = planBookmarkDeletion(tree, new Set(['folder']))

    expect(plan.folderCount).toBe(2)
    expect(plan.linkCount).toBe(2)
    expect(plan.folderCount + plan.linkCount).toBe(plan.removedIds.size)
  })

  it('counts a filtered link as a link rather than a folder', () => {
    const filteredTree: TreeData[] = [
      {
        id: 'folder',
        title: 'Folder',
        children: [
          {
            id: 'a',
            title: 'Alpha',
            url: 'https://example.com/a',
            children: [],
          },
        ],
      },
    ]
    const plan = planBookmarkDeletion(filteredTree, new Set(['a']))

    expect(idsOf(plan.removals)).toEqual(['a'])
    expect(plan.folderCount).toBe(0)
    expect(plan.linkCount).toBe(1)
  })

  it('treats an empty folder as a folder', () => {
    const plan = planBookmarkDeletion(
      [{ id: 'empty', children: [] }],
      new Set(['empty']),
    )

    expect(plan.folderCount).toBe(1)
    expect(plan.linkCount).toBe(0)
    expect(idsOf(plan.removals)).toEqual(['empty'])
  })

  it('ignores ids that are not in the tree', () => {
    const plan = planBookmarkDeletion(tree, new Set(['missing', 'loose']))

    expect(idsOf(plan.removals)).toEqual(['loose'])
    expect(plan.blocked).toEqual([])
  })

  it('blocks undeletable nodes but still removes their selected children', () => {
    const plan = planBookmarkDeletion(
      tree,
      new Set(['folder', 'a']),
      (node) => node.id !== 'folder',
    )

    expect(idsOf(plan.blocked)).toEqual(['folder'])
    expect(idsOf(plan.removals)).toEqual(['a'])
    expect([...plan.removedIds]).toEqual(['a'])
  })

  it('keeps ancestors that were not selected', () => {
    const plan = planBookmarkDeletion(tree, new Set(['a']))
    const remaining = removeBookmarksFromTree(tree, plan.removedIds)

    expect(idsOf(plan.removals)).toEqual(['a'])
    expect(idsOf(remaining)).toEqual(['folder', 'loose'])
    expect(remaining[0]?.children?.map((node) => node.id)).toEqual(['nested'])
  })

  it('drops whole subtrees when pruning the tree', () => {
    const remaining = removeBookmarksFromTree(tree, new Set(['folder']))

    expect(idsOf(remaining)).toEqual(['loose'])
  })
})
