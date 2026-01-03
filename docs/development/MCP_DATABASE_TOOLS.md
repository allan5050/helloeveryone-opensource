# MCP Database Tools Documentation

## Overview

The MCP (Model Context Protocol) folder provides a comprehensive suite of database tools designed
for LLMs and developers to autonomously interact with the Supabase database. These tools eliminate
the need for manual schema sharing and enable direct database queries.

## Purpose

- **For LLMs**: Autonomous database exploration and querying without human intervention
- **For Developers**: Quick database inspection and debugging
- **For Documentation**: Auto-generated schema exports in multiple formats

## Installation & Setup

### Prerequisites

```bash
# Required environment variables in .env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
DB_PASSWORD=your-database-password
SUPABASE_SERVICE_ROLE_API_KEY=your-service-role-key
```

### Quick Start

```bash
# Get immediate database context
node mcp/quick-start.js

# This will show:
# - Connection info
# - Table statistics
# - Feature availability (pgvector, RLS)
# - Schema overview
```

## Available Tools

### 1. Database Client (`db-client.js`)

Core utility class providing database connection and methods.

**Key Methods:**

- `getDirectConnection()` - PostgreSQL client connection
- `executeSQL(query, params)` - Execute raw SQL
- `getTables()` - List all tables with sizes
- `getTableSchema(tableName)` - Get column definitions
- `getForeignKeys(tableName)` - Get relationships
- `getRLSPolicies(tableName)` - Get security policies
- `getEnumTypes()` - Get enum definitions
- `checkPgVector()` - Check vector extension status
- `getDatabaseOverview()` - Complete database snapshot

**Usage Example:**

```javascript
const SupabaseDBClient = require('./mcp/db-client')
const client = new SupabaseDBClient()

// Get all tables
const tables = await client.getTables()

// Query specific table
const users = await client.executeSQL('SELECT * FROM profiles LIMIT 5')

// Get complete overview
const overview = await client.getDatabaseOverview()
```

### 2. Schema Inspector (`inspect-db.js`)

Quick database overview and statistics tool.

```bash
node mcp/inspect-db.js

# Output includes:
# - Project info
# - Table list with row counts
# - Enum types and values
# - Extension status (pgvector)
# - Function list
# - RLS policy count
```

### 3. Schema Exporter (`get-schema.js`)

Export complete database schema in multiple formats.

```bash
# JSON format (for programmatic use)
node mcp/get-schema.js json

# Markdown format (human-readable)
node mcp/get-schema.js markdown

# SQL format (DDL statements)
node mcp/get-schema.js sql
```

**Output Files:**

- `mcp/schema.json` - Complete schema in JSON
- `mcp/schema.md` - Readable documentation
- `mcp/schema.sql` - SQL DDL statements

### 4. Query Tool (`query.js`)

Interactive and scriptable database query tool.

**Interactive Mode:**

```bash
node mcp/query.js
# Opens interactive prompt for queries
```

**Single Query:**

```bash
node mcp/query.js -q "SELECT COUNT(*) FROM profiles"
```

**Shortcuts:**

```bash
node mcp/query.js :tables              # List all tables
node mcp/query.js :count profiles      # Get row count
node mcp/query.js :sample events 3     # Sample 3 rows
node mcp/query.js :users 10           # List 10 users
node mcp/query.js :admins              # List admin users
node mcp/query.js :events              # List active events
node mcp/query.js :table_sizes         # Show table statistics
node mcp/query.js :rls_status          # Check RLS enabled/disabled
```

### 5. Quick Start (`quick-start.js`)

Comprehensive database context for LLMs.

```bash
node mcp/quick-start.js

# Provides:
# - Connection details
# - Database statistics
# - Feature detection
# - Table overview with columns
# - Enum types
# - Key functions
# - Quick command reference
```

## Common Use Cases

### For LLMs

1. **Initial Context Loading**:

```bash
node mcp/quick-start.js
```

2. **Schema Understanding**:

```bash
node mcp/get-schema.js json
```

3. **Data Exploration**:

```bash
node mcp/query.js :sample profiles 5
node mcp/query.js :sample events 3
```

### For Developers

1. **Check Database State**:

```bash
node mcp/inspect-db.js
```

2. **Debug Specific Tables**:

```bash
node mcp/query.js -q "SELECT * FROM rsvps WHERE status = 'confirmed'"
```

3. **Verify Migrations**:

```bash
node mcp/query.js :table_sizes
node mcp/query.js :rls_status
```

### For Documentation

1. **Generate Schema Docs**:

```bash
node mcp/get-schema.js markdown
```

2. **Export for External Tools**:

```bash
node mcp/get-schema.js sql > database-backup.sql
```

## Database Schema Overview

### Core Tables

- **profiles**: User profiles with bio embeddings
- **events**: Event listings with details
- **rsvps**: Event attendance records
- **match_scores**: Calculated compatibility scores
- **messages**: User-to-user messages
- **favorites**: User favorite relationships
- **meeting_slots**: Scheduled meetings
- **blocks**: User blocking relationships

### Key Features

- **pgvector**: Semantic search with embeddings
- **RLS Policies**: Row-level security on all tables
- **Enum Types**: `user_role`, `rsvp_status`, `meeting_status`
- **Functions**: `calculate_match_score()`, `is_admin()`, etc.

## Security Considerations

⚠️ **Important Security Notes:**

1. **Service Role Key**: The MCP tools use the service role key which bypasses RLS
2. **Environment Variables**: Never commit `.env` files with real credentials
3. **Production Use**: These tools are for development/debugging only
4. **Access Control**: Limit access to the MCP folder in production

## Troubleshooting

### Connection Issues

```bash
# Check environment variables
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
node -e "console.log(process.env.DB_PASSWORD ? 'Set' : 'Not set')"
```

### Permission Errors

- Ensure `SUPABASE_SERVICE_ROLE_API_KEY` is set
- Verify the database password is correct
- Check network connectivity to Supabase

### Query Errors

- Use `node mcp/query.js` interactive mode for debugging
- Check table and column names with `:tables` command
- Verify data types with schema export

## Integration with AI/LLMs

### For Claude/GPT/Other LLMs

1. **First Run**: Always start with `node mcp/quick-start.js`
2. **Schema Access**: The `schema.json` file is auto-generated
3. **Query Execution**: Use the query tool for data exploration
4. **No Manual Sharing**: Database schema is self-discoverable

### Example LLM Workflow

```javascript
// 1. Load the client
const SupabaseDBClient = require('./mcp/db-client')
const client = new SupabaseDBClient()

// 2. Get schema overview
const overview = await client.getDatabaseOverview()

// 3. Query specific data
const events = await client.executeSQL('SELECT * FROM events WHERE start_time > NOW()')

// 4. Check relationships
const foreignKeys = await client.getForeignKeys('rsvps')
```

## Maintenance

### Updating Schema

After database migrations:

```bash
# Regenerate schema files
node mcp/get-schema.js json
node mcp/get-schema.js markdown
```

### Adding New Shortcuts

Edit `mcp/query.js` to add new query shortcuts in the `queries` object.

### Extending Functionality

New methods can be added to `db-client.js` for specific use cases.

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md) - Detailed table documentation
- [Database Setup](./DATABASE_SETUP.md) - Initial setup guide
- [RLS Policies](./rls-policies.md) - Security policy details
- [Architecture](./ARCHITECTURE.md) - System design

---

**Note**: The MCP tools are designed for development and debugging. Always use proper authentication
and authorization in production applications.
