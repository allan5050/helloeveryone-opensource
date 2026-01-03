/**
 * MCP Database Client for Supabase
 * Provides direct database access for LLMs to query and introspect the database
 */

const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

class SupabaseDBClient {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_API_KEY;
    this.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    this.dbPassword = process.env.DB_PASSWORD;
    
    if (!this.supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL not found in environment');
    }
    
    this.projectRef = this.supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
    
    // PostgreSQL direct connection
    this.connectionString = `postgresql://postgres:${encodeURIComponent(this.dbPassword)}@db.${this.projectRef}.supabase.co:5432/postgres`;
    
    // Supabase JS client for API access
    this.supabase = createClient(this.supabaseUrl, this.supabaseServiceKey || this.supabaseAnonKey);
  }
  
  /**
   * Get a direct PostgreSQL connection
   */
  async getDirectConnection() {
    const client = new Client({
      connectionString: this.connectionString,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    return client;
  }
  
  /**
   * Execute a raw SQL query
   */
  async executeSQL(query, params = []) {
    const client = await this.getDirectConnection();
    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      await client.end();
    }
  }
  
  /**
   * Get all table names in the public schema
   */
  async getTables() {
    const query = `
      SELECT tablename, 
             pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
             obj_description((schemaname||'.'||tablename)::regclass) as comment
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;
    return await this.executeSQL(query);
  }
  
  /**
   * Get columns for a specific table
   */
  async getTableSchema(tableName) {
    const query = `
      SELECT 
        c.column_name,
        c.data_type,
        c.udt_name,
        c.character_maximum_length,
        c.is_nullable,
        c.column_default,
        pgd.description as comment
      FROM information_schema.columns c
      LEFT JOIN pg_catalog.pg_description pgd ON 
        pgd.objoid = (SELECT oid FROM pg_class WHERE relname = $1 AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) 
        AND pgd.objsubid = c.ordinal_position
      WHERE c.table_name = $1 
      AND c.table_schema = 'public'
      ORDER BY c.ordinal_position
    `;
    return await this.executeSQL(query, [tableName]);
  }
  
  /**
   * Get row count for a table
   */
  async getTableCount(tableName) {
    const query = `SELECT COUNT(*) as count FROM ${tableName}`;
    const result = await this.executeSQL(query);
    return parseInt(result[0].count);
  }
  
  /**
   * Get foreign key relationships
   */
  async getForeignKeys(tableName = null) {
    let query = `
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_schema = 'public'
    `;
    
    if (tableName) {
      query += ` AND tc.table_name = $1`;
      return await this.executeSQL(query, [tableName]);
    }
    
    query += ' ORDER BY tc.table_name, kcu.column_name';
    return await this.executeSQL(query);
  }
  
  /**
   * Get indexes for a table
   */
  async getIndexes(tableName = null) {
    let query = `
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
    `;
    
    if (tableName) {
      query += ` AND tablename = $1`;
      return await this.executeSQL(query, [tableName]);
    }
    
    query += ' ORDER BY tablename, indexname';
    return await this.executeSQL(query);
  }
  
  /**
   * Get database functions
   */
  async getFunctions() {
    const query = `
      SELECT 
        routine_name,
        routine_type,
        data_type as return_type,
        routine_definition
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      ORDER BY routine_name
    `;
    return await this.executeSQL(query);
  }
  
  /**
   * Get RLS policies
   */
  async getRLSPolicies(tableName = null) {
    let query = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
    `;
    
    if (tableName) {
      query += ` AND tablename = $1`;
      return await this.executeSQL(query, [tableName]);
    }
    
    query += ' ORDER BY tablename, policyname';
    return await this.executeSQL(query);
  }
  
  /**
   * Get enum types
   */
  async getEnumTypes() {
    const query = `
      SELECT 
        t.typname as enum_name,
        string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) as values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname
    `;
    const result = await this.executeSQL(query);
    // Convert comma-separated values back to array
    return result.map(row => ({
      enum_name: row.enum_name,
      values: row.values ? row.values.split(',') : []
    }));
  }
  
  /**
   * Get sample data from a table
   */
  async getSampleData(tableName, limit = 5) {
    const query = `SELECT * FROM ${tableName} LIMIT $1`;
    return await this.executeSQL(query, [limit]);
  }
  
  /**
   * Check if pgvector extension is installed
   */
  async checkPgVector() {
    const query = `
      SELECT 
        extname,
        extversion
      FROM pg_extension
      WHERE extname = 'vector'
    `;
    const result = await this.executeSQL(query);
    return result.length > 0 ? result[0] : null;
  }
  
  /**
   * Get complete database overview
   */
  async getDatabaseOverview() {
    const tables = await this.getTables();
    const overview = {
      project_ref: this.projectRef,
      url: this.supabaseUrl,
      tables: {},
      enums: await this.getEnumTypes(),
      functions: (await this.getFunctions()).map(f => ({
        name: f.routine_name,
        type: f.routine_type,
        returns: f.return_type
      })),
      pgvector: await this.checkPgVector()
    };
    
    for (const table of tables) {
      const schema = await this.getTableSchema(table.tablename);
      const count = await this.getTableCount(table.tablename);
      const foreignKeys = await this.getForeignKeys(table.tablename);
      const policies = await this.getRLSPolicies(table.tablename);
      
      overview.tables[table.tablename] = {
        size: table.size,
        comment: table.comment,
        row_count: count,
        columns: schema,
        foreign_keys: foreignKeys,
        rls_policies: policies.map(p => ({
          name: p.policyname,
          command: p.cmd,
          permissive: p.permissive
        }))
      };
    }
    
    return overview;
  }
  
  /**
   * Use Supabase JS client for API operations
   */
  getSupabaseClient() {
    return this.supabase;
  }
}

module.exports = SupabaseDBClient;