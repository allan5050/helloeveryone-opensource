#!/usr/bin/env node

/**
 * Schema Export Tool
 * Exports complete database schema to JSON or Markdown
 */

const SupabaseDBClient = require('./db-client')
const fs = require('fs')
const path = require('path')

async function exportSchema(format = 'json') {
  const client = new SupabaseDBClient()

  console.log(`📋 Exporting schema as ${format.toUpperCase()}...`)

  try {
    const overview = await client.getDatabaseOverview()

    if (format === 'json') {
      // Export as JSON
      const outputPath = path.join(__dirname, 'schema.json')
      fs.writeFileSync(outputPath, JSON.stringify(overview, null, 2))
      console.log(`✅ Schema exported to: ${outputPath}`)
    } else if (format === 'markdown') {
      // Export as Markdown
      let markdown = '# Database Schema\n\n'
      markdown += `**Project:** ${overview.project_ref}\n`
      markdown += `**URL:** ${overview.url}\n\n`

      // pgvector status
      if (overview.pgvector) {
        markdown += `**pgvector:** v${overview.pgvector.extversion} ✅\n\n`
      }

      // Tables
      markdown += '## Tables\n\n'
      for (const [tableName, tableInfo] of Object.entries(overview.tables)) {
        markdown += `### ${tableName}\n\n`
        markdown += `- **Rows:** ${tableInfo.row_count}\n`
        markdown += `- **Size:** ${tableInfo.size}\n`
        if (tableInfo.comment) {
          markdown += `- **Description:** ${tableInfo.comment}\n`
        }
        markdown += '\n'

        // Columns
        markdown += '#### Columns\n\n'
        markdown += '| Column | Type | Nullable | Default | Description |\n'
        markdown += '|--------|------|----------|---------|-------------|\n'

        for (const col of tableInfo.columns) {
          const type =
            col.data_type === 'USER-DEFINED' ? col.udt_name : col.data_type
          const nullable = col.is_nullable === 'YES' ? '✓' : '✗'
          const defaultVal = col.column_default
            ? col.column_default.substring(0, 30)
            : '-'
          const comment = col.comment || '-'

          markdown += `| ${col.column_name} | ${type} | ${nullable} | ${defaultVal} | ${comment} |\n`
        }
        markdown += '\n'

        // Foreign Keys
        if (tableInfo.foreign_keys.length > 0) {
          markdown += '#### Foreign Keys\n\n'
          for (const fk of tableInfo.foreign_keys) {
            markdown += `- \`${fk.column_name}\` → \`${fk.foreign_table_name}.${fk.foreign_column_name}\`\n`
          }
          markdown += '\n'
        }

        // RLS Policies
        if (tableInfo.rls_policies.length > 0) {
          markdown += '#### RLS Policies\n\n'
          for (const policy of tableInfo.rls_policies) {
            markdown += `- **${policy.name}** (${policy.command})\n`
          }
          markdown += '\n'
        }
      }

      // Enums
      if (overview.enums.length > 0) {
        markdown += '## Enum Types\n\n'
        for (const enumType of overview.enums) {
          markdown += `### ${enumType.enum_name}\n\n`
          markdown += 'Values: `' + enumType.values.join('`, `') + '`\n\n'
        }
      }

      // Functions
      if (overview.functions.length > 0) {
        markdown += '## Functions\n\n'
        for (const func of overview.functions) {
          markdown += `- **${func.name}()** → ${func.returns}\n`
        }
      }

      const outputPath = path.join(__dirname, 'schema.md')
      fs.writeFileSync(outputPath, markdown)
      console.log(`✅ Schema exported to: ${outputPath}`)
    } else {
      // Export as SQL
      const tables = await client.getTables()
      let sql = '-- Database Schema Export\n'
      sql += `-- Project: ${overview.project_ref}\n`
      sql += `-- Generated: ${new Date().toISOString()}\n\n`

      for (const table of tables) {
        const schema = await client.getTableSchema(table.tablename)
        sql += `-- Table: ${table.tablename}\n`
        sql += `CREATE TABLE IF NOT EXISTS ${table.tablename} (\n`

        const columnDefs = []
        for (const col of schema) {
          let def = `  ${col.column_name} ${col.data_type}`
          if (col.character_maximum_length) {
            def += `(${col.character_maximum_length})`
          }
          if (col.is_nullable === 'NO') {
            def += ' NOT NULL'
          }
          if (col.column_default) {
            def += ` DEFAULT ${col.column_default}`
          }
          columnDefs.push(def)
        }

        sql += columnDefs.join(',\n')
        sql += '\n);\n\n'
      }

      const outputPath = path.join(__dirname, 'schema.sql')
      fs.writeFileSync(outputPath, sql)
      console.log(`✅ Schema exported to: ${outputPath}`)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run if called directly
if (require.main === module) {
  const format = process.argv[2] || 'json'
  exportSchema(format)
}

module.exports = exportSchema
