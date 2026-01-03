'use client'

import * as d3 from 'd3'
import { useEffect, useRef } from 'react'

interface User {
  user_id: string
  display_name: string
  interests: string[]
  age: number
  location: string
}

interface FeatureOverlapProps {
  users: User[]
  selectedUser: string | null
  onUserSelect?: (userId: string | null) => void
}

export default function FeatureOverlap({
  users,
  selectedUser,
  onUserSelect,
}: FeatureOverlapProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || users.length === 0) return

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove()

    const width = 800
    const height = 600
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    if (!selectedUser) {
      // Show interest frequency chart when no user selected
      const interestCounts = new Map<string, number>()

      users.forEach(user => {
        user.interests?.forEach(interest => {
          interestCounts.set(interest, (interestCounts.get(interest) || 0) + 1)
        })
      })

      const data = Array.from(interestCounts.entries())
        .map(([interest, count]) => ({ interest, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20) // Top 20 interests

      const margin = { top: 40, right: 30, bottom: 120, left: 60 }
      const chartWidth = width - margin.left - margin.right
      const chartHeight = height - margin.top - margin.bottom

      const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

      // Scales
      const xScale = d3
        .scaleBand()
        .domain(data.map(d => d.interest))
        .range([0, chartWidth])
        .padding(0.1)

      const yScale = d3
        .scaleLinear()
        .domain([0, Math.max(...data.map(d => d.count))])
        .range([chartHeight, 0])

      // Color scale
      const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

      // Bars
      g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.interest)!)
        .attr('y', d => yScale(d.count))
        .attr('width', xScale.bandwidth())
        .attr('height', d => chartHeight - yScale(d.count))
        .attr('fill', (d, i) => colorScale(i.toString()))

      // X axis
      g.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .style('font-size', '10px')

      // Y axis
      g.append('g').call(d3.axisLeft(yScale))

      // Title
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('Most Common Interests Across All Users')

      // Y axis label
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - chartHeight / 2)
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Number of Users')
    } else {
      // Show Venn diagram of overlapping interests with selected user
      const selectedUserData = users.find(u => u.user_id === selectedUser)
      if (!selectedUserData) return

      const otherUsers = users.filter(u => u.user_id !== selectedUser)

      // Calculate overlaps with each other user
      const overlaps = otherUsers
        .map(otherUser => {
          const commonInterests =
            selectedUserData.interests?.filter(interest =>
              otherUser.interests?.includes(interest)
            ) || []

          return {
            user: otherUser,
            commonInterests,
            commonCount: commonInterests.length,
            totalInterests: new Set([
              ...(selectedUserData.interests || []),
              ...(otherUser.interests || []),
            ]).size,
          }
        })
        .sort((a, b) => b.commonCount - a.commonCount)
        .slice(0, 10) // Top 10 overlapping users

      const centerX = width / 2
      const centerY = height / 2
      const radius = 150

      // Draw selected user in center
      const centerGroup = svg
        .append('g')
        .attr('transform', `translate(${centerX},${centerY})`)

      centerGroup
        .append('circle')
        .attr('r', 60)
        .attr('fill', '#4285F4')
        .attr('fill-opacity', 0.3)
        .attr('stroke', '#4285F4')
        .attr('stroke-width', 2)

      centerGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .style('font-weight', 'bold')
        .style('font-size', '14px')
        .text(selectedUserData.display_name.replace('Demo: ', ''))

      // Draw other users in a circle around
      overlaps.forEach((overlap, i) => {
        const angle = (i / overlaps.length) * 2 * Math.PI
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius

        const g = svg.append('g').attr('transform', `translate(${x},${y})`)

        // Circle size based on overlap
        const circleRadius = 20 + overlap.commonCount * 5

        g.append('circle')
          .attr('r', circleRadius)
          .attr('fill', d3.schemeCategory10[i % 10])
          .attr('fill-opacity', 0.3)
          .attr('stroke', d3.schemeCategory10[i % 10])
          .attr('stroke-width', 2)

        // User name
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '-0.3em')
          .style('font-size', '10px')
          .text(overlap.user.display_name.replace('Demo: ', ''))

        // Common count
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '1em')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(overlap.commonCount)

        // Draw connection line
        svg
          .append('line')
          .attr('x1', centerX)
          .attr('y1', centerY)
          .attr('x2', x)
          .attr('y2', y)
          .attr('stroke', '#999')
          .attr('stroke-width', overlap.commonCount / 2)
          .attr('stroke-opacity', 0.3)

        // Tooltip on hover
        const tooltip = d3
          .select('body')
          .append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('padding', '10px')
          .style('background', 'rgba(0,0,0,0.8)')
          .style('color', 'white')
          .style('border-radius', '5px')
          .style('pointer-events', 'none')
          .style('opacity', 0)
          .style('font-size', '12px')

        g.on('mouseover', event => {
          tooltip
            .style('opacity', 1)
            .html(
              `
              <strong>${overlap.user.display_name}</strong><br/>
              Common interests: ${overlap.commonInterests.join(', ')}<br/>
              Total overlap: ${overlap.commonCount}/${overlap.totalInterests}
            `
            )
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`)
        }).on('mouseout', () => {
          tooltip.style('opacity', 0)
        })
      })

      // Title
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text(
          `Interest Overlap with ${selectedUserData.display_name.replace('Demo: ', '')}`
        )

      // Legend
      svg
        .append('text')
        .attr('x', width - 150)
        .attr('y', height - 20)
        .style('font-size', '12px')
        .style('fill', '#666')
        .text('Circle size = # common interests')
    }
  }, [users, selectedUser])

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">
            Select User for Overlap Analysis:
          </label>
          <select
            value={selectedUser || ''}
            onChange={e => onUserSelect?.(e.target.value || null)}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Users (Interest Distribution)</option>
            {users.map(user => (
              <option key={user.user_id} value={user.user_id}>
                {user.display_name}
              </option>
            ))}
          </select>
        </div>
        {selectedUser && (
          <button
            onClick={() => onUserSelect?.(null)}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-200"
          >
            Clear Selection
          </button>
        )}
      </div>
      <svg ref={svgRef}></svg>
      {!selectedUser && (
        <p className="mt-2 text-sm text-gray-500">
          Showing overall interest distribution. Select a user above to see
          their specific overlaps with others.
        </p>
      )}
    </div>
  )
}
