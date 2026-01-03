'use client'

import * as d3 from 'd3'
import { useEffect, useRef } from 'react'

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

interface DimensionGraphsProps {
  users: User[]
  matchScores: MatchScore[]
  minScore: number
}

export default function DimensionGraphs({
  users,
  matchScores,
  minScore,
}: DimensionGraphsProps) {
  const ageRef = useRef<SVGSVGElement>(null)
  const locationRef = useRef<SVGSVGElement>(null)
  const connectivityRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!ageRef.current || !locationRef.current || !connectivityRef.current)
      return
    if (users.length === 0) return

    // Clear previous graphs
    d3.select(ageRef.current).selectAll('*').remove()
    d3.select(locationRef.current).selectAll('*').remove()
    d3.select(connectivityRef.current).selectAll('*').remove()

    // Filter match scores
    const filteredMatches = matchScores.filter(s => s.score >= minScore)

    // 1. Age Distribution with Connections
    const drawAgeDistribution = () => {
      const svg = d3.select(ageRef.current)
      const width = 280
      const height = 200
      const margin = { top: 20, right: 20, bottom: 40, left: 40 }

      svg.attr('width', width).attr('height', height)

      // Group users by age
      const ageGroups = d3.rollup(
        users,
        v => v.length,
        d => d.age
      )
      const ageData = Array.from(ageGroups, ([age, count]) => ({
        age,
        count,
      })).sort((a, b) => a.age - b.age)

      // Scales
      const xScale = d3
        .scaleLinear()
        .domain(d3.extent(ageData, d => d.age) as [number, number])
        .range([margin.left, width - margin.right])

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(ageData, d => d.count) as number])
        .range([height - margin.bottom, margin.top])

      // Draw bars
      svg
        .selectAll('rect')
        .data(ageData)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.age) - 5)
        .attr('y', d => yScale(d.count))
        .attr('width', 10)
        .attr('height', d => height - margin.bottom - yScale(d.count))
        .attr('fill', '#3b82f6')
        .attr('opacity', 0.7)

      // X axis
      svg
        .append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format('d')))

      // Y axis
      svg
        .append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale).ticks(5))

      // Title
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text('Age Distribution')
    }

    // 2. Location Clustering
    const drawLocationClustering = () => {
      const svg = d3.select(locationRef.current)
      const width = 280
      const height = 200

      svg.attr('width', width).attr('height', height)

      // Group by location
      const locationGroups = d3.rollup(
        users,
        v => v.length,
        d => d.location
      )
      const locationData = Array.from(locationGroups, ([location, count]) => ({
        location,
        count,
      }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5) // Top 5 locations

      // Calculate connections within each location
      const locationConnections = new Map<string, number>()
      locationData.forEach(({ location }) => {
        const usersInLocation = users.filter(u => u.location === location)
        const userIds = new Set(usersInLocation.map(u => u.user_id))
        const connections = filteredMatches.filter(
          m => userIds.has(m.user1_id) && userIds.has(m.user2_id)
        ).length
        locationConnections.set(location, connections)
      })

      // Scales
      const xScale = d3
        .scaleBand()
        .domain(locationData.map(d => d.location))
        .range([20, width - 20])
        .padding(0.1)

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(locationData, d => d.count) as number])
        .range([height - 40, 30])

      // Draw bars
      svg
        .selectAll('rect')
        .data(locationData)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.location)!)
        .attr('y', d => yScale(d.count))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - 40 - yScale(d.count))
        .attr('fill', '#10b981')
        .attr('opacity', 0.7)

      // Add connection count labels
      svg
        .selectAll('.connection-label')
        .data(locationData)
        .enter()
        .append('text')
        .attr('class', 'connection-label')
        .attr('x', d => xScale(d.location)! + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.count) - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', '#666')
        .text(d => `${locationConnections.get(d.location) || 0} links`)

      // X axis labels
      svg
        .selectAll('.x-label')
        .data(locationData)
        .enter()
        .append('text')
        .attr('class', 'x-label')
        .attr('x', d => xScale(d.location)! + xScale.bandwidth() / 2)
        .attr('y', height - 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .text(d => d.location)

      // Title
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text('Location Clusters')
    }

    // 3. Connectivity Distribution
    const drawConnectivityDistribution = () => {
      const svg = d3.select(connectivityRef.current)
      const width = 280
      const height = 200

      svg.attr('width', width).attr('height', height)

      // Calculate connection count for each user
      const connectionCounts = new Map<string, number>()
      users.forEach(user => {
        const connections = filteredMatches.filter(
          m => m.user1_id === user.user_id || m.user2_id === user.user_id
        ).length
        connectionCounts.set(user.user_id, connections)
      })

      // Group by connection count
      const connectivityGroups = d3.rollup(
        Array.from(connectionCounts.values()),
        v => v.length,
        d => d
      )
      const connectivityData = Array.from(
        connectivityGroups,
        ([connections, count]) => ({
          connections,
          count,
        })
      ).sort((a, b) => a.connections - b.connections)

      // Scales
      const xScale = d3
        .scaleLinear()
        .domain([0, d3.max(connectivityData, d => d.connections) as number])
        .range([40, width - 20])

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(connectivityData, d => d.count) as number])
        .range([height - 40, 30])

      // Draw line
      const line = d3
        .line<{ connections: number; count: number }>()
        .x(d => xScale(d.connections))
        .y(d => yScale(d.count))
        .curve(d3.curveMonotoneX)

      svg
        .append('path')
        .datum(connectivityData)
        .attr('fill', 'none')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 2)
        .attr('d', line)

      // Draw points
      svg
        .selectAll('circle')
        .data(connectivityData)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.connections))
        .attr('cy', d => yScale(d.count))
        .attr('r', 4)
        .attr('fill', '#f59e0b')

      // X axis
      svg
        .append('g')
        .attr('transform', `translate(0,${height - 40})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format('d')))

      // Y axis
      svg
        .append('g')
        .attr('transform', `translate(40,0)`)
        .call(d3.axisLeft(yScale).ticks(5))

      // Title
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text('Connection Distribution')

      // Label for axis
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .text('# Connections')
    }

    drawAgeDistribution()
    drawLocationClustering()
    drawConnectivityDistribution()
  }, [users, matchScores, minScore])

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-lg border bg-white p-4">
        <svg ref={ageRef}></svg>
        <p className="mt-2 text-xs text-gray-600">
          Shows how users are distributed by age. Taller bars indicate age
          groups with more users.
        </p>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <svg ref={locationRef}></svg>
        <p className="mt-2 text-xs text-gray-600">
          Top 5 locations by user count. Numbers show connections within each
          location.
        </p>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <svg ref={connectivityRef}></svg>
        <p className="mt-2 text-xs text-gray-600">
          Distribution of connection counts. Shows how many users have X
          connections.
        </p>
      </div>
    </div>
  )
}
