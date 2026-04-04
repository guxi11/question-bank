export const ProgressBar = ({
  current,
  total,
}: {
  current: number
  total: number
}) => (
  <div className="w-full bg-gray-200 rounded-full h-1.5">
    <div
      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
      style={{ width: `${((current + 1) / total) * 100}%` }}
    />
  </div>
)
