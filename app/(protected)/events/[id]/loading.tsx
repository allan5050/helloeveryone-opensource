export default function EventDetailsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Button Skeleton */}
        <div className="mb-6 h-6 w-32 animate-pulse rounded bg-gray-200"></div>

        {/* Event Details Skeleton */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-8 w-64 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-6 w-16 animate-pulse rounded bg-gray-200"></div>
                </div>
                <div className="mb-6 flex items-center">
                  <div className="mr-3 h-10 w-10 animate-pulse rounded-full bg-gray-200"></div>
                  <div>
                    <div className="mb-1 h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-200"></div>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 text-center sm:text-right">
                <div className="mb-4">
                  <div className="mx-auto mb-1 h-8 w-16 animate-pulse rounded bg-gray-200 sm:mx-0"></div>
                  <div className="mx-auto h-4 w-24 animate-pulse rounded bg-gray-200 sm:mx-0"></div>
                </div>
                <div className="h-12 w-full animate-pulse rounded bg-gray-200 sm:w-32"></div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200"></div>
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center">
                        <div className="mr-3 h-5 w-5 animate-pulse rounded bg-gray-200"></div>
                        <div className="h-4 w-48 animate-pulse rounded bg-gray-200"></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-3 h-6 w-40 animate-pulse rounded bg-gray-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                    <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200"></div>
                    <div className="h-4 w-4/6 animate-pulse rounded bg-gray-200"></div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center">
                      <div className="mr-3 h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
