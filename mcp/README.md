# MCP (Model Context Protocol) - Supabase Database Tools

This folder contains tools for LLMs to directly access and query the Supabase database.

## 🚀 Quick Start for LLMs

To get database information, use these commands:

```bash
# Get database overview
node mcp/inspect-db.js

# Export complete schema as JSON
node mcp/get-schema.js json

# Export schema as Markdown (human-readable)
node mcp/get-schema.js markdown

# Interactive query mode
node mcp/query.js

# Execute a single query
node mcp/query.js -q "SELECT COUNT(*) FROM profiles"

# Use shortcuts
node mcp/query.js :tables
node mcp/query.js :count profiles
node mcp/query.js :sample events 3
```

## 📁 Files

- **db-client.js** - Core database client with connection and utility methods
- **inspect-db.js** - Quick database overview and statistics
- **get-schema.js** - Export complete schema (JSON/Markdown/SQL)
- **query.js** - Interactive query tool with shortcuts
- **README.md** - This file

## 🔧 Available Methods (db-client.js)

### Connection
- `getDirectConnection()` - Get PostgreSQL client
- `executeSQL(query, params)` - Execute raw SQL
- `getSupabaseClient()` - Get Supabase JS client

### Schema Introspection
- `getTables()` - List all tables with sizes
- `getTableSchema(tableName)` - Get columns for a table
- `getTableCount(tableName)` - Get row count
- `getForeignKeys(tableName)` - Get foreign key relationships
- `getIndexes(tableName)` - Get table indexes
- `getFunctions()` - List database functions
- `getRLSPolicies(tableName)` - Get Row Level Security policies
- `getEnumTypes()` - Get enum type definitions
- `checkPgVector()` - Check if pgvector is installed

### Data Access
- `getSampleData(tableName, limit)` - Get sample rows
- `getDatabaseOverview()` - Complete database snapshot

## 🎯 Common Query Shortcuts

When using `query.js`, these shortcuts are available:

### Table Information
- `:tables` - List all tables
- `:count <table>` - Get row count
- `:sample <table> [limit]` - Sample data
- `:table_sizes` - Show table sizes and stats
- `:rls_status` - Check RLS enabled/disabled

### User Queries
- `:users [limit]` - List users
- `:admins` - List admin users
- `:active_users` - Active users only

### Event Queries
- `:events` - List active events
- `:upcoming_events [limit]` - Future events
- `:past_events [limit]` - Past events

### Relationship Queries
- `:top_matches [limit]` - Top match scores
- `:user_matches <user_id>` - Matches for a user
- `:user_favorites <user_id>` - User's favorites
- `:recent_messages [limit]` - Recent messages

## 💡 Example Usage for LLMs

### 1. First Time - Get Schema Overview

```javascript
// In your code
const SupabaseDBClient = require('./mcp/db-client');
const client = new SupabaseDBClient();

// Get complete overview
const overview = await client.getDatabaseOverview();
console.log(JSON.stringify(overview, null, 2));
```

### 2. Query Specific Table

```javascript
// Get table structure
const schema = await client.getTableSchema('profiles');

// Get sample data
const samples = await client.getSampleData('profiles', 3);

// Execute custom query
const results = await client.executeSQL(
  'SELECT * FROM profiles WHERE role = $1',
  ['admin']
);
```

### 3. Check Database State

```javascript
// Quick checks
const tableCount = await client.getTableCount('events');
const pgvector = await client.checkPgVector();
const policies = await client.getRLSPolicies('profiles');
```

## 🔑 Environment Variables

Required in `.env` file:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `DB_PASSWORD` - Database password
- `SUPABASE_SERVICE_ROLE_API_KEY` - Service role key (or use ANON_KEY)

## 📊 Current Database Tables

Run `node mcp/inspect-db.js` to see current tables. Typically includes:
- `profiles` - User profiles
- `events` - Event listings
- `rsvps` - Event RSVPs
- `match_scores` - Calculated match scores
- `messages` - User messages
- `favorites` - User favorites
- `meeting_slots` - Meeting scheduling
- `blocks` - User blocks

## 🔒 Security Notes

- This uses the service role key for full database access
- All RLS policies are bypassed when using service role
- Only use these tools in secure, server-side environments
- Never expose these credentials to client-side code

## 🤖 For AI/LLM Usage

When an LLM needs to understand the database:

1. **First run:** `node mcp/inspect-db.js` to verify connection
2. **Get schema:** `node mcp/get-schema.js json` for complete structure
3. **Query data:** Use `query.js` for exploration
4. **Direct access:** Import `db-client.js` in scripts

The schema.json file will contain everything needed to understand:
- Table structures and relationships
- Column types and constraints
- Foreign key relationships
- RLS policies
- Available functions
- Enum values

This allows autonomous database operations without manual schema sharing.