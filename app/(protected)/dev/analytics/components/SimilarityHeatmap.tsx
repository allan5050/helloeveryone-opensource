'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface User {
  user_id: string
  display_name: string
}

interface MatchScore {
  user1_id: string
  user2_id: string
  score: number
}

interface SimilarityHeatmapProps {
  users: User[]
  matchScores: MatchScore[]
  onUserSelect: (userId: string | null) => void
}

export default function SimilarityHeatmap({
  users,
  matchScores,
  onUserSelect
}: SimilarityHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || users.length === 0) return

    // Clear previous heatmap
    d3.select(svgRef.current).selectAll('*').remove()

    const margin = { top: 120, right: 50, bottom: 50, left: 100 }
    const width = 800 - margin.left - margin.right
    const height = 600 - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Create matrix data
    const matrix: number[][] = []
    const userIds = users.map(u => u.user_id)
    const userNames = users.map(u => u.display_name.replace('Demo: ', ''))

    // Initialize matrix with zeros
    for (let i = 0; i < users.length; i++) {
      matrix[i] = new Array(users.length).fill(0)
      matrix[i][i] = 1 // Self-similarity is 1
    }

    // Fill matrix with match scores
    matchScores.forEach(score => {
      const i = userIds.indexOf(score.user1_id)
      const j = userIds.indexOf(score.user2_id)
      if (i >= 0 && j >= 0) {
        matrix[i][j] = score.score
        matrix[j][i] = score.score // Symmetric
      }
    })

    // Create scales
    const xScale = d3.scaleBand()
      .domain(userNames)
      .range([0, width])
      .padding(0.01)

    const yScale = d3.scaleBand()
      .domain(userNames)
      .range([0, height])
      .padding(0.01)

    // Custom color interpolator from gray to green
    const colorScale = d3.scaleSequential((t) => {
      if (t < 0.3) {
        // Gray for low scores
        const gray = Math.round(200 - t * 100)
        return `rgb(${gray}, ${gray}, ${gray})`
      } else if (t < 0.6) {
        // Light green for medium scores
        const intensity = (t - 0.3) / 0.3
        return d3.interpolateRgb('#d4d4d4', '#86efac')(intensity)
      } else {
        // Green for high scores
        const intensity = (t - 0.6) / 0.4
        return d3.interpolateRgb('#86efac', '#22c55e')(intensity)
      }
    }).domain([0, 1])

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '10px')
      .style('background', 'rgba(0,0,0,0.8)')
      .style('color', 'white')
      .style('border-radius', '5px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('font-size', '12px')

    // Create cells
    const cells = g.selectAll('rect')
      .data(matrix.flatMap((row, i) =>
        row.map((value, j) => ({
          x: i,
          y: j,
          value,
          user1: userNames[i],
          user2: userNames[j]
        }))
      ))
      .enter().append('rect')
      .attr('x', d => xScale(d.user1)!)
      .attr('y', d => yScale(d.user2)!)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.value))
      .attr('stroke', 'white')
      .attr('stroke-width', 0.5)
      .style('cursor', d => d.x !== d.y ? 'pointer' : 'default')
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(`
            <strong>${d.user1} ↔ ${d.user2}</strong><br/>
            Score: ${d.value.toFixed(3)}
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0)
      })
      .on('click', (event, d) => {
        if (d.x !== d.y) {
          onUserSelect(userIds[d.x])
        }
      })

    // Add X axis labels with better positioning
    g.append('g')
      .attr('transform', `translate(0, -10)`)
      .selectAll('text')
      .data(userNames)
      .enter().append('text')
      .text(d => d)
      .attr('x', 0)
      .attr('y', 0)
      .attr('transform', d => `translate(${xScale(d)! + xScale.bandwidth() / 2}, 0) rotate(-65)`)
      .attr('text-anchor', 'end')
      .style('font-size', '9px')
      .style('font-weight', '400')

    // Add Y axis labels
    g.append('g')
      .selectAll('text')
      .data(userNames)
      .enter().append('text')
      .text(d => d)
      .attr('x', -5)
      .attr('y', d => yScale(d)! + yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .style('font-size', '10px')

    // Add color legend
    const legendWidth = 200
    const legendHeight = 20

    const legendScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, legendWidth])

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d3.format('.1f'))

    const legend = svg.append('g')
      .attr('transform', `translate(${width - legendWidth}, 20)`)

    // Create gradient for legend
    const defs = svg.append('defs')
    const gradient = defs.append('linearGradient')
      .attr('id', 'heatmap-gradient')

    const numStops = 10
    for (let i = 0; i <= numStops; i++) {
      gradient.append('stop')
        .attr('offset', `${(i / numStops) * 100}%`)
        .attr('stop-color', colorScale(i / numStops))
    }

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#heatmap-gradient)')

    legend.append('g')
      .attr('transform', `translate(0, ${legendHeight})`)
      .call(legendAxis)

    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('Similarity Score')

    // Cleanup
    return () => {
      tooltip.remove()
    }
  }, [users, matchScores, onUserSelect])

  return (
    <div className="w-full overflow-auto">
      <svg ref={svgRef}></svg>
    </div>
  )
}