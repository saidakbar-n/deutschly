const sampleNotifications = [
  { id: 1, text: 'saidakbar followed you', time: '2m ago' },
  { id: 2, text: 'lena liked your post', time: '10m ago' },
  { id: 3, text: 'New story from max', time: '1h ago' },
]

export function Notifications() {
  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Notifications</h3>
      </div>
      {sampleNotifications.map((n) => (
        <div key={n.id} className="flex justify-between items-center border rounded-xl px-3 py-2">
          <p className="text-sm">{n.text}</p>
          <span className="text-xs text-slate-500">{n.time}</span>
        </div>
      ))}
    </div>
  )
}
