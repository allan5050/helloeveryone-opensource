'use client'

import { RefreshCw, Filter } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useAuth } from '@/app/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import AlgorithmPerformance from './components/AlgorithmPerformance'
import DimensionGraphs from './components/DimensionGraphs'
import EnhancedNetworkGraph from './components/EnhancedNetworkGraph'
import FeatureOverlap from './components/FeatureOverlap'
import SimilarityHeatmap from './components/SimilarityHeatmap'
import UserTable from './components/UserTable'

interface User {
  user_id: string
  display_name: string
  age: number
  location: string
  interests: string[]
  bio: string
}

interface MatchScore {
  user1_id: string
  user2_id: string
  score: number
  interest_overlap: number
  location_match: number
  age_compatibility: number
}

export default function AnalyticsPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [matchScores, setMatchScores] = useState<MatchScore[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [minScore, setMinScore] = useState(0.3)
  const [filterInterest, setFilterInterest] = useState<string>('all')
  const [allInterests, setAllInterests] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch demo users
      const usersRes = await fetch('/api/dev/analytics/users')
      const usersData = await usersRes.json()
      setUsers(usersData.users)

      // Extract all unique interests
      const interests = new Set<string>()
      usersData.users.forEach((user: User) => {
        user.interests?.forEach(interest => interests.add(interest))
      })
      setAllInterests(Array.from(interests).sort())

      // Fetch or calculate match scores
      const scoresRes = await fetch('/api/dev/analytics/match-scores')
      const scoresData = await scoresRes.json()
      setMatchScores(scoresData.scores)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }

  const recalculateScores = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dev/analytics/recalculate', {
        method: 'POST',
      })
      const data = await res.json()
      setMatchScores(data.scores)
    } catch (error) {
      console.error('Error recalculating scores:', error)
    }
    setLoading(false)
  }

  const filteredUsers =
    filterInterest === 'all'
      ? users
      : users.filter(u => u.interests?.includes(filterInterest))

  const filteredScores = matchScores.filter(s => {
    if (s.score < minScore) return false
    if (filterInterest === 'all') return true

    const user1 = users.find(u => u.user_id === s.user1_id)
    const user2 = users.find(u => u.user_id === s.user2_id)
    return (
      user1?.interests?.includes(filterInterest) ||
      user2?.interests?.includes(filterInterest)
    )
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-3 text-4xl font-bold text-gray-900">
            User Analytics Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Data science visualization for user matching algorithms
          </p>
        </div>

        {/* Stats Cards - Moved to top */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{users.length}</div>
              <p className="text-sm text-gray-500">Demo profiles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">
                Avg Match Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {matchScores.length > 0
                  ? (
                      matchScores.reduce((a, b) => a + b.score, 0) /
                      matchScores.length
                    ).toFixed(2)
                  : '0.00'}
              </div>
              <p className="text-sm text-gray-500">Across all pairs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">
                Strong Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {matchScores.filter(s => s.score > 0.7).length}
              </div>
              <p className="text-sm text-gray-500">Score &gt; 0.7</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">
                Unique Interests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{allInterests.length}</div>
              <p className="text-sm text-gray-500">Across platform</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Controls - Moved closer to graph */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-base font-medium">
                  Interest Filter
                </label>
                <Select
                  value={filterInterest}
                  onValueChange={setFilterInterest}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Interests</SelectItem>
                    {allInterests.map(interest => (
                      <SelectItem key={interest} value={interest}>
                        {interest}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-base font-medium">
                  Min Score: {minScore.toFixed(2)}
                </label>
                <Slider
                  value={[minScore]}
                  onValueChange={([v]) => setMinScore(v)}
                  min={0}
                  max={1}
                  step={0.05}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-base font-medium">
                  Selected User
                </label>
                <Select
                  value={selectedUser || 'none'}
                  onValueChange={v => setSelectedUser(v === 'none' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={recalculateScores} disabled={loading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recalculate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visualizations */}
        <Tabs defaultValue="network" className="space-y-4">
          <TabsList className="grid w-full max-w-lg grid-cols-5 text-base">
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
            <TabsTrigger value="overlap">Overlap</TabsTrigger>
            <TabsTrigger value="table">Data</TabsTrigger>
            <TabsTrigger value="algorithm">Algorithm</TabsTrigger>
          </TabsList>

          <TabsContent value="network">
            <Card>
              <CardHeader>
                <CardTitle>User Network Graph</CardTitle>
                <CardDescription>
                  Interactive force-directed graph showing user relationships
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <EnhancedNetworkGraph
                  users={filteredUsers}
                  matchScores={filteredScores}
                  selectedUser={selectedUser}
                  onUserSelect={setSelectedUser}
                  minScore={minScore}
                  currentUserId={currentUser?.id}
                />

                <div>
                  <h3 className="mb-3 text-lg font-semibold">
                    Additional Dimensions
                  </h3>
                  <DimensionGraphs
                    users={filteredUsers}
                    matchScores={filteredScores}
                    minScore={minScore}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heatmap">
            <Card>
              <CardHeader>
                <CardTitle>Similarity Heatmap</CardTitle>
                <CardDescription>
                  Pairwise similarity scores between all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimilarityHeatmap
                  users={filteredUsers}
                  matchScores={filteredScores}
                  onUserSelect={setSelectedUser}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overlap">
            <Card>
              <CardHeader>
                <CardTitle>Feature Overlap Analysis</CardTitle>
                <CardDescription>
                  Visualize common interests and attributes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureOverlap
                  users={filteredUsers}
                  selectedUser={selectedUser}
                  onUserSelect={setSelectedUser}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>User Data Table</CardTitle>
                <CardDescription>
                  Raw user data with attributes and scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserTable
                  users={filteredUsers}
                  matchScores={filteredScores}
                  selectedUser={selectedUser}
                  onUserSelect={setSelectedUser}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="algorithm">
            <Card>
              <CardHeader>
                <CardTitle>Matching Algorithm Deep Dive</CardTitle>
                <CardDescription>
                  Technical details and methodology for data scientists
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Core Algorithm */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-3 text-lg font-semibold">
                    Core Matching Algorithm
                  </h3>
                  <div className="space-y-3 text-base">
                    <div className="rounded border bg-white p-3 font-mono">
                      <div>match_score = Σ(w_i × f_i)</div>
                      <div className="mt-2 text-gray-600">where:</div>
                      <div className="ml-4">w_i = weight for dimension i</div>
                      <div className="ml-4">
                        f_i = similarity score for dimension i
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dimension Breakdown */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 font-semibold">
                      Interest Similarity (35%)
                    </h4>
                    <p className="mb-2 text-sm text-gray-600">
                      Combines exact and fuzzy matching for robust interest
                      alignment
                    </p>
                    <div className="space-y-1 font-mono text-xs">
                      <div>exact = Jaccard(interests_A, interests_B)</div>
                      <div>
                        fuzzy = LevenshteinRatio(interests_A, interests_B)
                      </div>
                      <div>score = 0.7 × exact + 0.3 × fuzzy</div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 font-semibold">
                      Semantic Similarity (25%)
                    </h4>
                    <p className="mb-2 text-sm text-gray-600">
                      Bio embeddings using OpenAI text-embedding-3-small
                    </p>
                    <div className="space-y-1 font-mono text-xs">
                      <div>embed_A = OpenAI(bio_A) // 1536 dims</div>
                      <div>embed_B = OpenAI(bio_B)</div>
                      <div>score = cosine_similarity(embed_A, embed_B)</div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 font-semibold">
                      Age Compatibility (15%)
                    </h4>
                    <p className="mb-2 text-sm text-gray-600">
                      Gaussian decay function for natural age preferences
                    </p>
                    <div className="space-y-1 font-mono text-xs">
                      <div>diff = |age_A - age_B|</div>
                      <div>score = exp(-(diff²) / 100)</div>
                      <div>{/* Peaks at same age, decays smoothly */}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 font-semibold">
                      Location Proximity (15%)
                    </h4>
                    <p className="mb-2 text-sm text-gray-600">
                      Geographic distance with decay function
                    </p>
                    <div className="space-y-1 font-mono text-xs">
                      <div>if zip_A == zip_B: score = 1.0</div>
                      <div>elif adjacent: score = 0.7</div>
                      <div>elif nearby: score = 0.3</div>
                      <div>else: score = 0.0</div>
                    </div>
                  </div>
                </div>

                {/* Advanced Techniques */}
                <div className="rounded-lg bg-blue-50 p-4">
                  <h3 className="mb-3 text-lg font-semibold">
                    Advanced Techniques
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">
                        Diversity Factor (Future)
                      </h4>
                      <p className="text-xs text-gray-600">
                        Adding controlled randomness to prevent echo chambers:
                      </p>
                      <div className="mt-1 font-mono text-xs">
                        final_score = 0.9 × match_score + 0.1 × random()
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">
                        Interest Weighting (Future)
                      </h4>
                      <p className="text-xs text-gray-600">
                        User-defined importance levels for interests (1-5 scale)
                      </p>
                      <div className="mt-1 font-mono text-xs">
                        weighted_jaccard = Σ(w_i × match_i) / Σ(w_i)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="rounded-lg bg-green-50 p-4">
                  <h3 className="mb-3 text-lg font-semibold">
                    Performance & Scalability
                  </h3>
                  <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                    <div>
                      <div className="font-semibold">Computation Time</div>
                      <div className="text-gray-600">~2ms per pair</div>
                      <div className="text-xs text-gray-500">
                        O(n²) complexity
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">Database</div>
                      <div className="text-gray-600">
                        pgvector for embeddings
                      </div>
                      <div className="text-xs text-gray-500">HNSW indexing</div>
                    </div>
                    <div>
                      <div className="font-semibold">Caching</div>
                      <div className="text-gray-600">Materialized views</div>
                      <div className="text-xs text-gray-500">15-min TTL</div>
                    </div>
                  </div>
                </div>

                {/* Privacy & Ethics */}
                <div className="rounded-lg bg-purple-50 p-4">
                  <h3 className="mb-3 text-lg font-semibold">
                    Privacy & Ethical Considerations
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <h4 className="font-semibold">Mutual Visibility</h4>
                      <p className="text-gray-600">
                        Users can only filter by attributes they themselves
                        share, preventing discriminatory filtering.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Diversity Preservation</h4>
                      <p className="text-gray-600">
                        10% randomness factor prevents complete homophily,
                        encouraging exposure to diverse perspectives.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Progressive Disclosure</h4>
                      <p className="text-gray-600">
                        Match strength shown as categories (Low/Medium/High) to
                        end users, not exact percentages, reducing optimization
                        gaming.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Stats */}
                <div className="rounded-lg bg-gray-100 p-4">
                  <h3 className="mb-3 text-lg font-semibold">
                    Current System Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div>
                      <div className="text-3xl font-bold">{users.length}</div>
                      <div className="text-gray-600">Total Users</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">
                        {matchScores.length}
                      </div>
                      <div className="text-gray-600">Computed Pairs</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">
                        {matchScores.filter(s => s.score > 0.5).length}
                      </div>
                      <div className="text-gray-600">Strong Matches</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">
                        {matchScores.length > 0
                          ? (
                              (matchScores.reduce((a, b) => a + b.score, 0) /
                                matchScores.length) *
                              100
                            ).toFixed(0)
                          : 0}
                        %
                      </div>
                      <div className="text-gray-600">Avg Match Score</div>
                    </div>
                  </div>
                </div>

                {/* Algorithm Performance Visualizations */}
                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold">
                    Algorithm Performance Analysis
                  </h3>
                  <AlgorithmPerformance
                    users={users}
                    matchScores={matchScores}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
