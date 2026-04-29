import { PushToTalk } from '@/components/PushToTalk'

export default async function PrSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const prNumber = Number(id)

  if (!Number.isFinite(prNumber) || prNumber <= 0) {
    return (
      <article>
        <h1>Invalid PR</h1>
        <p>
          PR identifiers must be positive integers. Try{' '}
          <code>/pr/123</code>.
        </p>
      </article>
    )
  }

  return (
    <article>
      <h1>Voice session — PR #{prNumber}</h1>
      <p>
        Hold the button and describe the change. The agent will confirm, then
        write a spec for Claude Code.
      </p>
      <PushToTalk prNumber={prNumber} />
    </article>
  )
}
