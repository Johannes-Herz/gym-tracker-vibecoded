import type { ReactNode } from 'react'

export default function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {action}
    </header>
  )
}
