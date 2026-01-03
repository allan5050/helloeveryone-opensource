#!/usr/bin/env node

/**
 * Interactive Database Query Tool
 * Execute queries and explore data
 */

const SupabaseDBClient = require('./db-client');
const readline = require('readline');

class QueryTool {
  constructor() {
    this.client = new SupabaseDBClient();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  
  /**
   * Execute a single query
   */
  async query(sql, params = []) {
    try {
      const result = await this.client.executeSQL(sql, params);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Common queries for quick access
   */
  async runCommonQuery(queryName, ...args) {
    const queries = {
      // Table info
      tables: 'SELECT tablename FROM pg_tables WHERE schemaname = $1',
      count: 'SELECT COUNT(*) as count FROM',
      sample: 'SELECT * FROM',
      
      // User queries
      users: 'SELECT id, display_name, role, created_at FROM profiles ORDER BY created_at DESC LIMIT $1',
      admins: "SELECT * FROM profiles WHERE role = 'admin'",
      active_users: 'SELECT * FROM profiles WHERE is_active = true',
      
      // Event queries
      events: 'SELECT * FROM events WHERE is_active = true ORDER BY start_time',
      upcoming_events: 'SELECT * FROM events WHERE start_time > NOW() ORDER BY start_time LIMIT $1',
      past_events: 'SELECT * FROM events WHERE end_time < NOW() ORDER BY end_time DESC LIMIT $1',
      
      // RSVP queries
      event_rsvps: 'SELECT * FROM rsvps WHERE event_id = $1',
      user_rsvps: 'SELECT * FROM rsvps WHERE user_id = $1',
      confirmed_rsvps: "SELECT * FROM rsvps WHERE status = 'confirmed'",
      
      // Match queries
      top_matches: 'SELECT * FROM match_scores ORDER BY score DESC LIMIT $1',
      user_matches: 'SELECT * FROM match_scores WHERE profile1_id = $1 OR profile2_id = $1 ORDER BY score DESC',
      
      // Message queries
      recent_messages: 'SELECT * FROM messages ORDER BY created_at DESC LIMIT $1',
      conversation: 'SELECT * FROM messages WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1) ORDER BY created_at',
      
      // Favorites
      user_favorites: 'SELECT * FROM favorites WHERE user_id = $1',
      favorited_by: 'SELECT * FROM favorites WHERE favorited_id = $1',
      
      // Stats
      table_sizes: `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          n_live_tup as estimated_rows
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `,
      
      // RLS check
      rls_status: `
        SELECT 
          tablename,
          CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls
        FROM pg_tables
        WHERE schemaname = 'public'
      `
    };
    
    const template = queries[queryName];
    if (!template) {
      throw new Error(`Unknown query: ${queryName}. Available: ${Object.keys(queries).join(', ')}`);
    }
    
    // Handle special cases
    if (queryName === 'count' || queryName === 'sample') {
      const tableName = args[0];
      if (!tableName) throw new Error('Table name required');
      
      let sql = `${template} ${tableName}`;
      if (queryName === 'sample') {
        sql += ' LIMIT ' + (args[1] || 5);
      }
      return await this.query(sql);
    }
    
    // Regular parameterized queries
    return await this.query(template, args);
  }
  
  /**
   * Format result for display
   */
  formatResult(result) {
    if (!result.success) {
      return `❌ Error: ${result.error}`;
    }
    
    if (!result.data || result.data.length === 0) {
      return '📭 No results found';
    }
    
    // For single value results
    if (result.data.length === 1 && Object.keys(result.data[0]).length === 1) {
      const value = Object.values(result.data[0])[0];
      return `Result: ${value}`;
    }
    
    // For multiple rows, format as table
    const columns = Object.keys(result.data[0]);
    const maxLengths = {};
    
    // Calculate max length for each column
    columns.forEach(col => {
      maxLengths[col] = Math.max(
        col.length,
        ...result.data.map(row => String(row[col] || '').length)
      );
    });
    
    // Build header
    let output = '\n';
    output += columns.map(col => col.padEnd(maxLengths[col])).join(' | ') + '\n';
    output += columns.map(col => '-'.repeat(maxLengths[col])).join('-+-') + '\n';
    
    // Build rows
    result.data.forEach(row => {
      output += columns.map(col => {
        let value = row[col];
        if (value === null) value = 'NULL';
        if (value === true) value = 'true';
        if (value === false) value = 'false';
        if (value instanceof Date) value = value.toISOString();
        return String(value).padEnd(maxLengths[col]);
      }).join(' | ') + '\n';
    });
    
    output += `\n📊 ${result.data.length} row(s) returned`;
    
    return output;
  }
  
  /**
   * Interactive mode
   */
  async interactive() {
    console.log('🔍 Supabase Query Tool\n');
    console.log('Commands:');
    console.log('  - Type SQL queries directly');
    console.log('  - Use :tables to list all tables');
    console.log('  - Use :count <table> to get row count');
    console.log('  - Use :sample <table> [limit] to see sample data');
    console.log('  - Use :users [limit] to see users');
    console.log('  - Use :events to see events');
    console.log('  - Use :help for more commands');
    console.log('  - Use :exit to quit\n');
    
    const askQuestion = () => {
      this.rl.question('supabase> ', async (input) => {
        input = input.trim();
        
        if (!input) {
          askQuestion();
          return;
        }
        
        if (input === ':exit' || input === ':quit') {
          console.log('👋 Goodbye!');
          this.rl.close();
          return;
        }
        
        if (input === ':help') {
          console.log('\nAvailable commands:');
          console.log('  :tables - List all tables');
          console.log('  :count <table> - Get row count');
          console.log('  :sample <table> [limit] - Sample data');
          console.log('  :users [limit] - List users');
          console.log('  :admins - List admin users');
          console.log('  :events - List active events');
          console.log('  :upcoming_events [limit] - Upcoming events');
          console.log('  :table_sizes - Show table sizes');
          console.log('  :rls_status - Check RLS status');
          console.log('  :exit - Quit\n');
          askQuestion();
          return;
        }
        
        try {
          let result;
          
          // Handle commands
          if (input.startsWith(':')) {
            const parts = input.substring(1).split(' ');
            const command = parts[0];
            const args = parts.slice(1);
            
            if (command === 'tables') {
              result = await this.runCommonQuery('tables', 'public');
            } else {
              result = await this.runCommonQuery(command, ...args);
            }
          } else {
            // Direct SQL query
            result = await this.query(input);
          }
          
          console.log(this.formatResult(result));
          console.log('');
          
        } catch (error) {
          console.error(`❌ Error: ${error.message}\n`);
        }
        
        askQuestion();
      });
    };
    
    askQuestion();
  }
}

// Run if called directly
if (require.main === module) {
  const tool = new QueryTool();
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Interactive mode
    tool.interactive();
  } else if (args[0] === '--query' || args[0] === '-q') {
    // Single query mode
    const query = args.slice(1).join(' ');
    tool.query(query).then(result => {
      console.log(tool.formatResult(result));
      process.exit(result.success ? 0 : 1);
    });
  } else if (args[0].startsWith(':')) {
    // Command mode
    const command = args[0].substring(1);
    const cmdArgs = args.slice(1);
    tool.runCommonQuery(command, ...cmdArgs).then(result => {
      console.log(tool.formatResult(result));
      process.exit(result.success ? 0 : 1);
    });
  } else {
    console.log('Usage:');
    console.log('  node query.js                    # Interactive mode');
    console.log('  node query.js -q "SELECT ..."    # Execute query');
    console.log('  node query.js :tables            # Run command');
  }
}

module.exports = QueryTool;