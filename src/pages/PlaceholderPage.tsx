import PageHeader from '../components/PageHeader'

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <p className="muted">Kommt bald.</p>
    </>
  )
}
