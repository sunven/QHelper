import type { ComponentProps } from 'react'
import { Link, useInRouterContext } from 'react-router'

export function WorkspaceLink({
  href,
  ...props
}: ComponentProps<'a'> & { href: string }) {
  const inRouter = useInRouterContext()
  return inRouter ? (
    <Link to={href.replace(/^\/tools/, '')} {...props} />
  ) : (
    <a href={href} {...props} />
  )
}
