export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="mb-2 h-8 w-64 animate-pulse rounded bg-gray-200"></div>
          <div className="h-4 w-96 animate-pulse rounded bg-gray-200"></div>
        </div>

        {/* Filters Skeleton */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded bg-gray-200"
              ></div>
            ))}
          </div>
        </div>

        {/* Events Grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="h-6 w-3/4 rounded bg-gray-200"></div>
                <div className="h-5 w-16 rounded bg-gray-200"></div>
              </div>
              <div className="mb-4 h-4 w-full rounded bg-gray-200"></div>
              <div className="mb-4 space-y-2">
                <div className="h-4 w-full rounded bg-gray-200"></div>
                <div className="h-4 w-2/3 rounded bg-gray-200"></div>
                <div className="h-4 w-1/2 rounded bg-gray-200"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-gray-200"></div>
              </div>
              <div className="mt-4 h-2 rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
