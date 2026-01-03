'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

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
}

export default function NetworkGraph({
  users,
  matchScores,
  selectedUser,
  onUserSelect
}: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || users.length === 0) return

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove()

    const width = 800
    const height = 600
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    // Create nodes from users
    const nodes = users.map(user => ({
      id: user.user_id,
      name: user.display_name.replace('Demo: ', ''),
      interests: user.interests,
      age: user.age,
      location: user.location
    }))

    // Get user IDs that are in the filtered set
    const filteredUserIds = new Set(users.map(u => u.user_id))

    // Create links from match scores, ensuring both nodes exist
    const links = matchScores
      .filter(score => {
        // Only include links where both users are in the filtered set
        return score.score > 0.2 &&
               filteredUserIds.has(score.user1_id) &&
               filteredUserIds.has(score.user2_id)
      })
      .map(score => ({
        source: score.user1_id,
        target: score.user2_id,
        value: score.score,
        strength: score.score > 0.6 ? 'strong' : score.score > 0.4 ? 'medium' : 'weak'
      }))

    // Color scale for interest categories
    const getNodeColor = (interests: string[]) => {
      if (!interests?.length) return '#999'

      // Categorize by primary interest domain
      const categories: Record<string, string> = {
        'data': '#4285F4',      // Blue for data/tech
        'tech': '#4285F4',
        'machine': '#4285F4',
        'software': '#4285F4',
        'health': '#0F9D58',    // Green for health/fitness
        'fitness': '#0F9D58',
        'yoga': '#0F9D58',
        'running': '#0F9D58',
        'art': '#F4B400',       // Yellow for creative
        'design': '#F4B400',
        'music': '#F4B400',
        'photography': '#F4B400',
        'food': '#DB4437',      // Red for lifestyle
        'cooking': '#DB4437',
        'wine': '#DB4437',
        'coffee': '#DB4437',
        'dog': '#9C27B0',       // Purple for pets
        'cat': '#9C27B0',
        'pet': '#9C27B0'
      }

      // Find primary category
      for (const interest of interests) {
        for (const [key, color] of Object.entries(categories)) {
          if (interest.toLowerCase().includes(key)) {
            return color
          }
        }
      }
      return '#666' // Default gray
    }

    // Create force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(d => 150 * (1 - d.value))) // Closer for higher scores
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))

    // Create container for zoom
    const container = svg.append('g')

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform)
      })

    svg.call(zoom as any)

    // Create links with varying thickness and color
    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', d => {
        if (d.value > 0.6) return '#22c55e' // Strong - green
        if (d.value > 0.4) return '#3b82f6' // Medium - blue
        return '#9ca3af' // Weak - gray
      })
      .attr('stroke-opacity', d => Math.max(0.3, d.value))
      .attr('stroke-width', d => {
        if (d.value > 0.6) return 4 // Strong connections
        if (d.value > 0.4) return 2 // Medium connections
        return 1 // Weak connections
      })
      .attr('stroke-dasharray', d => d.value < 0.3 ? '2,2' : 'none') // Dashed for very weak

    // Create nodes
    const node = container.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('cursor', 'pointer')
      .on('click', (event, d: any) => {
        event.stopPropagation()
        onUserSelect(d.id === selectedUser ? null : d.id)
      })

    // Add circles for nodes
    node.append('circle')
      .attr('r', d => {
        const connectionCount = links.filter(l =>
          l.source === d.id || l.target === d.id
        ).length
        return Math.min(20, 10 + connectionCount)
      })
      .attr('fill', d => getNodeColor(d.interests))
      .attr('stroke', d => d.id === selectedUser ? '#000' : '#fff')
      .attr('stroke-width', d => d.id === selectedUser ? 3 : 1.5)

    // Add labels
    node.append('text')
      .text(d => d.name)
      .attr('x', 0)
      .attr('y', -25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', d => d.id === selectedUser ? 'bold' : 'normal')

    // Add drag behavior
    const drag = d3.drag()
      .on('start', (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d: any) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
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
      link.attr('stroke', (d: any) => {
        if (d.source.id === selectedUser || d.target.id === selectedUser) {
          return '#000'
        }
        return '#999'
      })
      .attr('stroke-opacity', (d: any) => {
        if (d.source.id === selectedUser || d.target.id === selectedUser) {
          return 1
        }
        return 0.2
      })

      node.attr('opacity', (d: any) => {
        if (d.id === selectedUser) return 1
        const connected = links.some(l =>
          (l.source === selectedUser && l.target === d.id) ||
          (l.target === selectedUser && l.source === d.id)
        )
        return connected ? 1 : 0.3
      })
    }

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [users, matchScores, selectedUser, onUserSelect])

  return (
    <div className="relative">
      <svg ref={svgRef} className="w-full border rounded"></svg>
      <div className="absolute top-2 right-2 bg-white p-3 rounded shadow text-xs space-y-3">
        <div>
          <div className="font-semibold mb-1">Node Colors (Primary Interest):</div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Tech/Data</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Health/Fitness</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Creative/Arts</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Food/Lifestyle</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Pets</span>
            </div>
          </div>
        </div>
        <div>
          <div className="font-semibold mb-1">Connection Strength:</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-green-500"></div>
              <span>Strong (&gt;60%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-blue-500"></div>
              <span>Medium (40-60%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 border-b border-dashed border-gray-400"></div>
              <span>Weak (&lt;40%)</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
        <p className="text-gray-600">
          <strong>Graph Insights:</strong> Nodes cluster naturally based on shared interests and compatibility scores.
          Thicker, greener lines indicate stronger matches based on multiple dimensions (interests, age, location).
          Users positioned closer together have more mutual connections. Click any node to highlight their network.
        </p>
      </div>
    </div>
  )
}