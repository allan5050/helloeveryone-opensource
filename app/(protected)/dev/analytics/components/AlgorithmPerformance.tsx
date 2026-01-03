'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

interface User {
  user_id: string
  display_name: string
  age: number
  location: string
  interests: string[]
  bio: string
}

interface AlgorithmPerformanceProps {
  users: User[]
  matchScores: any[]
}

export default function AlgorithmPerformance({ users, matchScores }: AlgorithmPerformanceProps) {
  const interestClusterRef = useRef<SVGSVGElement>(null)
  const similarityMatrixRef = useRef<SVGSVGElement>(null)
  const demographicsRef = useRef<SVGSVGElement>(null)
  const sponsorMetricsRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!users.length) return

    // Clear previous visualizations
    if (interestClusterRef.current) d3.select(interestClusterRef.current).selectAll('*').remove()
    if (similarityMatrixRef.current) d3.select(similarityMatrixRef.current).selectAll('*').remove()
    if (demographicsRef.current) d3.select(demographicsRef.current).selectAll('*').remove()
    if (sponsorMetricsRef.current) d3.select(sponsorMetricsRef.current).selectAll('*').remove()

    // 1. Interest Clustering Visualization
    const drawInterestClustering = () => {
      const svg = d3.select(interestClusterRef.current)
      const width = 500
      const height = 400
      const margin = { top: 40, right: 40, bottom: 40, left: 40 }
      svg.attr('width', width).attr('height', height)

      // Define interest categories and their relationships
      const interestCategories = {
        'Tech/Data': ['data-science', 'machine-learning', 'software-engineering', 'devops', 'cybersecurity', 'blockchain', 'ai', 'nlp', 'automation', 'cloud-computing', 'infrastructure', 'qa-testing', 'data-engineering', 'data-analysis', 'tech', 'technology', 'home-automation'],
        'Health/Wellness': ['healthcare', 'medical-research', 'fitness', 'yoga', 'running', 'pilates', 'nutrition', 'wellness', 'triathlon', 'healthcare-tech', 'healthtech', 'health', 'meditation', 'mindfulness'],
        'Creative': ['art', 'design', 'photography', 'music', 'writing', 'illustration', 'sketching', 'ux-design', 'graphic-design', 'content-strategy', 'creative'],
        'Social': ['volunteering', 'community', 'mentoring', 'networking', 'social-impact', 'social-media', 'digital-marketing', 'education', 'edtech', 'parenting'],
        'Lifestyle': ['cooking', 'food', 'wine', 'coffee', 'travel', 'gardening', 'baking', 'bbq', 'vegan-cooking', 'brewing', 'cocktails', 'beer', 'craft-beer'],
        'Entertainment': ['gaming', 'board-games', 'movies', 'reading', 'podcasts', 'sci-fi', 'star-trek', 'star-wars', 'science-fiction', 'books', 'game-design'],
        'Pets': ['dogs', 'cats', 'pets', 'animals'],
        'Sports': ['basketball', 'golf', 'cycling', 'hiking', 'climbing', 'triathlon', 'sports', 'mountain-biking'],
        'Business': ['entrepreneurship', 'finance', 'marketing', 'product-management', 'business', 'business-analysis', 'fintech', 'ad-tech', 'hr-tech', 'legal-tech']
      }

      // Count interests by category
      const categoryCounts = new Map<string, number>()
      const interestToCategory = new Map<string, string>()

      Object.entries(interestCategories).forEach(([category, interests]) => {
        interests.forEach(interest => {
          interestToCategory.set(interest, category)
        })
      })

      // Count user interests by category
      users.forEach(user => {
        user.interests?.forEach(interest => {
          const category = interestToCategory.get(interest) || 'Other'
          categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1)
        })
      })

      // Create nodes for force-directed graph
      const nodes = Array.from(categoryCounts.entries()).map(([name, count]) => ({
        id: name,
        count,
        radius: Math.sqrt(count) * 5
      }))

      // Create links between related categories
      const links = [
        { source: 'Tech/Data', target: 'Business', strength: 0.7 },
        { source: 'Tech/Data', target: 'Creative', strength: 0.5 },
        { source: 'Health/Wellness', target: 'Sports', strength: 0.8 },
        { source: 'Creative', target: 'Business', strength: 0.6 },
        { source: 'Lifestyle', target: 'Entertainment', strength: 0.5 },
        { source: 'Social', target: 'Business', strength: 0.4 }
      ].filter(link =>
        nodes.some(n => n.id === link.source) && nodes.some(n => n.id === link.target)
      )

      // Force simulation with boundaries
      const simulation = d3.forceSimulation(nodes as any)
        .force('link', d3.forceLink(links)
          .id((d: any) => d.id)
          .distance(100))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius((d: any) => d.radius + 5))
        .force('x', d3.forceX(width / 2).strength(0.1))
        .force('y', d3.forceY(height / 2).strength(0.1))

      // Draw links
      const link = svg.append('g')
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', (d: any) => d.strength)
        .attr('stroke-width', (d: any) => d.strength * 3)

      // Draw nodes
      const node = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .enter().append('g')

      // Color scale
      const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

      node.append('circle')
        .attr('r', (d: any) => d.radius)
        .attr('fill', (d: any) => colorScale(d.id))
        .attr('opacity', 0.7)

      node.append('text')
        .text((d: any) => d.id)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .style('font-size', '10px')
        .style('font-weight', 'bold')

      node.append('text')
        .text((d: any) => d.count)
        .attr('text-anchor', 'middle')
        .attr('dy', '1.5em')
        .style('font-size', '9px')

      // Update positions with boundary constraints
      simulation.on('tick', () => {
        nodes.forEach((d: any) => {
          d.x = Math.max(d.radius + margin.left, Math.min(width - margin.right - d.radius, d.x))
          d.y = Math.max(d.radius + margin.top, Math.min(height - margin.bottom - d.radius, d.y))
        })

        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y)

        node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
      })

      // Title
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Interest Category Clustering')
    }

    // 2. Similarity Word Cloud
    const drawSimilarityMatrix = () => {
      const svg = d3.select(similarityMatrixRef.current)
      const width = 500
      const height = 400
      svg.attr('width', width).attr('height', height)

      // Find similar words/interests
      const similarityGroups = [
        ['data-science', 'machine-learning', 'ai', 'nlp', 'data-analytics', 'data-engineering'],
        ['healthcare', 'medical-research', 'healthcare-tech', 'healthtech', 'biotech'],
        ['fitness', 'yoga', 'running', 'pilates', 'triathlon', 'wellness'],
        ['cooking', 'food', 'baking', 'bbq', 'vegan-cooking'],
        ['dogs', 'cats', 'pets'],
        ['star-trek', 'star-wars', 'sci-fi', 'science-fiction'],
        ['marketing', 'social-media', 'digital-marketing', 'content-strategy'],
        ['coffee', 'wine', 'beer', 'craft-beer', 'brewing']
      ]

      // Count occurrences
      const wordCounts = new Map<string, number>()
      users.forEach(user => {
        user.interests?.forEach(interest => {
          wordCounts.set(interest, (wordCounts.get(interest) || 0) + 1)
        })
      })

      // Create word groups with counts
      const groupData = similarityGroups
        .map((group, i) => ({
          id: i,
          words: group.filter(word => wordCounts.has(word)),
          totalCount: group.reduce((sum, word) => sum + (wordCounts.get(word) || 0), 0)
        }))
        .filter(g => g.words.length > 0)
        .sort((a, b) => b.totalCount - a.totalCount)
        .slice(0, 6)

      // Draw similarity groups
      const groupHeight = 50
      const startY = 60

      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Interest Similarity Groups (Fuzzy Matching)')

      groupData.forEach((group, i) => {
        const y = startY + i * (groupHeight + 10)

        // Background
        svg.append('rect')
          .attr('x', 20)
          .attr('y', y)
          .attr('width', width - 40)
          .attr('height', groupHeight)
          .attr('fill', d3.schemeCategory10[i % 10])
          .attr('opacity', 0.1)
          .attr('rx', 5)

        // Calculate text width to prevent overlap
        const wordsText = group.words.slice(0, 3).map(w => `${w} (${wordCounts.get(w)})`).join(' ≈ ')
        const maxTextWidth = width - 120 // Leave space for Total

        // Words - truncated if needed
        const textElement = svg.append('text')
          .attr('x', 30)
          .attr('y', y + groupHeight / 2)
          .attr('dy', '0.3em')
          .style('font-size', '10px')

        // Add text with ellipsis if too long
        if (wordsText.length > 40) {
          textElement.text(wordsText.substring(0, 37) + '...')
        } else {
          textElement.text(wordsText)
        }

        // If more than 3 words, show count
        if (group.words.length > 3) {
          svg.append('text')
            .attr('x', 30)
            .attr('y', y + groupHeight / 2 + 15)
            .style('font-size', '9px')
            .style('fill', '#666')
            .text(`+${group.words.length - 3} more`)
        }

        // Total count - in separate background for clarity
        svg.append('rect')
          .attr('x', width - 80)
          .attr('y', y + 10)
          .attr('width', 60)
          .attr('height', groupHeight - 20)
          .attr('fill', 'white')
          .attr('stroke', d3.schemeCategory10[i % 10])
          .attr('stroke-width', 1)
          .attr('rx', 3)

        svg.append('text')
          .attr('x', width - 50)
          .attr('y', y + groupHeight / 2)
          .attr('dy', '0.3em')
          .attr('text-anchor', 'middle')
          .style('font-size', '11px')
          .style('font-weight', 'bold')
          .text(group.totalCount)
      })
    }

    // 3. Demographics Visualization
    const drawDemographics = () => {
      const svg = d3.select(demographicsRef.current)
      const width = 500
      const height = 200
      svg.attr('width', width).attr('height', height)

      // Age distribution
      const ageGroups = d3.rollup(users, v => v.length, d => Math.floor(d.age / 5) * 5)
      const ageData = Array.from(ageGroups, ([age, count]) => ({ age, count }))
        .sort((a, b) => a.age - b.age)

      // Location distribution
      const locationGroups = d3.rollup(users, v => v.length, d => d.location)
      const locationData = Array.from(locationGroups, ([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Draw age chart
      const ageWidth = width / 2 - 20
      const margin = { top: 40, right: 10, bottom: 30, left: 30 }

      const ageX = d3.scaleBand()
        .domain(ageData.map(d => d.age.toString()))
        .range([margin.left, ageWidth - margin.right])
        .padding(0.1)

      const ageY = d3.scaleLinear()
        .domain([0, d3.max(ageData, d => d.count) as number])
        .range([height - margin.bottom, margin.top])

      svg.selectAll('.age-bar')
        .data(ageData)
        .enter().append('rect')
        .attr('class', 'age-bar')
        .attr('x', d => ageX(d.age.toString())!)
        .attr('y', d => ageY(d.count))
        .attr('width', ageX.bandwidth())
        .attr('height', d => height - margin.bottom - ageY(d.count))
        .attr('fill', '#3b82f6')

      // Add age labels on x-axis
      svg.selectAll('.age-label')
        .data(ageData)
        .enter().append('text')
        .attr('class', 'age-label')
        .attr('x', d => ageX(d.age.toString())! + ageX.bandwidth() / 2)
        .attr('y', height - margin.bottom + 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .text(d => d.age)

      // Add count labels on top of bars
      svg.selectAll('.age-count')
        .data(ageData)
        .enter().append('text')
        .attr('class', 'age-count')
        .attr('x', d => ageX(d.age.toString())! + ageX.bandwidth() / 2)
        .attr('y', d => ageY(d.count) - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '9px')
        .style('fill', '#666')
        .text(d => d.count)

      svg.append('text')
        .attr('x', ageWidth / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text('Age Distribution')

      // Draw location chart
      const locX = width / 2 + 20
      const locWidth = width / 2 - 40

      const locY = d3.scaleBand()
        .domain(locationData.map(d => d.location))
        .range([margin.top, height - margin.bottom])
        .padding(0.1)

      const locXScale = d3.scaleLinear()
        .domain([0, d3.max(locationData, d => d.count) as number])
        .range([0, locWidth])

      svg.selectAll('.loc-bar')
        .data(locationData)
        .enter().append('rect')
        .attr('class', 'loc-bar')
        .attr('x', locX)
        .attr('y', d => locY(d.location)!)
        .attr('width', d => locXScale(d.count))
        .attr('height', locY.bandwidth())
        .attr('fill', '#10b981')

      svg.selectAll('.loc-label')
        .data(locationData)
        .enter().append('text')
        .attr('class', 'loc-label')
        .attr('x', locX - 5)
        .attr('y', d => locY(d.location)! + locY.bandwidth() / 2)
        .attr('dy', '0.3em')
        .attr('text-anchor', 'end')
        .style('font-size', '10px')
        .text(d => d.location)

      svg.selectAll('.loc-count')
        .data(locationData)
        .enter().append('text')
        .attr('class', 'loc-count')
        .attr('x', d => locX + locXScale(d.count) + 5)
        .attr('y', d => locY(d.location)! + locY.bandwidth() / 2)
        .attr('dy', '0.3em')
        .style('font-size', '10px')
        .text(d => d.count)

      svg.append('text')
        .attr('x', locX + locWidth / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text('Location Distribution')
    }

    // 4. Sponsor Metrics Dashboard
    const drawSponsorMetrics = () => {
      const svg = d3.select(sponsorMetricsRef.current)
      const width = 500
      const height = 300
      svg.attr('width', width).attr('height', height)

      // Calculate sponsor-relevant metrics
      const techUsers = users.filter(u =>
        u.interests?.some(i => ['data-science', 'machine-learning', 'ai', 'software-engineering', 'tech'].includes(i))
      )
      const healthUsers = users.filter(u =>
        u.interests?.some(i => ['healthcare', 'fitness', 'yoga', 'wellness', 'medical-research'].includes(i))
      )
      const creativeUsers = users.filter(u =>
        u.interests?.some(i => ['art', 'design', 'photography', 'music', 'creative'].includes(i))
      )
      const businessUsers = users.filter(u =>
        u.interests?.some(i => ['business', 'marketing', 'finance', 'entrepreneurship'].includes(i))
      )

      const metrics = [
        { category: 'Tech/Data Science', count: techUsers.length, percentage: (techUsers.length / users.length * 100) },
        { category: 'Health/Wellness', count: healthUsers.length, percentage: (healthUsers.length / users.length * 100) },
        { category: 'Creative/Design', count: creativeUsers.length, percentage: (creativeUsers.length / users.length * 100) },
        { category: 'Business/Marketing', count: businessUsers.length, percentage: (businessUsers.length / users.length * 100) }
      ]

      // Title
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Sponsor/Advertiser Metrics')

      // Draw donut chart
      const radius = 80
      const innerRadius = 40
      const centerX = 150
      const centerY = 150

      const pie = d3.pie<any>()
        .value(d => d.count)

      const arc = d3.arc<any>()
        .innerRadius(innerRadius)
        .outerRadius(radius)

      const colorScale = d3.scaleOrdinal()
        .domain(metrics.map(d => d.category))
        .range(d3.schemeCategory10)

      const g = svg.append('g')
        .attr('transform', `translate(${centerX},${centerY})`)

      g.selectAll('path')
        .data(pie(metrics))
        .enter().append('path')
        .attr('d', arc)
        .attr('fill', d => colorScale(d.data.category) as string)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)

      // Center text
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.3em')
        .style('font-size', '20px')
        .style('font-weight', 'bold')
        .text(users.length)

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1em')
        .style('font-size', '10px')
        .text('Total Users')

      // Metrics list
      const startY = 60
      metrics.forEach((metric, i) => {
        const y = startY + i * 40

        // Color box
        svg.append('rect')
          .attr('x', 300)
          .attr('y', y)
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', colorScale(metric.category) as string)

        // Category name
        svg.append('text')
          .attr('x', 320)
          .attr('y', y + 12)
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(metric.category)

        // Count and percentage
        svg.append('text')
          .attr('x', 320)
          .attr('y', y + 26)
          .style('font-size', '11px')
          .style('fill', '#666')
          .text(`${metric.count} users (${metric.percentage.toFixed(0)}%)`)
      })

      // Key insights for sponsors
      svg.append('text')
        .attr('x', 20)
        .attr('y', 250)
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .text('Key Insights:')

      const insights = [
        `${(techUsers.length / users.length * 100).toFixed(0)}% interested in tech topics`,
        `Average age: ${Math.round(d3.mean(users, u => u.age) || 0)} years`,
        `${new Set(users.map(u => u.location)).size} distinct neighborhoods`
      ]

      insights.forEach((insight, i) => {
        svg.append('text')
          .attr('x', 20)
          .attr('y', 265 + i * 15)
          .style('font-size', '10px')
          .text(`• ${insight}`)
      })
    }

    drawInterestClustering()
    drawSimilarityMatrix()
    drawDemographics()
    drawSponsorMetrics()
  }, [users, matchScores])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interest Clustering */}
        <div className="bg-white p-4 rounded-lg border">
          <svg ref={interestClusterRef}></svg>
          <p className="text-xs text-gray-600 mt-2">
            Shows how interests cluster into categories. Size indicates popularity, connections show relationships.
          </p>
        </div>

        {/* Similarity Groups */}
        <div className="bg-white p-4 rounded-lg border">
          <svg ref={similarityMatrixRef}></svg>
          <p className="text-xs text-gray-600 mt-2">
            Interests considered similar by the fuzzy matching algorithm. Numbers show user counts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demographics */}
        <div className="bg-white p-4 rounded-lg border">
          <svg ref={demographicsRef}></svg>
          <p className="text-xs text-gray-600 mt-2">
            Age groups and geographic distribution of users.
          </p>
        </div>

        {/* Sponsor Metrics */}
        <div className="bg-white p-4 rounded-lg border">
          <svg ref={sponsorMetricsRef}></svg>
          <p className="text-xs text-gray-600 mt-2">
            Audience composition for potential sponsors and advertisers.
          </p>
        </div>
      </div>
    </div>
  )
}