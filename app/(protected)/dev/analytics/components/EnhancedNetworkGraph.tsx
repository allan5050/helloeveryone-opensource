'use client'

import * as d3 from 'd3'
import { Maximize2, Minimize2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { areZipsNearby } from '@/lib/location/zip-distance'

interface User {
  user_id: string
  display_name: string
  age: number
  location: string
  interests: string[]
}

interface MatchScore {
  user1_id: string
  user2_id: string
  score: number
}

interface NetworkGraphProps {
  users: User[]
  matchScores: MatchScore[]
  selectedUser: string | null
  onUserSelect: (userId: string | null) => void
  minScore: number
  currentUserId?: string
}

type LayoutMode = 'force' | 'geographic' | 'interest' | 'age' | 'community'

export default function EnhancedNetworkGraph({
  users,
  matchScores,
  selectedUser,
  onUserSelect,
  minScore = 0.3,
  currentUserId,
}: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('force')
  const [communities, setCommunities] = useState<Map<string, number>>(new Map())
  const [clusterExplanation, setClusterExplanation] = useState<string>('')
  const [communityDetails, setCommunityDetails] = useState<Map<number, string>>(
    new Map()
  )
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!svgRef.current || users.length === 0) return

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove()

    const _containerElement = containerRef.current
    const width = isFullscreen ? window.innerWidth - 100 : 1200
    const height = isFullscreen ? window.innerHeight - 200 : 800
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    // Create nodes from users
    const nodes = users.map(user => ({
      id: user.user_id,
      name: user.display_name.replace('Demo: ', ''),
      interests: user.interests,
      age: user.age,
      location: user.location,
      isCurrentUser: user.user_id === currentUserId,
    }))

    // Get user IDs that are in the filtered set
    const filteredUserIds = new Set(users.map(u => u.user_id))

    // Create links from match scores, ensuring both nodes exist
    const links = matchScores
      .filter(score => {
        return (
          score.score >= minScore &&
          filteredUserIds.has(score.user1_id) &&
          filteredUserIds.has(score.user2_id)
        )
      })
      .map(score => ({
        source: score.user1_id,
        target: score.user2_id,
        value: score.score,
        strength:
          score.score > 0.6 ? 'strong' : score.score > 0.4 ? 'medium' : 'weak',
      }))

    // Detect communities using a simple algorithm
    const detectCommunities = () => {
      const communities = new Map<string, number>()
      let communityId = 0

      // Build adjacency list
      const adjacency = new Map<string, Set<string>>()
      links.forEach(link => {
        const source =
          typeof link.source === 'string'
            ? link.source
            : (link.source as any).id
        const target =
          typeof link.target === 'string'
            ? link.target
            : (link.target as any).id

        if (!adjacency.has(source)) adjacency.set(source, new Set())
        if (!adjacency.has(target)) adjacency.set(target, new Set())
        adjacency.get(source)!.add(target)
        adjacency.get(target)!.add(source)
      })

      // Assign communities using BFS
      const visited = new Set<string>()

      nodes.forEach(node => {
        if (!visited.has(node.id)) {
          const queue = [node.id]
          const currentCommunity = communityId++

          while (queue.length > 0) {
            const current = queue.shift()!
            if (visited.has(current)) continue

            visited.add(current)
            communities.set(current, currentCommunity)

            const neighbors = adjacency.get(current) || new Set()
            neighbors.forEach(neighbor => {
              if (!visited.has(neighbor)) {
                queue.push(neighbor)
              }
            })
          }
        }
      })

      return communities
    }

    const communityMap = detectCommunities()
    setCommunities(communityMap)

    // Analyze each community to find common attributes
    const analyzeCommunities = () => {
      const details = new Map<number, string>()
      const communityGroups = d3.group(
        Array.from(communityMap.entries()),
        d => d[1]
      )

      communityGroups.forEach((members, communityId) => {
        const communityUsers = users.filter(u =>
          members.some(m => m[0] === u.user_id)
        )

        if (communityUsers.length > 1) {
          // Find common interests with more sophisticated grouping
          const interestCounts = new Map<string, number>()
          const interestCategories = new Map<string, string[]>()

          // Define interest categories for better grouping
          const categories = {
            'Tech/Gaming': [
              'sci-fi',
              'star-wars',
              'video-games',
              'programming',
              'tech',
              'anime',
              'esports',
              'virtual-reality',
            ],
            Fitness: [
              'crossfit',
              'yoga',
              'running',
              'cycling',
              'triathlon',
              'hiking',
              'nutrition',
              'fitness',
            ],
            Arts: [
              'art',
              'painting',
              'photography',
              'music',
              'concerts',
              'creative-writing',
              'poetry',
            ],
            'Food/Drink': [
              'coffee',
              'wine',
              'cooking',
              'baking',
              'craft-beer',
              'farmers-markets',
              'restaurants',
            ],
            Family: ['parenting', 'kids', 'pta', 'playdates', 'family'],
            Environment: [
              'sustainability',
              'climate',
              'vegan',
              'organic',
              'zero-waste',
            ],
            Intellectual: [
              'books',
              'philosophy',
              'politics',
              'history',
              'documentaries',
              'museums',
            ],
            Sports: [
              'basketball',
              'football',
              'baseball',
              'warriors',
              'giants',
              'fantasy-football',
            ],
          }

          communityUsers.forEach(user => {
            user.interests?.forEach(interest => {
              interestCounts.set(
                interest,
                (interestCounts.get(interest) || 0) + 1
              )

              // Find category for interest
              for (const [category, keywords] of Object.entries(categories)) {
                if (
                  keywords.some(
                    k => interest.includes(k) || k.includes(interest)
                  )
                ) {
                  if (!interestCategories.has(category)) {
                    interestCategories.set(category, [])
                  }
                  interestCategories.get(category)!.push(interest)
                  break
                }
              }
            })
          })

          // Find dominant interest category
          let dominantCategory = ''
          let maxCategoryScore = 0
          interestCategories.forEach((interests, category) => {
            const score = interests.length
            if (score > maxCategoryScore) {
              maxCategoryScore = score
              dominantCategory = category
            }
          })

          // Find interests shared by at least 40% of the community (lowered threshold for diversity)
          const commonInterests = Array.from(interestCounts.entries())
            .filter(([_, count]) => count >= communityUsers.length * 0.4)
            .sort((a, b) => b[1] - a[1])
            .map(([interest, _]) => interest)
            .slice(0, 3)

          // Analyze location proximity
          const locationCounts = new Map<string, number>()
          const locationClusters: string[][] = []

          communityUsers.forEach(user => {
            locationCounts.set(
              user.location,
              (locationCounts.get(user.location) || 0) + 1
            )
          })

          // Group nearby zip codes
          const locations = Array.from(
            new Set(communityUsers.map(u => u.location))
          )
          const processedLocations = new Set<string>()

          locations.forEach(loc1 => {
            if (processedLocations.has(loc1)) return
            const cluster = [loc1]
            processedLocations.add(loc1)

            locations.forEach(loc2 => {
              if (
                !processedLocations.has(loc2) &&
                areZipsNearby(loc1, loc2, 5)
              ) {
                cluster.push(loc2)
                processedLocations.add(loc2)
              }
            })

            if (cluster.length > 0) {
              locationClusters.push(cluster)
            }
          })

          // Find dominant location cluster
          let dominantLocationDesc = ''
          const largestCluster = locationClusters.sort(
            (a, b) => b.length - a.length
          )[0]
          if (
            largestCluster &&
            largestCluster.length >= communityUsers.length * 0.5
          ) {
            if (largestCluster.length === 1) {
              dominantLocationDesc = `${largestCluster[0]} area`
            } else {
              // Show zip code range for nearby areas
              const prefix = largestCluster[0].substring(0, 3)
              dominantLocationDesc = `${prefix}xx area`
            }
          }

          // Calculate age range instead of just average
          const ages = communityUsers.map(u => u.age)
          const minAge = Math.min(...ages)
          const maxAge = Math.max(...ages)
          const avgAge = Math.round(d3.mean(ages) || 0)
          const ageDesc =
            minAge === maxAge
              ? `Age ${minAge}`
              : `Ages ${minAge}-${maxAge} (avg ${avgAge})`

          // Check if current user is in this community
          const hasCurrentUser =
            currentUserId &&
            communityUsers.some(u => u.user_id === currentUserId)

          // Build richer description with explanations
          let description = `${communityUsers.length} members`

          if (dominantCategory) {
            description += ` • ${dominantCategory} focus`
            // Add explanation of how category was determined
            const categoryInterests =
              interestCategories.get(dominantCategory) || []
            if (categoryInterests.length > 0) {
              const uniqueInterests = [...new Set(categoryInterests)].slice(
                0,
                3
              )
              description += ` (${uniqueInterests.join(', ')})`
            }
          }

          if (commonInterests.length > 0) {
            const percentage = Math.round(
              ((interestCounts.get(commonInterests[0]) || 0) /
                communityUsers.length) *
                100
            )
            description += ` • ${percentage}% share: ${commonInterests.map(i => i.replace(/-/g, ' ')).join(', ')}`
          }

          if (dominantLocationDesc) {
            description += ` • ${dominantLocationDesc}`
          }

          description += ` • ${ageDesc}`

          if (hasCurrentUser) {
            description += ' • ⭐ YOUR COMMUNITY'
          }

          details.set(communityId, description)
        }
      })

      setCommunityDetails(details)
    }

    analyzeCommunities()

    // Generate cluster explanation based on current state
    const generateExplanation = () => {
      const numCommunities = new Set(communityMap.values()).size
      const isolatedNodes = nodes.filter(n => !communityMap.has(n.id)).length
      const _avgLinksPerNode = (links.length * 2) / nodes.length

      let explanation = `With minimum score ${(minScore * 100).toFixed(0)}%, `

      if (numCommunities === 1 && isolatedNodes === 0) {
        explanation += `all users form a single connected community. This suggests broad compatibility across the platform.`
      } else if (numCommunities > 1 || isolatedNodes > 0) {
        explanation += `users separate into ${numCommunities} distinct communities`
        if (isolatedNodes > 0) {
          explanation += ` with ${isolatedNodes} isolated users`
        }
        explanation += `. Higher thresholds reveal tighter, more compatible groups. `

        if (minScore >= 0.5) {
          explanation += `At this threshold, only strong matches connect, showing natural friend groups based on multiple shared dimensions.`
        } else {
          explanation += `At this threshold, moderate connections are visible, showing potential for broader social interaction.`
        }
      }

      setClusterExplanation(explanation)
    }

    generateExplanation()

    // Color schemes
    const getNodeColor = (node: any) => {
      switch (layoutMode) {
        case 'community':
          const community = communityMap.get(node.id) || 0
          return d3.schemeCategory10[community % 10]

        case 'geographic':
          const locationColors: Record<string, string> = {
            '94102': '#e74c3c',
            '94103': '#3498db',
            '94107': '#2ecc71',
            '94108': '#f39c12',
            '94110': '#9b59b6',
          }
          return locationColors[node.location] || '#95a5a6'

        case 'age':
          const ageScale = d3
            .scaleSequential(d3.interpolateViridis)
            .domain([25, 45])
          return ageScale(node.age)

        case 'interest':
        case 'force':
        default:
          // Original interest-based coloring
          if (!node.interests?.length) return '#999'
          const firstInterest = node.interests[0].toLowerCase()
          if (firstInterest.includes('data') || firstInterest.includes('tech'))
            return '#4285F4'
          if (
            firstInterest.includes('health') ||
            firstInterest.includes('fitness')
          )
            return '#0F9D58'
          if (firstInterest.includes('art') || firstInterest.includes('design'))
            return '#F4B400'
          if (firstInterest.includes('food') || firstInterest.includes('cook'))
            return '#DB4437'
          if (firstInterest.includes('dog') || firstInterest.includes('cat'))
            return '#9C27B0'
          return '#666'
      }
    }

    // Layout algorithms
    const getLayout = () => {
      switch (layoutMode) {
        case 'geographic':
          // Group by location
          const locationGroups = d3.group(nodes, d => d.location)
          const locations = Array.from(locationGroups.keys())
          locations.forEach((loc, i) => {
            const nodesInLoc = locationGroups.get(loc) || []
            const angleStep = (2 * Math.PI) / locations.length
            const centerX = width / 2 + Math.cos(angleStep * i) * 200
            const centerY = height / 2 + Math.sin(angleStep * i) * 200

            nodesInLoc.forEach((node: any, j) => {
              const subAngle = (2 * Math.PI * j) / nodesInLoc.length
              node.fx = centerX + Math.cos(subAngle) * 50
              node.fy = centerY + Math.sin(subAngle) * 50
            })
          })
          break

        case 'age':
          // Position by age on x-axis
          const ageExtent = d3.extent(nodes, d => d.age) as [number, number]
          const ageScale = d3
            .scaleLinear()
            .domain(ageExtent)
            .range([100, width - 100])

          nodes.forEach((node: any) => {
            node.fx = ageScale(node.age)
            node.fy = height / 2 + (Math.random() - 0.5) * 200
          })
          break

        case 'interest':
          // Cluster by primary interest
          const interestGroups = d3.group(
            nodes,
            d => d.interests?.[0] || 'none'
          )
          const interests = Array.from(interestGroups.keys())
          interests.forEach((interest, i) => {
            const nodesWithInterest = interestGroups.get(interest) || []
            const centerX = 150 + (i % 4) * 200
            const centerY = 150 + Math.floor(i / 4) * 200

            nodesWithInterest.forEach((node: any, j) => {
              const angle = (2 * Math.PI * j) / nodesWithInterest.length
              node.fx = centerX + Math.cos(angle) * 60
              node.fy = centerY + Math.sin(angle) * 60
            })
          })
          break

        case 'community':
          // Position by detected communities
          const communityGroups = d3.group(
            Array.from(communityMap.entries()),
            d => d[1]
          )
          const _numCommunities = communityGroups.size
          let communityIndex = 0

          communityGroups.forEach((members, _communityId) => {
            const communityNodes = nodes.filter((n: any) =>
              members.some(m => m[0] === n.id)
            )
            const centerX = 150 + (communityIndex % 3) * 250
            const centerY = 150 + Math.floor(communityIndex / 3) * 250

            communityNodes.forEach((node: any, j) => {
              const angle = (2 * Math.PI * j) / communityNodes.length
              node.fx = centerX + Math.cos(angle) * 80
              node.fy = centerY + Math.sin(angle) * 80
            })
            communityIndex++
          })
          break

        default:
          // Regular force-directed layout
          nodes.forEach((node: any) => {
            node.fx = null
            node.fy = null
          })
      }
    }

    // Apply layout
    getLayout()

    // Create force simulation
    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(d => (layoutMode === 'force' ? 150 * (1 - d.value) : 50))
      )
      .force(
        'charge',
        d3.forceManyBody().strength(layoutMode === 'force' ? -100 : -30)
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))

    // Create container for zoom
    const container = svg.append('g')

    // Add zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', event => {
        container.attr('transform', event.transform)
      })

    svg.call(zoom as any)

    // Create links
    const link = container
      .append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', d => {
        if (d.value > 0.6) return '#22c55e'
        if (d.value > 0.4) return '#3b82f6'
        return '#9ca3af'
      })
      .attr('stroke-opacity', d => Math.max(0.3, d.value))
      .attr('stroke-width', d => {
        if (d.value > 0.6) return 4
        if (d.value > 0.4) return 2
        return 1
      })
      .attr('stroke-dasharray', d => (d.value < 0.3 ? '2,2' : 'none'))

    // Create nodes
    const node = container
      .append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .on('click', (event, d: any) => {
        event.stopPropagation()
        onUserSelect(d.id === selectedUser ? null : d.id)
      })

    // Add circles for nodes
    node
      .append('circle')
      .attr('r', d => {
        if (d.isCurrentUser) return 25 // Larger size for current user
        const connectionCount = links.filter(
          l =>
            l.source === d.id ||
            l.target === d.id ||
            (l.source as any).id === d.id ||
            (l.target as any).id === d.id
        ).length
        return Math.min(20, 10 + connectionCount)
      })
      .attr('fill', d => {
        if (d.isCurrentUser) return '#fbbf24' // Bright yellow/gold for current user
        return getNodeColor(d)
      })
      .attr('stroke', d => {
        if (d.isCurrentUser) return '#dc2626' // Red border for current user
        return d.id === selectedUser ? '#000' : '#fff'
      })
      .attr('stroke-width', d => {
        if (d.isCurrentUser) return 4
        return d.id === selectedUser ? 3 : 1.5
      })
      .attr('opacity', d => (d.isCurrentUser ? 1 : 0.9))

    // Add labels
    node
      .append('text')
      .text(d =>
        d.isAllan ? d.name : d.isCurrentUser ? `⭐ ${d.name} (YOU)` : d.name
      )
      .attr('x', 0)
      .attr('y', d => {
        const offset = isFullscreen ? 45 : 35
        return d.isCurrentUser || d.isAllan ? -offset : -(offset - 10)
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', d => {
        if (isFullscreen) {
          return d.isCurrentUser || d.isAllan ? '20px' : '16px'
        }
        return d.isCurrentUser || d.isAllan ? '16px' : '13px'
      })
      .attr('font-weight', d =>
        d.isCurrentUser || d.isAllan || d.id === selectedUser
          ? 'bold'
          : 'normal'
      )
      .attr('fill', d =>
        d.isAllan ? '#d97706' : d.isCurrentUser ? '#dc2626' : '#000'
      )

    // Add community labels for community view (rendered after simulation stabilizes)
    if (layoutMode === 'community') {
      setTimeout(() => {
        const communityGroups = d3.group(
          Array.from(communityMap.entries()),
          d => d[1]
        )
        communityGroups.forEach((members, communityId) => {
          const communityNodes = nodes.filter((n: any) =>
            members.some(m => m[0] === n.id)
          )
          if (communityNodes.length > 1) {
            // Calculate bounds of community
            const xValues = communityNodes.map((d: any) => d.x || d.fx || 0)
            const yValues = communityNodes.map((d: any) => d.y || d.fy || 0)
            const minY = Math.min(...yValues)
            const centerX = d3.mean(xValues) || 0

            // Position label above the topmost node with extra padding
            const labelOffset = isFullscreen ? 80 : 65
            container
              .append('text')
              .attr('x', centerX)
              .attr('y', minY - labelOffset)
              .attr('text-anchor', 'middle')
              .attr('font-size', isFullscreen ? '18px' : '14px')
              .attr('font-weight', 'bold')
              .attr('fill', '#666')
              .style('text-shadow', '0 0 3px white, 0 0 3px white')
              .text(`Community ${communityId + 1}`)
          }
        })
      }, 1000) // Wait for simulation to stabilize
    }

    // Add drag behavior
    const drag = d3
      .drag()
      .on('start', (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        if (layoutMode === 'force') {
          d.fx = d.x
          d.fy = d.y
        }
      })
      .on('drag', (event, d: any) => {
        if (layoutMode === 'force') {
          d.fx = event.x
          d.fy = event.y
        }
      })
      .on('end', (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0)
        if (layoutMode === 'force') {
          d.fx = null
          d.fy = null
        }
      })

    node.call(drag as any)

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    // Highlight selected user's connections
    if (selectedUser) {
      link
        .attr('stroke', (d: any) => {
          if (
            d.source.id === selectedUser ||
            d.target.id === selectedUser ||
            d.source === selectedUser ||
            d.target === selectedUser
          ) {
            return '#000'
          }
          return d.value > 0.6
            ? '#22c55e'
            : d.value > 0.4
              ? '#3b82f6'
              : '#9ca3af'
        })
        .attr('stroke-opacity', (d: any) => {
          if (
            d.source.id === selectedUser ||
            d.target.id === selectedUser ||
            d.source === selectedUser ||
            d.target === selectedUser
          ) {
            return 1
          }
          return 0.2
        })

      node.attr('opacity', (d: any) => {
        if (d.id === selectedUser) return 1
        const connected = links.some(
          l =>
            (l.source === selectedUser && l.target === d.id) ||
            (l.target === selectedUser && l.source === d.id) ||
            ((l.source as any).id === selectedUser &&
              (l.target as any).id === d.id) ||
            ((l.target as any).id === selectedUser &&
              (l.source as any).id === d.id)
        )
        return connected ? 1 : 0.3
      })
    }

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [
    users,
    matchScores,
    selectedUser,
    onUserSelect,
    minScore,
    layoutMode,
    isFullscreen,
  ])

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
      setIsFullscreen(true)
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }
      setIsFullscreen(false)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 overflow-auto bg-white p-8' : ''}`}
    >
      {/* Layout Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <label
              className={`mb-1 block font-medium ${isFullscreen ? 'text-lg' : 'text-sm'}`}
            >
              Graph Layout:
            </label>
            <select
              value={layoutMode}
              onChange={e => setLayoutMode(e.target.value as LayoutMode)}
              className={`rounded-md border border-gray-200 px-3 py-2 ${isFullscreen ? 'text-base' : 'text-sm'}`}
            >
              <option value="force">Force-Directed (Natural Clustering)</option>
              <option value="community">Community Detection</option>
              <option value="geographic">Geographic (By Zip Code)</option>
              <option value="age">Age Distribution</option>
              <option value="interest">Interest Groups</option>
            </select>
          </div>
        </div>
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          <span className={isFullscreen ? 'text-base' : 'text-sm'}>
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </span>
        </button>
      </div>

      {/* Graph */}
      <div className="relative">
        <svg ref={svgRef} className="w-full rounded border bg-gray-50"></svg>

        {/* Legend */}
        <div
          className={`absolute right-2 top-2 max-w-xs space-y-3 rounded bg-white p-3 shadow ${isFullscreen ? 'p-4 text-base' : 'text-xs'}`}
        >
          <div>
            <div className="mb-1 font-semibold">
              {layoutMode === 'community'
                ? 'Communities (Auto-Detected):'
                : layoutMode === 'geographic'
                  ? 'Colors by Zip Code:'
                  : layoutMode === 'age'
                    ? 'Colors by Age (Purple=Young, Yellow=Older):'
                    : 'Colors by Primary Interest:'}
            </div>
            {layoutMode === 'geographic' && (
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: '#e74c3c' }}
                  ></div>
                  <span>94102</span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: '#3498db' }}
                  ></div>
                  <span>94103</span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: '#2ecc71' }}
                  ></div>
                  <span>94107</span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: '#f39c12' }}
                  ></div>
                  <span>94108</span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: '#9b59b6' }}
                  ></div>
                  <span>94110</span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: '#95a5a6' }}
                  ></div>
                  <span>Other</span>
                </div>
              </div>
            )}
            {layoutMode === 'community' && (
              <div
                className={`text-gray-600 ${isFullscreen ? 'text-base' : 'text-xs'}`}
              >
                {communities.size > 0 &&
                  `${new Set(communities.values()).size} communities detected`}
              </div>
            )}
            {(layoutMode === 'force' || layoutMode === 'interest') && (
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span>Tech/Data</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span>Health/Fitness</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <span>Creative/Arts</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span>Food/Lifestyle</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  <span>Pets</span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: '#666' }}
                  ></div>
                  <span>Other Interests</span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: '#999' }}
                  ></div>
                  <span>No Interests</span>
                </div>
              </div>
            )}
          </div>
          <div>
            <div className="mb-1 font-semibold">Edge Strength:</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-1 w-6 bg-green-500"></div>
                <span>Strong (&gt;60%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-6 bg-blue-500"></div>
                <span>Medium (40-60%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 border-b border-dashed border-gray-400"></div>
                <span>Weak (&lt;40%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Explanation */}
      <div className="rounded-lg bg-blue-50 p-4">
        <h4
          className={`mb-2 font-semibold ${isFullscreen ? 'text-lg' : 'text-sm'}`}
        >
          Why These Clusters?
        </h4>
        <p
          className={`text-gray-700 ${isFullscreen ? 'text-base' : 'text-sm'}`}
        >
          {clusterExplanation}
        </p>
        <div
          className={`mt-2 text-gray-600 ${isFullscreen ? 'text-base' : 'text-xs'}`}
        >
          <strong>Key Insight:</strong> Communities form based on multiple
          shared dimensions:
          <ul className="mt-1 list-inside list-disc space-y-1">
            <li>
              <strong>Interest Alignment:</strong> People with similar hobbies
              and passions (e.g., all gamers, all fitness enthusiasts)
            </li>
            <li>
              <strong>Geographic Proximity:</strong> Within ~5km for regular
              meetups (using intelligent zip code clustering)
            </li>
            <li>
              <strong>Life Stage:</strong> Similar age ranges often indicate
              compatible life situations
            </li>
            <li>
              <strong>Cultural Affinity:</strong> Shared values and lifestyle
              choices create natural bonds
            </li>
          </ul>
          <div className="mt-2 rounded bg-yellow-50 p-2">
            <strong>Note:</strong> Real communities emerge from behavioral
            clusters - techies hang with techies, athletes with athletes,
            parents with parents. Our algorithm detects these natural social
            patterns.
          </div>
        </div>
      </div>

      {/* Layout-specific insights */}
      {layoutMode === 'community' && (
        <div className="rounded-lg bg-green-50 p-4">
          <h4
            className={`mb-2 font-semibold ${isFullscreen ? 'text-lg' : 'text-sm'}`}
          >
            Community Detection Insights
          </h4>
          <p
            className={`mb-3 text-gray-700 ${isFullscreen ? 'text-base' : 'text-sm'}`}
          >
            Communities represent groups where everyone is transitively
            connected through the network. These are natural "friend groups"
            that could benefit from group events.
          </p>
          {communityDetails.size > 0 && (
            <div className="space-y-3">
              <div
                className={`mb-2 font-semibold ${isFullscreen ? 'text-base' : 'text-xs'}`}
              >
                Community Characteristics:
              </div>
              {Array.from(communityDetails.entries()).map(
                ([id, description]) => {
                  const isYourCommunity = description.includes('YOUR COMMUNITY')
                  return (
                    <div
                      key={id}
                      className={`rounded border-l-4 p-3 ${isFullscreen ? 'text-base' : 'text-xs'} ${
                        isYourCommunity
                          ? 'border-yellow-500 bg-yellow-50 shadow-md'
                          : 'border-green-500 bg-white'
                      }`}
                    >
                      <div className="mb-1 font-semibold">
                        Community {id + 1} {isYourCommunity && '⭐'}
                      </div>
                      <div className="text-gray-700">{description}</div>
                    </div>
                  )
                }
              )}

              <div
                className={`rounded bg-blue-50 p-3 ${isFullscreen ? 'text-base' : 'text-xs'}`}
              >
                <div className="mb-1 font-semibold">
                  How Categories Are Determined:
                </div>
                <ul className="list-inside list-disc space-y-1 text-gray-700">
                  <li>
                    <strong>Interest Focus:</strong> Keywords in interests are
                    grouped into categories (Tech/Gaming, Fitness, Arts, etc.)
                  </li>
                  <li>
                    <strong>Shared Interests:</strong> Percentage shows how many
                    members share specific interests
                  </li>
                  <li>
                    <strong>Geographic Clustering:</strong> Zip codes within
                    ~5km are grouped together (e.g., "941xx area")
                  </li>
                  <li>
                    <strong>Age Ranges:</strong> Shows the spread and average
                    age within the community
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {layoutMode === 'geographic' && (
        <div className="rounded-lg bg-yellow-50 p-4">
          <h4
            className={`mb-2 font-semibold ${isFullscreen ? 'text-lg' : 'text-sm'}`}
          >
            Geographic Distribution
          </h4>
          <p
            className={`text-gray-700 ${isFullscreen ? 'text-base' : 'text-sm'}`}
          >
            Users are grouped by zip code. Lines between groups show
            cross-neighborhood connections. This view helps identify
            location-based meetup opportunities and shows how geography affects
            social connections.
          </p>
        </div>
      )}
    </div>
  )
}
