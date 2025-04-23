import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/collection')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_layout/collection"!</div>
}
