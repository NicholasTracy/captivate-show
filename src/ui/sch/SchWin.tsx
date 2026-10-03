import { useSnap } from '../../store/store'

export default function SchWin() {
  const { show } = useSnap()
  return (
    <div style={{ padding: 24 }}>
      <h2>Scheduler</h2>
      <p style={{ color: '#999' }}>Schedule sequences by date and time.</p>
      {show.sched.length === 0 ? (
        <p style={{ color: '#999' }}>No scheduled shows yet.</p>
      ) : (
        <ul>
          {show.sched.map((s) => (
            <li key={s.id}>{s.at} - {show.seqs.find((q) => q.id === s.seqId)?.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
