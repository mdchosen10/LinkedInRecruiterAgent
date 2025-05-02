/**
 * LinkedIn Recruiting Tool - Data Storage and Integration Module
 * 
 * This module provides a comprehensive solution for:
 * - Storing candidate profiles, evaluations, and messages
 * - Managing user sessions and credentials securely
 * - Connecting all other modules (LinkedIn automation, evaluation, messaging, UI)
 * - Providing data import/export functionality
 */

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const joi = require('joi');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  database: {
    path: './data/linkedin_recruiter.db',
    backupPath: './data/backups/',
  },
  security: {
    saltRounds: 10,
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-key-replace-in-production',
    iv: process.env.ENCRYPTION_IV || '1234567890123456',
    algorithm: 'aes-256-cbc',
    sessionDuration: 1000 * 60 * 60 * 24, // 24 hours
  },
  validation: {
    email: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    phoneNumber: /^\+?[0-9]{10,15}$/,
  }
};

// ==================================================
// Database Schema and Setup
// ==================================================

/**
 * Database schema definitions
 */
const SCHEMA = {
  USERS: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT CHECK(role IN ('admin', 'recruiter', 'viewer')) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  
  SESSIONS: `
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      ip_address TEXT,
      user_agent TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,
  
  CREDENTIALS: `
    CREATE TABLE IF NOT EXISTS credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      service TEXT NOT NULL,
      encrypted_username TEXT,
      encrypted_password TEXT,
      encrypted_token TEXT,
      encrypted_refresh_token TEXT,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, service)
    )
  `,
  
  CANDIDATES: `
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      linkedin_id TEXT UNIQUE,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      location TEXT,
      current_title TEXT,
      current_company TEXT,
      summary TEXT,
      profile_url TEXT,
      profile_image_url TEXT,
      connection_degree INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `,
  
  CANDIDATE_SKILLS: `
    CREATE TABLE IF NOT EXISTS candidate_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      skill TEXT NOT NULL,
      endorsement_count INTEGER DEFAULT 0,
      is_top_skill BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
      UNIQUE(candidate_id, skill)
    )
  `,
  
  CANDIDATE_EXPERIENCES: `
    CREATE TABLE IF NOT EXISTS candidate_experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT,
      start_date TEXT,
      end_date TEXT,
      description TEXT,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
    )
  `,
  
  CANDIDATE_EDUCATION: `
    CREATE TABLE IF NOT EXISTS candidate_education (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      institution TEXT NOT NULL,
      degree TEXT,
      field_of_study TEXT,
      start_date TEXT,
      end_date TEXT,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
    )
  `,
  
  EVALUATIONS: `
    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      evaluator_id INTEGER NOT NULL,
      job_id INTEGER,
      overall_rating INTEGER CHECK(overall_rating BETWEEN 1 AND 5),
      skill_match_rating INTEGER CHECK(skill_match_rating BETWEEN 1 AND 5),
      experience_rating INTEGER CHECK(experience_rating BETWEEN 1 AND 5),
      culture_fit_rating INTEGER CHECK(culture_fit_rating BETWEEN 1 AND 5),
      comments TEXT,
      status TEXT CHECK(status IN ('pending', 'contacted', 'interview_scheduled', 'interviewed', 'offer_extended', 'hired', 'rejected')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
      FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
    )
  `,
  
  JOBS: `
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      requirements TEXT,
      location TEXT,
      job_type TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `,
  
  MESSAGES: `
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      message_type TEXT CHECK(message_type IN ('email', 'linkedin', 'sms', 'note')),
      content TEXT NOT NULL,
      subject TEXT,
      is_sent BOOLEAN DEFAULT FALSE,
      sent_at TIMESTAMP,
      response TEXT,
      response_at TIMESTAMP,
      is_template BOOLEAN DEFAULT FALSE,
      template_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (template_id) REFERENCES message_templates(id) ON DELETE SET NULL
    )
  `,
  
  MESSAGE_TEMPLATES: `
    CREATE TABLE IF NOT EXISTS message_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT,
      content TEXT NOT NULL,
      message_type TEXT CHECK(message_type IN ('email', 'linkedin', 'sms')),
      created_by INTEGER,
      is_global BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `,
  
  CANDIDATE_TAGS: `
    CREATE TABLE IF NOT EXISTS candidate_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      UNIQUE(candidate_id, tag)
    )
  `,
  
  SEARCH_QUERIES: `
    CREATE TABLE IF NOT EXISTS search_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      query_name TEXT,
      search_parameters TEXT NOT NULL,
      last_executed TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,
  
  AUDIT_LOG: `
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `,
  
  SYSTEM_SETTINGS: `
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT,
      description TEXT,
      is_encrypted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  
  DATA_MIGRATIONS: `
    CREATE TABLE IF NOT EXISTS data_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
};

// Create indexes for better performance
const INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_candidates_name ON candidates(name)`,
  `CREATE INDEX IF NOT EXISTS idx_candidates_current_company ON candidates(current_company)`,
  `CREATE INDEX IF NOT EXISTS idx_candidate_skills_skill ON candidate_skills(skill)`,
  `CREATE INDEX IF NOT EXISTS idx_evaluations_candidate_id ON evaluations(candidate_id)`,
  `CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_candidate_id ON messages(candidate_id)`,
  `CREATE INDEX IF NOT EXISTS idx_candidate_tags_tag ON candidate_tags(tag)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON audit_log(entity_type)`,
];

// Database triggers for timestamps and data integrity
const TRIGGERS = [
  // Auto-update "updated_at" timestamp for users
  `CREATE TRIGGER IF NOT EXISTS update_users_timestamp
   AFTER UPDATE ON users
   BEGIN
     UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`,
  
  // Auto-update "updated_at" timestamp for candidates
  `CREATE TRIGGER IF NOT EXISTS update_candidates_timestamp
   AFTER UPDATE ON candidates
   BEGIN
     UPDATE candidates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`,
  
  // Auto-update "updated_at" timestamp for evaluations
  `CREATE TRIGGER IF NOT EXISTS update_evaluations_timestamp
   AFTER UPDATE ON evaluations
   BEGIN
     UPDATE evaluations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`,
  
  // Auto-update "updated_at" timestamp for jobs
  `CREATE TRIGGER IF NOT EXISTS update_jobs_timestamp
   AFTER UPDATE ON jobs
   BEGIN
     UPDATE jobs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`,
  
  // Auto-update "updated_at" timestamp for credentials
  `CREATE TRIGGER IF NOT EXISTS update_credentials_timestamp
   AFTER UPDATE ON credentials
   BEGIN
     UPDATE credentials SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`,
  
  // Auto-update "updated_at" timestamp for messages
  `CREATE TRIGGER IF NOT EXISTS update_messages_timestamp
   AFTER UPDATE ON messages
   BEGIN
     UPDATE messages SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
   END`,
];

// ==================================================
// Security Utilities
// ==================================================

/**
 * Security utility class for encryption, hashing, and session management
 */
class SecurityUtils {
  constructor() {
    this.saltRounds = config.security.saltRounds;
    this.algorithm = config.security.algorithm;
    this.key = Buffer.from(config.security.encryptionKey, 'utf-8');
    if (this.key.length !== 32) {
      // Ensure key is 32 bytes (256 bits) for aes-256-cbc
      this.key = crypto.createHash('sha256').update(String(this.key)).digest();
    }
    this.iv = Buffer.from(config.security.iv, 'utf-8');
  }

  /**
   * Hash a password using bcrypt
   * @param {string} password - The password to hash
   * @returns {Promise<string>} - The hashed password
   */
  async hashPassword(password) {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare a password with a hash
   * @param {string} password - The password to check
   * @param {string} hash - The hash to compare against
   * @returns {Promise<boolean>} - Whether the password matches the hash
   */
  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Encrypt sensitive data
   * @param {string} text - The text to encrypt
   * @returns {string} - The encrypted text as hex
   */
  encrypt(text) {
    if (!text) return null;
    
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt sensitive data
   * @param {string} encryptedText - The encrypted text as hex
   * @returns {string} - The decrypted text
   */
  decrypt(encryptedText) {
    if (!encryptedText) return null;
    
    try {
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  /**
   * Generate a unique session ID
   * @returns {string} - A unique session ID
   */
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Calculate session expiration date
   * @returns {Date} - The expiration date
   */
  calculateSessionExpiry() {
    return new Date(Date.now() + config.security.sessionDuration);
  }
}

// ==================================================
// Data Validation
// ==================================================

/**
 * Validation schemas using Joi
 */
const ValidationSchemas = {
  user: joi.object({
    username: joi.string().alphanum().min(3).max(30).required(),
    email: joi.string().email().required(),
    password: joi.string().min(8).required(),
    name: joi.string().min(1).max(100),
    role: joi.string().valid('admin', 'recruiter', 'viewer').required()
  }),

  candidate: joi.object({
    linkedin_id: joi.string().allow(null, ''),
    name: joi.string().min(1).max(100).required(),
    email: joi.string().email().allow(null, ''),
    phone: joi.string().pattern(config.validation.phoneNumber).allow(null, ''),
    location: joi.string().max(100).allow(null, ''),
    current_title: joi.string().max(100).allow(null, ''),
    current_company: joi.string().max(100).allow(null, ''),
    summary: joi.string().max(2000).allow(null, ''),
    profile_url: joi.string().uri().max(500).allow(null, ''),
    profile_image_url: joi.string().uri().max(500).allow(null, ''),
    connection_degree: joi.number().integer().min(1).max(3).allow(null),
    created_by: joi.number().integer().allow(null)
  }),

  credential: joi.object({
    user_id: joi.number().integer().required(),
    service: joi.string().required(),
    username: joi.string().allow(null, ''),
    password: joi.string().allow(null, ''),
    token: joi.string().allow(null, ''),
    refresh_token: joi.string().allow(null, ''),
    expires_at: joi.date().allow(null)
  }),

  evaluation: joi.object({
    candidate_id: joi.number().integer().required(),
    evaluator_id: joi.number().integer().required(),
    job_id: joi.number().integer().allow(null),
    overall_rating: joi.number().integer().min(1).max(5).allow(null),
    skill_match_rating: joi.number().integer().min(1).max(5).allow(null),
    experience_rating: joi.number().integer().min(1).max(5).allow(null),
    culture_fit_rating: joi.number().integer().min(1).max(5).allow(null),
    comments: joi.string().max(2000).allow(null, ''),
    status: joi.string().valid(
      'pending', 'contacted', 'interview_scheduled', 
      'interviewed', 'offer_extended', 'hired', 'rejected'
    ).allow(null)
  }),

  message: joi.object({
    candidate_id: joi.number().integer().required(),
    user_id: joi.number().integer().required(),
    message_type: joi.string().valid('email', 'linkedin', 'sms', 'note').required(),
    content: joi.string().required(),
    subject: joi.string().max(200).allow(null, ''),
    is_template: joi.boolean().default(false),
    template_id: joi.number().integer().allow(null)
  }),

  job: joi.object({
    title: joi.string().min(1).max(100).required(),
    description: joi.string().max(5000).allow(null, ''),
    requirements: joi.string().max(2000).allow(null, ''),
    location: joi.string().max(100).allow(null, ''),
    job_type: joi.string().max(50).allow(null, ''),
    is_active: joi.boolean().default(true),
    created_by: joi.number().integer().allow(null)
  }),

  messageTemplate: joi.object({
    name: joi.string().min(1).max(100).required(),
    subject: joi.string().max(200).allow(null, ''),
    content: joi.string().required(),
    message_type: joi.string().valid('email', 'linkedin', 'sms').required(),
    created_by: joi.number().integer().allow(null),
    is_global: joi.boolean().default(false)
  }),

  candidateSkill: joi.object({
    candidate_id: joi.number().integer().required(),
    skill: joi.string().min(1).max(100).required(),
    endorsement_count: joi.number().integer().min(0).default(0),
    is_top_skill: joi.boolean().default(false)
  }),

  candidateExperience: joi.object({
    candidate_id: joi.number().integer().required(),
    title: joi.string().min(1).max(100).required(),
    company: joi.string().min(1).max(100).required(),
    location: joi.string().max(100).allow(null, ''),
    start_date: joi.string().max(20).allow(null, ''),
    end_date: joi.string().max(20).allow(null, ''),
    description: joi.string().max(2000).allow(null, '')
  }),

  candidateEducation: joi.object({
    candidate_id: joi.number().integer().required(),
    institution: joi.string().min(1).max(100).required(),
    degree: joi.string().max(100).allow(null, ''),
    field_of_study: joi.string().max(100).allow(null, ''),
    start_date: joi.string().max(20).allow(null, ''),
    end_date: joi.string().max(20).allow(null, '')
  }),

  systemSetting: joi.object({
    setting_key: joi.string().required(),
    setting_value: joi.string().allow(null, ''),
    description: joi.string().max(500).allow(null, ''),
    is_encrypted: joi.boolean().default(false)
  })
};

// ==================================================
// Database Manager Class
// ==================================================

/**
 * Database manager class for handling database connections and operations
 */
class DatabaseManager {
  constructor() {
    this.db = null;
    this.securityUtils = new SecurityUtils();
    this.dbPath = config.database.path;
    this.backupPath = config.database.backupPath;
    
    // Ensure directories exist
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }
  }

  /**
   * Initialize the database connection
   */
  async initialize() {
    try {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });
      
      console.log('Database connection established');
      
      // Enable foreign keys
      await this.db.run('PRAGMA foreign_keys = ON');
      
      // Create tables, indexes and triggers
      await this.setupSchema();
      
      // Initialize default system settings
      await this.initializeSystemSettings();
      
      return true;
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Set up database schema (tables, indexes, triggers)
   */
  async setupSchema() {
    try {
      // Create tables
      for (const [tableName, tableSchema] of Object.entries(SCHEMA)) {
        await this.db.exec(tableSchema);
      }
      
      // Create indexes
      for (const indexQuery of INDEXES) {
        await this.db.exec(indexQuery);
      }
      
      // Create triggers
      for (const triggerQuery of TRIGGERS) {
        await this.db.exec(triggerQuery);
      }
      
      console.log('Database schema setup completed');
      return true;
    } catch (error) {
      console.error('Schema setup error:', error);
      throw error;
    }
  }

  /**
   * Initialize default system settings
   */
  async initializeSystemSettings() {
    const defaultSettings = [
      { 
        setting_key: 'application_name', 
        setting_value: 'LinkedIn Recruiter Tool', 
        description: 'Name of the application', 
        is_encrypted: false 
      },
      { 
        setting_key: 'data_retention_days', 
        setting_value: '365', 
        description: 'Number of days to retain data', 
        is_encrypted: false 
      },
      { 
        setting_key: 'auto_backup_enabled', 
        setting_value: 'true', 
        description: 'Enable automatic database backups', 
        is_encrypted: false 
      },
      { 
        setting_key: 'linkedin_api_rate_limit', 
        setting_value: '100', 
        description: 'LinkedIn API rate limit per hour', 
        is_encrypted: false 
      },
      { 
        setting_key: 'database_version', 
        setting_value: '1.0', 
        description: 'Current database schema version', 
        is_encrypted: false 
      }
    ];

    try {
      for (const setting of defaultSettings) {
        const existingSetting = await this.db.get(
          'SELECT * FROM system_settings WHERE setting_key = ?',
          setting.setting_key
        );
        
        if (!existingSetting) {
          await this.db.run(
            `INSERT INTO system_settings 
             (setting_key, setting_value, description, is_encrypted) 
             VALUES (?, ?, ?, ?)`,
            [
              setting.setting_key,
              setting.setting_value,
              setting.description,
              setting.is_encrypted ? 1 : 0
            ]
          );
        }
      }
      
      console.log('System settings initialized');
      return true;
    } catch (error) {
      console.error('Error initializing system settings:', error);
      throw error;
    }
  }

  /**
   * Backup the database
   * @param {string} backupName - Optional name for the backup
   * @returns {string} - Path to the backup file
   */
  async backupDatabase(backupName = null) {
    try {
      // Generate backup filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = backupName 
        ? `${backupName}_${timestamp}.db` 
        : `backup_${timestamp}.db`;
      const backupFilePath = path.join(this.backupPath, fileName);
      
      // Close current connection
      await this.db.close();
      
      // Copy the database file
      fs.copyFileSync(this.dbPath, backupFilePath);
      
      // Reopen the database
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });
      
      console.log(`Database backed up to: ${backupFilePath}`);
      return backupFilePath;
    } catch (error) {
      console.error('Database backup error:', error);
      // Try to reopen the database if it was closed
      if (!this.db) {
        this.db = await open({
          filename: this.dbPath,
          driver: sqlite3.Database
        });
      }
      throw error;
    }
  }

  /**
   * Restore database from backup
   * @param {string} backupPath - Path to the backup file
   */
  async restoreDatabase(backupPath) {
    try {
      // Validate backup file exists
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found at: ${backupPath}`);
      }
      
      // Close current connection
      await this.db.close();
      
      // Backup current database before restore
      const currentBackup = path.join(
        this.backupPath, 
        `pre_restore_${new Date().toISOString().replace(/[:.]/g, '-')}.db`
      );
      fs.copyFileSync(this.dbPath, currentBackup);
      
      // Copy the backup file to the database location
      fs.copyFileSync(backupPath, this.dbPath);
      
      // Reopen the database
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });
      
      console.log(`Database restored from: ${backupPath}`);
      return true;
    } catch (error) {
      console.error('Database restore error:', error);
      // Try to reopen the database if it was closed
      if (!this.db) {
        this.db = await open({
          filename: this.dbPath,
          driver: sqlite3.Database
        });
      }
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
      console.log('Database connection closed');
    }
  }

  /**
   * Run vacuum to optimize database
   */
  async vacuum() {
    try {
      await this.db.exec('VACUUM');
      console.log('Database vacuumed successfully');
      return true;
    } catch (error) {
      console.error('Database vacuum error:', error);
      throw error;
    }
  }

  /**
   * Apply a database migration
   * @param {string} migrationName - Name of the migration
   * @param {Function} migrationFunction - Function containing the migration logic
   */
  async applyMigration(migrationName, migrationFunction) {
    try {
      // Check if migration was already applied
      const existingMigration = await this.db.get(
        'SELECT * FROM data_migrations WHERE migration_name = ?',
        migrationName
      );
      
      if (existingMigration) {
        console.log(`Migration ${migrationName} was already applied`);
        return false;
      }
      
      // Begin transaction
      await this.db.run('BEGIN TRANSACTION');
      
      // Run the migration function
      await migrationFunction(this.db);
      
      // Record the migration
      await this.db.run(
        'INSERT INTO data_migrations (migration_name) VALUES (?)',
        migrationName
      );
      
      // Commit transaction
      await this.db.run('COMMIT');
      
      console.log(`Migration ${migrationName} applied successfully`);
      return true;
    } catch (error) {
      // Rollback transaction on error
      await this.db.run('ROLLBACK');
      console.error(`Migration ${migrationName} failed:`, error);
      throw error;
    }
  }

  /**
   * Get a list of applied migrations
   * @returns {Array} - List of applied migrations
   */
  async getAppliedMigrations() {
    try {
      const migrations = await this.db.all(
        'SELECT migration_name, applied_at FROM data_migrations ORDER BY applied_at'
      );
      return migrations;
    } catch (error) {
      console.error('Error getting applied migrations:', error);
      throw error;
    }
  }
}

// ==================================================
// Data Models - Base Model
// ==================================================

/**
 * Base model class that provides common CRUD operations
 */
class BaseModel {
  constructor(db, tableName, validationSchema) {
    this.db = db;
    this.tableName = tableName;
    this.validationSchema = validationSchema;
  }

  /**
   * Validate data against schema
   * @param {Object} data - Data to validate
   * @returns {Object} - Validated data or throws error
   */
  validate(data) {
    const { error, value } = this.validationSchema.validate(data, { 
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      throw new Error(`Validation error: ${error.message}`);
    }
    
    return value;
  }

  /**
   * Get all records from the table
   * @param {Object} options - Query options (limit, offset, where)
   * @returns {Array} - List of records
   */
  async getAll(options = {}) {
    try {
      const { 
        limit = 100, 
        offset = 0, 
        where = {},
        orderBy = 'id',
        order = 'ASC'
      } = options;
      
      // Build WHERE clause
      let whereClause = '';
      const params = [];
      
      if (Object.keys(where).length > 0) {
        const whereParts = [];
        
        for (const [key, value] of Object.entries(where)) {
          whereParts.push(`${key} = ?`);
          params.push(value);
        }
        
        whereClause = `WHERE ${whereParts.join(' AND ')}`;
      }
      
      // Build the query
      const query = `
        SELECT * FROM ${this.tableName}
        ${whereClause}
        ORDER BY ${orderBy} ${order}
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);
      
      const results = await this.db.all(query, params);
      return results;
    } catch (error) {
      console.error(`Error getting records from ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Get record by ID
   * @param {number} id - Record ID
   * @returns {Object} - Record or null if not found
   */
  async getById(id) {
    try {
      const result = await this.db.get(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        id
      );
      
      return result || null;
    } catch (error) {
      console.error(`Error getting record by ID from ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Create a new record
   * @param {Object} data - Record data
   * @returns {Object} - Created record
   */
  async create(data) {
    try {
      // Validate data against schema
      const validatedData = this.validate(data);
      
      // Prepare columns and values for the query
      const columns = Object.keys(validatedData);
      const placeholders = columns.map(() => '?').join(', ');
      const values = Object.values(validatedData);
      
      // Insert the record
      const result = await this.db.run(
        `INSERT INTO ${this.tableName} (${columns.join(', ')})
         VALUES (${placeholders})`,
        values
      );
      
      // Get the created record
      const createdRecord = await this.getById(result.lastID);
      return createdRecord;
    } catch (error) {
      console.error(`Error creating record in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update a record
   * @param {number} id - Record ID
   * @param {Object} data - Record data
   * @returns {Object} - Updated record
   */
  async update(id, data) {
    try {
      // Validate data against schema
      const validatedData = this.validate(data);
      
      // Prepare columns and values for the query
      const updates = Object.keys(validatedData).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(validatedData), id];
      
      // Update the record
      await this.db.run(
        `UPDATE ${this.tableName} 
         SET ${updates}
         WHERE id = ?`,
        values
      );
      
      // Get the updated record
      const updatedRecord = await this.getById(id);
      return updatedRecord;
    } catch (error) {
      console.error(`Error updating record in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record
   * @param {number} id - Record ID
   * @returns {boolean} - Whether the record was deleted
   */
  async delete(id) {
    try {
      const result = await this.db.run(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        id
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error(`Error deleting record from ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Find records by a field value
   * @param {string} field - Field name
   * @param {any} value - Field value
   * @returns {Array} - List of matching records
   */
  async findBy(field, value) {
    try {
      const results = await this.db.all(
        `SELECT * FROM ${this.tableName} WHERE ${field} = ?`,
        value
      );
      
      return results;
    } catch (error) {
      console.error(`Error finding records by field in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Find a single record by a field value
   * @param {string} field - Field name
   * @param {any} value - Field value
   * @returns {Object} - Matching record or null
   */
  async findOneBy(field, value) {
    try {
      const result = await this.db.get(
        `SELECT * FROM ${this.tableName} WHERE ${field} = ?`,
        value
      );
      
      return result || null;
    } catch (error) {
      console.error(`Error finding record by field in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Count records, optionally with a where clause
   * @param {Object} where - Where conditions
   * @returns {number} - Count of records
   */
  async count(where = {}) {
    try {
      let whereClause = '';
      const params = [];
      
      if (Object.keys(where).length > 0) {
        const whereParts = [];
        
        for (const [key, value] of Object.entries(where)) {
          whereParts.push(`${key} = ?`);
          params.push(value);
        }
        
        whereClause = `WHERE ${whereParts.join(' AND ')}`;
      }
      
      const result = await this.db.get(
        `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`,
        params
      );
      
      return result.count;
    } catch (error) {
      console.error(`Error counting records in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Run a custom query against the table
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Array} - Query results
   */
  async query(query, params = []) {
    try {
      const results = await this.db.all(query, params);
      return results;
    } catch (error) {
      console.error(`Error running custom query on ${this.tableName}:`, error);
      throw error;
    }
  }
}

// ==================================================
// Data Models - Implementation
// ==================================================

class UserModel extends BaseModel {
  constructor(db) {
    super(db, 'users', ValidationSchemas.user);
    this.securityUtils = new SecurityUtils();
  }

  /**
   * Create a new user with hashed password
   * @param {Object} userData - User data
   * @returns {Object} - Created user (without password)
   */
  async create(userData) {
    try {
      // Hash the password
      const hashedPassword = await this.securityUtils.hashPassword(userData.password);
      
      // Create user with hashed password
      const user = await super.create({
        ...userData,
        password_hash: hashedPassword
      });
      
      // Don't return the password hash
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID (excluding password)
   * @param {number} id - User ID
   * @returns {Object} - User or null
   */
  async getById(id) {
    try {
      const user = await super.getById(id);
      
      if (!user) return null;
      
      // Don't return the password hash
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with username/email and password
   * @param {string} usernameOrEmail - Username or email
   * @param {string} password - Password
   * @returns {Object} - User data or null if authentication fails
   */
  async authenticate(usernameOrEmail, password) {
    try {
      // Find user by username or email
      const user = await this.db.get(
        `SELECT * FROM users WHERE username = ? OR email = ?`,
        [usernameOrEmail, usernameOrEmail]
      );
      
      if (!user) return null;
      
      // Verify password
      const isPasswordValid = await this.securityUtils.comparePassword(
        password, 
        user.password_hash
      );
      
      if (!isPasswordValid) return null;
      
      // Don't return the password hash
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {boolean} - Whether password was changed
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user with password hash
      const user = await this.db.get(
        `SELECT * FROM users WHERE id = ?`,
        userId
      );
      
      if (!user) return false;
      
      // Verify current password
      const isPasswordValid = await this.securityUtils.comparePassword(
        currentPassword, 
        user.password_hash
      );
      
      if (!isPasswordValid) return false;
      
      // Hash the new password
      const newPasswordHash = await this.securityUtils.hashPassword(newPassword);
      
      // Update the password
      await this.db.run(
        `UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newPasswordHash, userId]
      );
      
      return true;
    } catch (error) {
      console.error('Error changing user password:', error);
      throw error;
    }
  }
}

class SessionModel extends BaseModel {
  constructor(db) {
    super(db, 'sessions', null); // No validation schema needed
    this.securityUtils = new SecurityUtils();
  }

  /**
   * Create a new session for a user
   * @param {number} userId - User ID
   * @param {Object} metadata - Session metadata (IP, user agent)
   * @returns {Object} - Session data including ID and expiry
   */
  async createSession(userId, metadata = {}) {
    try {
      const sessionId = this.securityUtils.generateSessionId();
      const expiresAt = this.securityUtils.calculateSessionExpiry();
      
      const { ip_address, user_agent } = metadata;
      
      await this.db.run(
        `INSERT INTO sessions 
         (id, user_id, expires_at, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?)`,
        [sessionId, userId, expiresAt.toISOString(), ip_address, user_agent]
      );
      
      return {
        id: sessionId,
        user_id: userId,
        expires_at: expiresAt,
        created_at: new Date()
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Validate a session
   * @param {string} sessionId - Session ID
   * @returns {Object} - Session data or null if invalid
   */
  async validateSession(sessionId) {
    try {
      // Get session with user data
      const session = await this.db.get(
        `SELECT s.*, u.username, u.email, u.name, u.role
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.id = ? AND s.is_active = 1`,
        sessionId
      );
      
      if (!session) return null;
      
      // Check if session has expired
      const expiresAt = new Date(session.expires_at);
      if (expiresAt < new Date()) {
        // Deactivate expired session
        await this.db.run(
          `UPDATE sessions SET is_active = 0 WHERE id = ?`,
          sessionId
        );
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Error validating session:', error);
      throw error;
    }
  }

  /**
   * End a user session
   * @param {string} sessionId - Session ID
   * @returns {boolean} - Whether session was ended
   */
  async endSession(sessionId) {
    try {
      const result = await this.db.run(
        `UPDATE sessions SET is_active = 0 WHERE id = ?`,
        sessionId
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * End all sessions for a user
   * @param {number} userId - User ID
   * @returns {number} - Number of sessions ended
   */
  async endAllUserSessions(userId) {
    try {
      const result = await this.db.run(
        `UPDATE sessions SET is_active = 0 WHERE user_id = ?`,
        userId
      );
      
      return result.changes;
    } catch (error) {
      console.error('Error ending all user sessions:', error);
      throw error;
    }
  }

  /**
   * Clean up expired sessions
   * @returns {number} - Number of sessions cleaned up
   */
  async cleanupExpiredSessions() {
    try {
      const now = new Date().toISOString();
      
      const result = await this.db.run(
        `UPDATE sessions SET is_active = 0 
         WHERE expires_at < ? AND is_active = 1`,
        now
      );
      
      return result.changes;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      throw error;
    }
  }

  /**
   * Get active sessions for a user
   * @param {number} userId - User ID
   * @returns {Array} - List of active sessions
   */
  async getUserActiveSessions(userId) {
    try {
      const sessions = await this.db.all(
        `SELECT * FROM sessions 
         WHERE user_id = ? AND is_active = 1`,
        userId
      );
      
      return sessions;
    } catch (error) {
      console.error('Error getting active user sessions:', error);
      throw error;
    }
  }
}

class CredentialModel extends BaseModel {
  constructor(db) {
    super(db, 'credentials', ValidationSchemas.credential);
    this.securityUtils = new SecurityUtils();
  }

  /**
   * Create or update user credentials
   * @param {Object} credentialData - Credential data
   * @returns {Object} - Created/updated credential (without sensitive data)
   */
  async saveCredential(credentialData) {
    try {
      // Encrypt sensitive data
      const encryptedData = {
        user_id: credentialData.user_id,
        service: credentialData.service,
        encrypted_username: credentialData.username 
          ? this.securityUtils.encrypt(credentialData.username) 
          : null,
        encrypted_password: credentialData.password 
          ? this.securityUtils.encrypt(credentialData.password) 
          : null,
        encrypted_token: credentialData.token 
          ? this.securityUtils.encrypt(credentialData.token) 
          : null,
        encrypted_refresh_token: credentialData.refresh_token 
          ? this.securityUtils.encrypt(credentialData.refresh_token) 
          : null,
        expires_at: credentialData.expires_at
      };
      
      // Check if credential exists
      const existingCredential = await this.db.get(
        `SELECT id FROM ${this.tableName} 
         WHERE user_id = ? AND service = ?`,
        [credentialData.user_id, credentialData.service]
      );
      
      let result;
      
      if (existingCredential) {
        // Update existing credential
        await this.db.run(
          `UPDATE ${this.tableName} SET
           encrypted_username = ?,
           encrypted_password = ?,
           encrypted_token = ?,
           encrypted_refresh_token = ?,
           expires_at = ?,
           updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            encryptedData.encrypted_username,
            encryptedData.encrypted_password,
            encryptedData.encrypted_token,
            encryptedData.encrypted_refresh_token,
            encryptedData.expires_at,
            existingCredential.id
          ]
        );
        
        result = await this.getById(existingCredential.id);
      } else {
        // Create new credential
        const insertResult = await this.db.run(
          `INSERT INTO ${this.tableName}
           (user_id, service, encrypted_username, encrypted_password, encrypted_token, encrypted_refresh_token, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            encryptedData.user_id,
            encryptedData.service,
            encryptedData.encrypted_username,
            encryptedData.encrypted_password,
            encryptedData.encrypted_token,
            encryptedData.encrypted_refresh_token,
            encryptedData.expires_at
          ]
        );
        
        result = await this.getById(insertResult.lastID);
      }
      
      // Return credential without encrypted data
      return {
        id: result.id,
        user_id: result.user_id,
        service: result.service,
        expires_at: result.expires_at,
        created_at: result.created_at,
        updated_at: result.updated_at
      };
    } catch (error) {
      console.error('Error saving credential:', error);
      throw error;
    }
  }

  /**
   * Get user credential with decrypted data
   * @param {number} userId - User ID
   * @param {string} service - Service name
   * @returns {Object} - Credential with decrypted data
   */
  async getUserCredential(userId, service) {
    try {
      const credential = await this.db.get(
        `SELECT * FROM ${this.tableName} 
         WHERE user_id = ? AND service = ?`,
        [userId, service]
      );
      
      if (!credential) return null;
      
      // Decrypt sensitive data
      return {
        id: credential.id,
        user_id: credential.user_id,
        service: credential.service,
        username: this.securityUtils.decrypt(credential.encrypted_username),
        password: this.securityUtils.decrypt(credential.encrypted_password),
        token: this.securityUtils.decrypt(credential.encrypted_token),
        refresh_token: this.securityUtils.decrypt(credential.encrypted_refresh_token),
        expires_at: credential.expires_at,
        created_at: credential.created_at,
        updated_at: credential.updated_at
      };
    } catch (error) {
      console.error('Error getting user credential:', error);
      throw error;
    }
  }

  /**
   * Delete user credential
   * @param {number} userId - User ID
   * @param {string} service - Service name
   * @returns {boolean} - Whether credential was deleted
   */
  async deleteUserCredential(userId, service) {
    try {
      const result = await this.db.run(
        `DELETE FROM ${this.tableName} 
         WHERE user_id = ? AND service = ?`,
        [userId, service]
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting user credential:', error);
      throw error;
    }
  }

  /**
   * Check if a credential is expired
   * @param {number} userId - User ID
   * @param {string} service - Service name
   * @returns {boolean} - Whether credential is expired
   */
  async isCredentialExpired(userId, service) {
    try {
      const credential = await this.db.get(
        `SELECT expires_at FROM ${this.tableName} 
         WHERE user_id = ? AND service = ?`,
        [userId, service]
      );
      
      if (!credential || !credential.expires_at) return true;
      
      const expiresAt = new Date(credential.expires_at);
      return expiresAt < new Date();
    } catch (error) {
      console.error('Error checking credential expiry:', error);
      throw error;
    }
  }
}

class CandidateModel extends BaseModel {
  constructor(db) {
    super(db, 'candidates', ValidationSchemas.candidate);
  }

  /**
   * Find a candidate by LinkedIn ID
   * @param {string} linkedinId - LinkedIn ID
   * @returns {Object} - Candidate or null
   */
  async findByLinkedInId(linkedinId) {
    return this.findOneBy('linkedin_id', linkedinId);
  }

  /**
   * Search candidates by name, title, company, or location
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options (limit, offset)
   * @returns {Array} - List of matching candidates
   */
  async search(searchTerm, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;
      
      const searchPattern = `%${searchTerm}%`;
      
      const candidates = await this.db.all(
        `SELECT * FROM candidates
         WHERE name LIKE ? OR current_title LIKE ? OR current_company LIKE ? OR location LIKE ?
         ORDER BY name ASC
         LIMIT ? OFFSET ?`,
        [searchPattern, searchPattern, searchPattern, searchPattern, limit, offset]
      );
      
      return candidates;
    } catch (error) {
      console.error('Error searching candidates:', error);
      throw error;
    }
  }

  /**
   * Search candidates with skills
   * @param {Array} skills - List of required skills
   * @param {Object} options - Query options (limit, offset)
   * @returns {Array} - List of matching candidates
   */
  async searchBySkills(skills, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;
      
      // Prepare the query with the right number of placeholders
      const placeholders = skills.map(() => '?').join(', ');
      
      const candidates = await this.db.all(
        `SELECT c.*, COUNT(DISTINCT cs.skill) as matching_skills
         FROM candidates c
         JOIN candidate_skills cs ON c.id = cs.candidate_id
         WHERE cs.skill IN (${placeholders})
         GROUP BY c.id
         ORDER BY matching_skills DESC
         LIMIT ? OFFSET ?`,
        [...skills, limit, offset]
      );
      
      return candidates;
    } catch (error) {
      console.error('Error searching candidates by skills:', error);
      throw error;
    }
  }

  /**
   * Get candidates by experience
   * @param {string} company - Company name
   * @param {string} title - Job title (optional)
   * @param {Object} options - Query options (limit, offset)
   * @returns {Array} - List of matching candidates
   */
  async getByExperience(company, title = null, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;
      
      let query;
      let params;
      
      if (title) {
        query = `
          SELECT c.* FROM candidates c
          JOIN candidate_experiences ce ON c.id = ce.candidate_id
          WHERE ce.company LIKE ? AND ce.title LIKE ?
          ORDER BY c.name ASC
          LIMIT ? OFFSET ?
        `;
        params = [`%${company}%`, `%${title}%`, limit, offset];
      } else {
        query = `
          SELECT c.* FROM candidates c
          JOIN candidate_experiences ce ON c.id = ce.candidate_id
          WHERE ce.company LIKE ?
          ORDER BY c.name ASC
          LIMIT ? OFFSET ?
        `;
        params = [`%${company}%`, limit, offset];
      }
      
      const candidates = await this.db.all(query, params);
      return candidates;
    } catch (error) {
      console.error('Error getting candidates by experience:', error);
      throw error;
    }
  }

  /**
   * Get candidate with all related data
   * @param {number} candidateId - Candidate ID
   * @returns {Object} - Candidate with skills, experiences, education
   */
  async getWithDetails(candidateId) {
    try {
      // Get the candidate
      const candidate = await this.getById(candidateId);
      if (!candidate) return null;
      
      // Get skills
      const skills = await this.db.all(
        `SELECT * FROM candidate_skills WHERE candidate_id = ?`,
        candidateId
      );
      
      // Get experiences
      const experiences = await this.db.all(
        `SELECT * FROM candidate_experiences WHERE candidate_id = ? ORDER BY start_date DESC`,
        candidateId
      );
      
      // Get education
      const education = await this.db.all(
        `SELECT * FROM candidate_education WHERE candidate_id = ? ORDER BY start_date DESC`,
        candidateId
      );
      
      // Get tags
      const tags = await this.db.all(
        `SELECT * FROM candidate_tags WHERE candidate_id = ?`,
        candidateId
      );
      
      // Get evaluations
      const evaluations = await this.db.all(
        `SELECT e.*, u.name as evaluator_name, j.title as job_title
         FROM evaluations e
         JOIN users u ON e.evaluator_id = u.id
         LEFT JOIN jobs j ON e.job_id = j.id
         WHERE e.candidate_id = ?
         ORDER BY e.created_at DESC`,
        candidateId
      );
      
      // Get messages
      const messages = await this.db.all(
        `SELECT m.*, u.name as sender_name
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.candidate_id = ?
         ORDER BY m.created_at DESC`,
        candidateId
      );
      
      return {
        ...candidate,
        skills,
        experiences,
        education,
        tags,
        evaluations,
        messages
      };
    } catch (error) {
      console.error('Error getting candidate with details:', error);
      throw error;
    }
  }

  /**
   * Add a skill to a candidate
   * @param {number} candidateId - Candidate ID
   * @param {Object} skillData - Skill data
   * @returns {Object} - Created skill
   */
  async addSkill(candidateId, skillData) {
    try {
      const { skill, endorsement_count = 0, is_top_skill = false } = skillData;
      
      // Validate the skill data
      ValidationSchemas.candidateSkill.validate({
        candidate_id: candidateId,
        skill,
        endorsement_count,
        is_top_skill
      });
      
      // Check if skill already exists
      const existingSkill = await this.db.get(
        `SELECT * FROM candidate_skills 
         WHERE candidate_id = ? AND skill = ?`,
        [candidateId, skill]
      );
      
      if (existingSkill) {
        // Update existing skill
        await this.db.run(
          `UPDATE candidate_skills 
           SET endorsement_count = ?, is_top_skill = ?
           WHERE id = ?`,
          [endorsement_count, is_top_skill ? 1 : 0, existingSkill.id]
        );
        
        return {
          id: existingSkill.id,
          candidate_id: candidateId,
          skill,
          endorsement_count,
          is_top_skill
        };
      }
      
      // Insert new skill
      const result = await this.db.run(
        `INSERT INTO candidate_skills 
         (candidate_id, skill, endorsement_count, is_top_skill)
         VALUES (?, ?, ?, ?)`,
        [candidateId, skill, endorsement_count, is_top_skill ? 1 : 0]
      );
      
      return {
        id: result.lastID,
        candidate_id: candidateId,
        skill,
        endorsement_count,
        is_top_skill
      };
    } catch (error) {
      console.error('Error adding candidate skill:', error);
      throw error;
    }
  }

  /**
   * Add an experience to a candidate
   * @param {number} candidateId - Candidate ID
   * @param {Object} experienceData - Experience data
   * @returns {Object} - Created experience
   */
  async addExperience(candidateId, experienceData) {
    try {
      const validatedData = ValidationSchemas.candidateExperience.validate({
        candidate_id: candidateId,
        ...experienceData
      });
      
      // Insert experience
      const result = await this.db.run(
        `INSERT INTO candidate_experiences 
         (candidate_id, title, company, location, start_date, end_date, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          candidateId,
          validatedData.title,
          validatedData.company,
          validatedData.location,
          validatedData.start_date,
          validatedData.end_date,
          validatedData.description
        ]
      );
      
      // Get created experience
      const experience = await this.db.get(
        `SELECT * FROM candidate_experiences WHERE id = ?`,
        result.lastID
      );
      
      return experience;
    } catch (error) {
      console.error('Error adding candidate experience:', error);
      throw error;
    }
  }

  /**
   * Add education to a candidate
   * @param {number} candidateId - Candidate ID
   * @param {Object} educationData - Education data
   * @returns {Object} - Created education
   */
  async addEducation(candidateId, educationData) {
    try {
      const validatedData = ValidationSchemas.candidateEducation.validate({
        candidate_id: candidateId,
        ...educationData
      });
      
      // Insert education
      const result = await this.db.run(
        `INSERT INTO candidate_education 
         (candidate_id, institution, degree, field_of_study, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          candidateId,
          validatedData.institution,
          validatedData.degree,
          validatedData.field_of_study,
          validatedData.start_date,
          validatedData.end_date
        ]
      );
      
      // Get created education
      const education = await this.db.get(
        `SELECT * FROM candidate_education WHERE id = ?`,
        result.lastID
      );
      
      return education;
    } catch (error) {
      console.error('Error adding candidate education:', error);
      throw error;
    }
  }

  /**
   * Add tag to a candidate
   * @param {number} candidateId - Candidate ID
   * @param {string} tag - Tag name
   * @param {number} createdBy - User ID who created the tag
   * @returns {Object} - Created tag
   */
  async addTag(candidateId, tag, createdBy) {
    try {
      // Check if tag already exists
      const existingTag = await this.db.get(
        `SELECT * FROM candidate_tags 
         WHERE candidate_id = ? AND tag = ?`,
        [candidateId, tag]
      );
      
      if (existingTag) return existingTag;
      
      // Insert tag
      const result = await this.db.run(
        `INSERT INTO candidate_tags 
         (candidate_id, tag, created_by)
         VALUES (?, ?, ?)`,
        [candidateId, tag, createdBy]
      );
      
      return {
        id: result.lastID,
        candidate_id: candidateId,
        tag,
        created_by: createdBy,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error adding candidate tag:', error);
      throw error;
    }
  }

  /**
   * Remove tag from a candidate
   * @param {number} candidateId - Candidate ID
   * @param {string} tag - Tag name
   * @returns {boolean} - Whether tag was removed
   */
  async removeTag(candidateId, tag) {
    try {
      const result = await this.db.run(
        `DELETE FROM candidate_tags 
         WHERE candidate_id = ? AND tag = ?`,
        [candidateId, tag]
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error removing candidate tag:', error);
      throw error;
    }
  }
}

class EvaluationModel extends BaseModel {
  constructor(db) {
    super(db, 'evaluations', ValidationSchemas.evaluation);
  }

  /**
   * Get evaluations for a candidate
   * @param {number} candidateId - Candidate ID
   * @returns {Array} - List of evaluations
   */
  async getForCandidate(candidateId) {
    try {
      const evaluations = await this.db.all(
        `SELECT e.*, u.name as evaluator_name, j.title as job_title
         FROM evaluations e
         JOIN users u ON e.evaluator_id = u.id
         LEFT JOIN jobs j ON e.job_id = j.id
         WHERE e.candidate_id = ?
         ORDER BY e.created_at DESC`,
        candidateId
      );
      
      return evaluations;
    } catch (error) {
      console.error('Error getting evaluations for candidate:', error);
      throw error;
    }
  }

  /**
   * Get evaluations by status
   * @param {string} status - Evaluation status
   * @param {Object} options - Query options (limit, offset)
   * @returns {Array} - List of evaluations
   */
  async getByStatus(status, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;
      
      const evaluations = await this.db.all(
        `SELECT e.*, c.name as candidate_name, u.name as evaluator_name, j.title as job_title
         FROM evaluations e
         JOIN candidates c ON e.candidate_id = c.id
         JOIN users u ON e.evaluator_id = u.id
         LEFT JOIN jobs j ON e.job_id = j.id
         WHERE e.status = ?
         ORDER BY e.updated_at DESC
         LIMIT ? OFFSET ?`,
        [status, limit, offset]
      );
      
      return evaluations;
    } catch (error) {
      console.error('Error getting evaluations by status:', error);
      throw error;
    }
  }

  /**
   * Get evaluations by job
   * @param {number} jobId - Job ID
   * @param {Object} options - Query options (limit, offset)
   * @returns {Array} - List of evaluations
   */
  async getByJob(jobId, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;
      
      const evaluations = await this.db.all(
        `SELECT e.*, c.name as candidate_name, u.name as evaluator_name
         FROM evaluations e
         JOIN candidates c ON e.candidate_id = c.id
         JOIN users u ON e.evaluator_id = u.id
         WHERE e.job_id = ?
         ORDER BY e.overall_rating DESC, e.updated_at DESC
         LIMIT ? OFFSET ?`,
        [jobId, limit, offset]
      );
      
      return evaluations;
    } catch (error) {
      console.error('Error getting evaluations by job:', error);
      throw error;
    }
  }

  /**
   * Update evaluation status
   * @param {number} evaluationId - Evaluation ID
   * @param {string} status - New status
   * @returns {Object} - Updated evaluation
   */
  async updateStatus(evaluationId, status) {
    try {
      // Validate status
      const validStatuses = [
        'pending', 'contacted', 'interview_scheduled', 
        'interviewed', 'offer_extended', 'hired', 'rejected'
      ];
      
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }
      
      await this.db.run(
        `UPDATE evaluations SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, evaluationId]
      );
      
      return this.getById(evaluationId);
    } catch (error) {
      console.error('Error updating evaluation status:', error);
      throw error;
    }
  }
}

class MessageModel extends BaseModel {
  constructor(db) {
    super(db, 'messages', ValidationSchemas.message);
  }

  /**
   * Get messages for a candidate
   * @param {number} candidateId - Candidate ID
   * @param {Object} options - Query options (limit, offset)
   * @returns {Array} - List of messages
   */
  async getForCandidate(candidateId, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;
      
      const messages = await this.db.all(
        `SELECT m.*, u.name as sender_name
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.candidate_id = ?
         ORDER BY m.created_at DESC
         LIMIT ? OFFSET ?`,
        [candidateId, limit, offset]
      );
      
      return messages;
    } catch (error) {
      console.error('Error getting messages for candidate:', error);
      throw error;
    }
  }

  /**
   * Mark message as sent
   * @param {number} messageId - Message ID
   * @returns {Object} - Updated message
   */
  async markAsSent(messageId) {
    try {
      await this.db.run(
        `UPDATE messages 
         SET is_sent = 1, sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        messageId
      );
      
      return this.getById(messageId);
    } catch (error) {
      console.error('Error marking message as sent:', error);
      throw error;
    }
  }

  /**
   * Save message response
   * @param {number} messageId - Message ID
   * @param {string} response - Response content
   * @returns {Object} - Updated message
   */
  async saveResponse(messageId, response) {
    try {
      await this.db.run(
        `UPDATE messages 
         SET response = ?, response_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [response, messageId]
      );
      
      return this.getById(messageId);
    } catch (error) {
      console.error('Error saving message response:', error);
      throw error;
    }
  }

  /**
   * Create a message from template
   * @param {number} templateId - Template ID
   * @param {number} candidateId - Candidate ID
   * @param {number} userId - User ID
   * @param {Object} replacements - Template variable replacements
   * @returns {Object} - Created message
   */
  async createFromTemplate(templateId, candidateId, userId, replacements = {}) {
    try {
      // Get the template
      const template = await this.db.get(
        `SELECT * FROM message_templates WHERE id = ?`,
        templateId
      );
      
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }
      
      // Apply replacements to subject and content
      let subject = template.subject || '';
      let content = template.content;
      
      for (const [key, value] of Object.entries(replacements)) {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        content = content.replace(new RegExp(placeholder, 'g'), value);
      }
      
      // Create message
      const message = await this.create({
        candidate_id: candidateId,
        user_id: userId,
        message_type: template.message_type,
        subject,
        content,
        is_template: true,
        template_id: templateId
      });
      
      return message;
    } catch (error) {
      console.error('Error creating message from template:', error);
      throw error;
    }
  }
}

class MessageTemplateModel extends BaseModel {
  constructor(db) {
    super(db, 'message_templates', ValidationSchemas.messageTemplate);
  }

  /**
   * Get global templates
   * @returns {Array} - List of global templates
   */
  async getGlobalTemplates() {
    return this.findBy('is_global', 1);
  }

  /**
   * Get user templates
   * @param {number} userId - User ID
   * @returns {Array} - List of user templates
   */
  async getUserTemplates(userId) {
    return this.findBy('created_by', userId);
  }

  /**
   * Get templates by message type
   * @param {string} messageType - Message type
   * @param {number} userId - User ID (optional)
   * @returns {Array} - List of templates
   */
  async getByType(messageType, userId = null) {
    try {
      let query;
      let params;
      
      if (userId) {
        query = `
          SELECT * FROM message_templates
          WHERE message_type = ? AND (is_global = 1 OR created_by = ?)
          ORDER BY name ASC
        `;
        params = [messageType, userId];
      } else {
        query = `
          SELECT * FROM message_templates
          WHERE message_type = ?
          ORDER BY name ASC
        `;
        params = [messageType];
      }
      
      const templates = await this.db.all(query, params);
      return templates;
    } catch (error) {
      console.error('Error getting templates by type:', error);
      throw error;
    }
  }
}

class JobModel extends BaseModel {
  constructor(db) {
    super(db, 'jobs', ValidationSchemas.job);
  }

  /**
   * Get active jobs
   * @param {Object} options - Query options (limit, offset)
   * @returns {Array} - List of active jobs
   */
  async getActiveJobs(options = {}) {
    return this.getAll({
      ...options,
      where: { is_active: 1 },
      orderBy: 'created_at',
      order: 'DESC'
    });
  }

  /**
   * Get job with candidate evaluations
   * @param {number} jobId - Job ID
   * @returns {Object} - Job with evaluations
   */
  async getWithEvaluations(jobId) {
    try {
      // Get the job
      const job = await this.getById(jobId);
      if (!job) return null;
      
      // Get evaluations
      const evaluations = await this.db.all(
        `SELECT e.*, c.name as candidate_name, u.name as evaluator_name
         FROM evaluations e
         JOIN candidates c ON e.candidate_id = c.id
         JOIN users u ON e.evaluator_id = u.id
         WHERE e.job_id = ?
         ORDER BY e.overall_rating DESC, e.updated_at DESC`,
        jobId
      );
      
      return {
        ...job,
        evaluations
      };
    } catch (error) {
      console.error('Error getting job with evaluations:', error);
      throw error;
    }
  }

  /**
   * Get job stats
   * @param {number} jobId - Job ID
   * @returns {Object} - Job statistics
   */
  async getJobStats(jobId) {
    try {
      // Get count of candidates by status
      const statusCounts = await this.db.all(
        `SELECT status, COUNT(*) as count
         FROM evaluations
         WHERE job_id = ?
         GROUP BY status`,
        jobId
      );
      
      // Convert to object
      const statsByStatus = {};
      statusCounts.forEach(({ status, count }) => {
        statsByStatus[status] = count;
      });
      
      // Get total number of candidates
      const totalCandidates = await this.db.get(
        `SELECT COUNT(*) as count
         FROM evaluations
         WHERE job_id = ?`,
        jobId
      );
      
      // Get average ratings
      const avgRatings = await this.db.get(
        `SELECT 
           AVG(overall_rating) as avg_overall_rating,
           AVG(skill_match_rating) as avg_skill_match_rating,
           AVG(experience_rating) as avg_experience_rating,
           AVG(culture_fit_rating) as avg_culture_fit_rating
         FROM evaluations
         WHERE job_id = ? AND overall_rating IS NOT NULL`,
        jobId
      );
      
      return {
        total_candidates: totalCandidates.count,
        by_status: statsByStatus,
        avg_ratings: {
          overall: avgRatings.avg_overall_rating || 0,
          skill_match: avgRatings.avg_skill_match_rating || 0,
          experience: avgRatings.avg_experience_rating || 0,
          culture_fit: avgRatings.avg_culture_fit_rating || 0
        }
      };
    } catch (error) {
      console.error('Error getting job stats:', error);
      throw error;
    }
  }
}

class SystemSettingModel extends BaseModel {
  constructor(db) {
    super(db, 'system_settings', ValidationSchemas.systemSetting);
    this.securityUtils = new SecurityUtils();
  }

  /**
   * Get a system setting by key
   * @param {string} key - Setting key
   * @returns {string} - Setting value
   */
  async getValue(key) {
    try {
      const setting = await this.db.get(
        `SELECT * FROM system_settings WHERE setting_key = ?`,
        key
      );
      
      if (!setting) return null;
      
      // Decrypt if needed
      return setting.is_encrypted 
        ? this.securityUtils.decrypt(setting.setting_value)
        : setting.setting_value;
    } catch (error) {
      console.error('Error getting system setting:', error);
      throw error;
    }
  }

  /**
   * Set a system setting
   * @param {string} key - Setting key
   * @param {string} value - Setting value
   * @param {string} description - Setting description (optional)
   * @param {boolean} isEncrypted - Whether to encrypt the value
   * @returns {boolean} - Whether setting was saved
   */
  async setValue(key, value, description = null, isEncrypted = false) {
    try {
      // Encrypt value if needed
      const storedValue = isEncrypted 
        ? this.securityUtils.encrypt(value)
        : value;
      
      // Check if setting exists
      const existingSetting = await this.db.get(
        `SELECT * FROM system_settings WHERE setting_key = ?`,
        key
      );
      
      if (existingSetting) {
        // Update existing setting
        await this.db.run(
          `UPDATE system_settings
           SET setting_value = ?, description = ?, is_encrypted = ?, updated_at = CURRENT_TIMESTAMP
           WHERE setting_key = ?`,
          [storedValue, description, isEncrypted ? 1 : 0, key]
        );
      } else {
        // Create new setting
        await this.db.run(
          `INSERT INTO system_settings
           (setting_key, setting_value, description, is_encrypted)
           VALUES (?, ?, ?, ?)`,
          [key, storedValue, description, isEncrypted ? 1 : 0]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error setting system setting:', error);
      throw error;
    }
  }

  /**
   * Get all system settings
   * @param {boolean} decryptValues - Whether to decrypt encrypted values
   * @returns {Array} - List of settings
   */
  async getAllSettings(decryptValues = false) {
    try {
      const settings = await this.db.all(
        `SELECT * FROM system_settings ORDER BY setting_key`
      );
      
      if (decryptValues) {
        // Decrypt encrypted values
        return settings.map(setting => ({
          ...setting,
          setting_value: setting.is_encrypted
            ? this.securityUtils.decrypt(setting.setting_value)
            : setting.setting_value
        }));
      }
      
      return settings;
    } catch (error) {
      console.error('Error getting all system settings:', error);
      throw error;
    }
  }
}

class AuditLogModel extends BaseModel {
  constructor(db) {
    super(db, 'audit_log', null); // No validation schema needed
  }

  /**
   * Add an audit log entry
   * @param {Object} logData - Log data
   * @returns {Object} - Created log entry
   */
  async log(logData) {
    try {
      const { 
        user_id, 
        action, 
        entity_type, 
        entity_id, 
        details = null,
        ip_address = null
      } = logData;
      
      const result = await this.db.run(
        `INSERT INTO audit_log
         (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, action, entity_type, entity_id, details, ip_address]
      );
      
      return {
        id: result.lastID,
        ...logData,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating audit log entry:', error);
      // Don't throw error to prevent disrupting main operations
      console.error(error);
      return null;
    }
  }

  /**
   * Get audit logs for an entity
   * @param {string} entityType - Entity type
   * @param {number} entityId - Entity ID
   * @param {Object} options - Query options (limit, offset)
   * @returns {Array} - List of audit logs
   */
  async getForEntity(entityType, entityId, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;
      
      const logs = await this.db.all(
        `SELECT l.*, u.name as user_name
         FROM audit_log l
         LEFT JOIN users u ON l.user_id = u.id
         WHERE l.entity_type = ? AND l.entity_id = ?
         ORDER BY l.created_at DESC
         LIMIT ? OFFSET ?`,
        [entityType, entityId, limit, offset]
      );
      
      return logs;
    } catch (error) {
      console.error('Error getting audit logs for entity:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a user
   * @param {number} userId - User ID
   * @param {Object} options - Query options (limit, offset)
   * @returns {Array} - List of audit logs
   */
  async getForUser(userId, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;
      
      const logs = await this.db.all(
        `SELECT * FROM audit_log
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      
      return logs;
    } catch (error) {
      console.error('Error getting audit logs for user:', error);
      throw error;
    }
  }

  /**
   * Get recent audit logs
   * @param {Object} options - Query options (limit, offset)
   * @returns {Array} - List of audit logs
   */
  async getRecent(options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;
      
      const logs = await this.db.all(
        `SELECT l.*, u.name as user_name
         FROM audit_log l
         LEFT JOIN users u ON l.user_id = u.id
         ORDER BY l.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      
      return logs;
    } catch (error) {
      console.error('Error getting recent audit logs:', error);
      throw error;
    }
  }
}

class SearchQueryModel extends BaseModel {
  constructor(db) {
    super(db, 'search_queries', null); // No validation schema needed
  }

  /**
   * Save a search query
   * @param {number} userId - User ID
   * @param {string} queryName - Name for the query
   * @param {Object} searchParameters - Search parameters
   * @returns {Object} - Saved query
   */
  async saveQuery(userId, queryName, searchParameters) {
    try {
      // Convert parameters to JSON string
      const parametersJson = JSON.stringify(searchParameters);
      
      const result = await this.db.run(
        `INSERT INTO search_queries
         (user_id, query_name, search_parameters)
         VALUES (?, ?, ?)`,
        [userId, queryName, parametersJson]
      );
      
      return {
        id: result.lastID,
        user_id: userId,
        query_name: queryName,
        search_parameters: searchParameters,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error saving search query:', error);
      throw error;
    }
  }

  /**
   * Get user's saved queries
   * @param {number} userId - User ID
   * @returns {Array} - List of saved queries
   */
  async getUserQueries(userId) {
    try {
      const queries = await this.db.all(
        `SELECT * FROM search_queries
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        userId
      );
      
      // Parse search parameters JSON
      return queries.map(query => ({
        ...query,
        search_parameters: JSON.parse(query.search_parameters)
      }));
    } catch (error) {
      console.error('Error getting user search queries:', error);
      throw error;
    }
  }

  /**
   * Update last executed time
   * @param {number} queryId - Query ID
   * @returns {boolean} - Whether update succeeded
   */
  async updateLastExecuted(queryId) {
    try {
      await this.db.run(
        `UPDATE search_queries
         SET last_executed = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        queryId
      );
      
      return true;
    } catch (error) {
      console.error('Error updating search query last executed:', error);
      throw error;
    }
  }
}

// ==================================================
// Data Import/Export
// ==================================================

/**
 * Data import/export utility class
 */
class DataImportExport {
  constructor(db) {
    this.db = db;
    this.securityUtils = new SecurityUtils();
  }

  /**
   * Export data to JSON
   * @param {Array} tables - Tables to export (empty for all)
   * @param {boolean} includeUsers - Whether to include user data
   * @param {boolean} includeCredentials - Whether to include credentials
   * @returns {Object} - Exported data
   */
  async exportToJson(tables = [], includeUsers = false, includeCredentials = false) {
    try {
      const exportData = {
        metadata: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          tables: []
        },
        data: {}
      };
      
      // Get list of tables to export
      let tablesToExport;
      
      if (tables.length === 0) {
        // Get all tables
        const result = await this.db.all(
          `SELECT name FROM sqlite_master 
           WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
        );
        
        tablesToExport = result.map(row => row.name);
      } else {
        tablesToExport = tables;
      }
      
      // Filter sensitive tables if needed
      if (!includeUsers) {
        tablesToExport = tablesToExport.filter(table => table !== 'users');
      }
      
      if (!includeCredentials) {
        tablesToExport = tablesToExport.filter(table => table !== 'credentials');
      }
      
      // Export each table
      for (const table of tablesToExport) {
        const rows = await this.db.all(`SELECT * FROM ${table}`);
        
        // Handle sensitive fields
        if (table === 'users') {
          // Remove password hashes
          rows.forEach(row => {
            delete row.password_hash;
          });
        } else if (table === 'credentials') {
          // Decrypt and restructure credentials
          rows.forEach(row => {
            row.username = this.securityUtils.decrypt(row.encrypted_username);
            row.password = null; // Don't export actual passwords
            row.token = this.securityUtils.decrypt(row.encrypted_token);
            row.refresh_token = this.securityUtils.decrypt(row.encrypted_refresh_token);
            
            delete row.encrypted_username;
            delete row.encrypted_password;
            delete row.encrypted_token;
            delete row.encrypted_refresh_token;
          });
        } else if (table === 'system_settings') {
          // Handle encrypted settings
          rows.forEach(row => {
            if (row.is_encrypted) {
              row.setting_value = this.securityUtils.decrypt(row.setting_value);
            }
          });
        }
        
        exportData.data[table] = rows;
        exportData.metadata.tables.push(table);
      }
      
      return exportData;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Import data from JSON
   * @param {Object} importData - Data to import
   * @param {boolean} clearExisting - Whether to clear existing data
   * @param {boolean} importUsers - Whether to import user data
   * @returns {Object} - Import results
   */
  async importFromJson(importData, clearExisting = false, importUsers = false) {
    try {
      // Validate import data structure
      if (!importData.metadata || !importData.data) {
        throw new Error('Invalid import data format');
      }
      
      const { tables } = importData.metadata;
      const results = {
        success: true,
        tables_processed: [],
        records_imported: {},
        errors: []
      };
      
      // Begin transaction
      await this.db.run('BEGIN TRANSACTION');
      
      // Process each table
      for (const table of tables) {
        // Skip users table if importUsers is false
        if (table === 'users' && !importUsers) continue;
        
        // Skip sessions, audit_log, and data_migrations tables
        if (['sessions', 'audit_log', 'data_migrations'].includes(table)) continue;
        
        try {
          // Clear existing data if requested
          if (clearExisting) {
            await this.db.run(`DELETE FROM ${table}`);
          }
          
          const rows = importData.data[table];
          let importCount = 0;
          
          for (const row of rows) {
            // Handle special tables
            let modifiedRow = { ...row };
            
            if (table === 'credentials') {
              // Re-encrypt credential data
              modifiedRow = {
                user_id: row.user_id,
                service: row.service,
                encrypted_username: row.username ? this.securityUtils.encrypt(row.username) : null,
                encrypted_password: row.password ? this.securityUtils.encrypt(row.password) : null,
                encrypted_token: row.token ? this.securityUtils.encrypt(row.token) : null,
                encrypted_refresh_token: row.refresh_token ? this.securityUtils.encrypt(row.refresh_token) : null,
                expires_at: row.expires_at
              };
            } else if (table === 'system_settings' && row.is_encrypted) {
              // Re-encrypt system settings
              modifiedRow.setting_value = this.securityUtils.encrypt(row.setting_value);
            }
            
            // Prepare columns and values
            const { id, created_at, updated_at, ...dataToInsert } = modifiedRow;
            const columns = Object.keys(dataToInsert);
            const placeholders = columns.map(() => '?').join(', ');
            const values = Object.values(dataToInsert);
            
            // Insert the row
            await this.db.run(
              `INSERT INTO ${table} (${columns.join(', ')})
               VALUES (${placeholders})`,
              values
            );
            
            importCount++;
          }
          
          results.tables_processed.push(table);
          results.records_imported[table] = importCount;
        } catch (error) {
          console.error(`Error importing data for table ${table}:`, error);
          results.errors.push({
            table,
            message: error.message
          });
        }
      }
      
      // Commit or rollback based on errors
      if (results.errors.length === 0) {
        await this.db.run('COMMIT');
      } else {
        await this.db.run('ROLLBACK');
        results.success = false;
      }
      
      return results;
    } catch (error) {
      // Ensure rollback on error
      await this.db.run('ROLLBACK');
      console.error('Error importing data:', error);
      throw error;
    }
  }

  /**
   * Export candidates to CSV
   * @param {Array} candidateIds - Candidate IDs to export (empty for all)
   * @returns {string} - CSV content
   */
  async exportCandidatesToCsv(candidateIds = []) {
    try {
      let query;
      let params = [];
      
      if (candidateIds.length > 0) {
        // Create placeholders for IN clause
        const placeholders = candidateIds.map(() => '?').join(', ');
        query = `
          SELECT c.*, 
                 GROUP_CONCAT(DISTINCT cs.skill) as skills,
                 (SELECT status FROM evaluations WHERE candidate_id = c.id ORDER BY updated_at DESC LIMIT 1) as latest_status
          FROM candidates c
          LEFT JOIN candidate_skills cs ON c.id = cs.candidate_id
          WHERE c.id IN (${placeholders})
          GROUP BY c.id
        `;
        params = candidateIds;
      } else {
        query = `
          SELECT c.*, 
                 GROUP_CONCAT(DISTINCT cs.skill) as skills,
                 (SELECT status FROM evaluations WHERE candidate_id = c.id ORDER BY updated_at DESC LIMIT 1) as latest_status
          FROM candidates c
          LEFT JOIN candidate_skills cs ON c.id = cs.candidate_id
          GROUP BY c.id
        `;
      }
      
      const candidates = await this.db.all(query, params);
      
      // Convert to CSV format
      const headers = [
        'id', 'name', 'email', 'phone', 'location', 'current_title', 
        'current_company', 'skills', 'profile_url', 'latest_status'
      ];
      
      const csvRows = [];
      csvRows.push(headers.join(','));
      
      candidates.forEach(candidate => {
        const row = headers.map(header => {
          const value = candidate[header] || '';
          // Escape commas and quotes
          return `"${value.toString().replace(/"/g, '""')}"`;
        });
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    } catch (error) {
      console.error('Error exporting candidates to CSV:', error);
      throw error;
    }
  }

  /**
   * Import candidates from CSV
   * @param {string} csvContent - CSV content
   * @param {number} createdBy - User ID creating the import
   * @returns {Object} - Import results
   */
  async importCandidatesFromCsv(csvContent, createdBy) {
    try {
      // Parse CSV
      const rows = csvContent.split('\n');
      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      
      const results = {
        success: true,
        total: rows.length - 1,
        imported: 0,
        errors: []
      };
      
      // Begin transaction
      await this.db.run('BEGIN TRANSACTION');
      
      // Process each row
      for (let i = 1; i < rows.length; i++) {
        try {
          const row = rows[i];
          if (!row.trim()) continue; // Skip empty rows
          
          // Parse CSV row
          const values = [];
          let insideQuote = false;
          let currentValue = '';
          
          for (let j = 0; j < row.length; j++) {
            const char = row[j];
            
            if (char === '"') {
              if (insideQuote && row[j + 1] === '"') {
                // Handle escaped quotes
                currentValue += '"';
                j++;
              } else {
                // Toggle quote state
                insideQuote = !insideQuote;
              }
            } else if (char === ',' && !insideQuote) {
              // End of field
              values.push(currentValue);
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          
          // Add the last value
          values.push(currentValue);
          
          // Create candidate object
          const candidateData = {};
          headers.forEach((header, index) => {
            if (index < values.length) {
              candidateData[header] = values[index];
            }
          });
          
          // Extract skills if present
          const skills = candidateData.skills ? candidateData.skills.split(';').map(s => s.trim()) : [];
          delete candidateData.skills;
          
          // Remove columns not in candidates table
          delete candidateData.id;
          delete candidateData.latest_status;
          
          // Add created_by
          candidateData.created_by = createdBy;
          
          // Validate and insert candidate
          const candidateModel = new CandidateModel(this.db);
          const candidate = await candidateModel.create(candidateData);
          
          // Add skills
          for (const skill of skills) {
            if (skill) {
              await candidateModel.addSkill(candidate.id, { skill });
            }
          }
          
          results.imported++;
        } catch (error) {
          console.error(`Error importing candidate row ${i}:`, error);
          results.errors.push({
            row: i,
            message: error.message
          });
        }
      }
      
      // Commit or rollback based on errors
      if (results.errors.length === 0) {
        await this.db.run('COMMIT');
      } else {
        await this.db.run('ROLLBACK');
        results.success = false;
      }
      
      return results;
    } catch (error) {
      // Ensure rollback on error
      await this.db.run('ROLLBACK');
      console.error('Error importing candidates from CSV:', error);
      throw error;
    }
  }
}

// ==================================================
// Integration Service
// ==================================================

/**
 * Integration service class for connecting all modules
 */
class IntegrationService {
  constructor(db) {
    this.db = db;
    this.securityUtils = new SecurityUtils();
    
    // Initialize models
    this.userModel = new UserModel(db);
    this.sessionModel = new SessionModel(db);
    this.credentialModel = new CredentialModel(db);
    this.candidateModel = new CandidateModel(db);
    this.evaluationModel = new EvaluationModel(db);
    this.messageModel = new MessageModel(db);
    this.messageTemplateModel = new MessageTemplateModel(db);
    this.jobModel = new JobModel(db);
    this.systemSettingModel = new SystemSettingModel(db);
    this.auditLogModel = new AuditLogModel(db);
    this.searchQueryModel = new SearchQueryModel(db);
    
    // Initialize data import/export
    this.dataImportExport = new DataImportExport(db);
  }

  /**
   * Authenticate user and create session
   * @param {string} usernameOrEmail - Username or email
   * @param {string} password - Password
   * @param {Object} metadata - Session metadata (IP, user agent)
   * @returns {Object} - Session data with user info
   */
  async authenticateUser(usernameOrEmail, password, metadata = {}) {
    try {
      // Authenticate user
      const user = await this.userModel.authenticate(usernameOrEmail, password);
      
      if (!user) {
        return { success: false, message: 'Invalid credentials' };
      }
      
      // Create session
      const session = await this.sessionModel.createSession(user.id, metadata);
      
      // Log the authentication
      await this.auditLogModel.log({
        user_id: user.id,
        action: 'authenticate',
        entity_type: 'user',
        entity_id: user.id,
        details: 'User login',
        ip_address: metadata.ip_address
      });
      
      return {
        success: true,
        session_id: session.id,
        expires_at: session.expires_at,
        user
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Validate session and get user info
   * @param {string} sessionId - Session ID
   * @returns {Object} - Session validation result
   */
  async validateSession(sessionId) {
    try {
      const session = await this.sessionModel.validateSession(sessionId);
      
      if (!session) {
        return { valid: false, message: 'Invalid or expired session' };
      }
      
      return {
        valid: true,
        user: {
          id: session.user_id,
          username: session.username,
          email: session.email,
          name: session.name,
          role: session.role
        }
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false, message: error.message };
    }
  }

  /**
   * End user session
   * @param {string} sessionId - Session ID
   * @returns {boolean} - Whether session was ended
   */
  async logout(sessionId) {
    try {
      // Get session for logging
      const session = await this.db.get(
        `SELECT user_id FROM sessions WHERE id = ?`,
        sessionId
      );
      
      // End the session
      const result = await this.sessionModel.endSession(sessionId);
      
      // Log the logout if session was found
      if (session) {
        await this.auditLogModel.log({
          user_id: session.user_id,
          action: 'logout',
          entity_type: 'user',
          entity_id: session.user_id,
          details: 'User logout'
        });
      }
      
      return result;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Save LinkedIn credentials for a user
   * @param {number} userId - User ID
   * @param {Object} credentials - LinkedIn credentials
   * @returns {Object} - Result
   */
  async saveLinkedInCredentials(userId, credentials) {
    try {
      const result = await this.credentialModel.saveCredential({
        user_id: userId,
        service: 'linkedin',
        ...credentials
      });
      
      await this.auditLogModel.log({
        user_id: userId,
        action: 'update_credentials',
        entity_type: 'user',
        entity_id: userId,
        details: 'Updated LinkedIn credentials'
      });
      
      return { success: true, result };
    } catch (error) {
      console.error('Error saving LinkedIn credentials:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get LinkedIn credentials for a user
   * @param {number} userId - User ID
   * @returns {Object} - LinkedIn credentials
   */
  async getLinkedInCredentials(userId) {
    try {
      const credentials = await this.credentialModel.getUserCredential(userId, 'linkedin');
      
      if (!credentials) {
        return { success: false, message: 'LinkedIn credentials not found' };
      }
      
      return { success: true, credentials };
    } catch (error) {
      console.error('Error getting LinkedIn credentials:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Create or update a candidate profile
   * @param {Object} candidateData - Candidate data
   * @param {number} userId - User creating/updating the candidate
   * @returns {Object} - Created/updated candidate
   */
  async saveCandidate(candidateData, userId) {
    try {
      // Check if candidate exists by LinkedIn ID
      let candidate;
      let isNew = true;
      
      if (candidateData.linkedin_id) {
        candidate = await this.candidateModel.findByLinkedInId(candidateData.linkedin_id);
        
        if (candidate) {
          // Update existing candidate
          candidate = await this.candidateModel.update(candidate.id, {
            ...candidateData,
            created_by: candidate.created_by // Keep original creator
          });
          isNew = false;
        }
      }
      
      if (!candidate) {
        // Create new candidate
        candidate = await this.candidateModel.create({
          ...candidateData,
          created_by: userId
        });
      }
      
      // Log the action
      await this.auditLogModel.log({
        user_id: userId,
        action: isNew ? 'create_candidate' : 'update_candidate',
        entity_type: 'candidate',
        entity_id: candidate.id,
        details: isNew 
          ? 'Created new candidate profile' 
          : 'Updated candidate profile'
      });
      
      return { success: true, candidate, isNew };
    } catch (error) {
      console.error('Error saving candidate:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Create an evaluation for a candidate
   * @param {Object} evaluationData - Evaluation data
   * @returns {Object} - Created evaluation
   */
  async evaluateCandidate(evaluationData) {
    try {
      const evaluation = await this.evaluationModel.create(evaluationData);
      
      // Log the action
      await this.auditLogModel.log({
        user_id: evaluationData.evaluator_id,
        action: 'create_evaluation',
        entity_type: 'candidate',
        entity_id: evaluationData.candidate_id,
        details: `Created evaluation for job ID ${evaluationData.job_id || 'N/A'}`
      });
      
      return { success: true, evaluation };
    } catch (error) {
      console.error('Error creating evaluation:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Send a message to a candidate
   * @param {Object} messageData - Message data
   * @returns {Object} - Created message
   */
  async sendMessage(messageData) {
    try {
      const message = await this.messageModel.create(messageData);
      
      // For real messages (not notes), mark as sent
      if (messageData.message_type !== 'note') {
        await this.messageModel.markAsSent(message.id);
      }
      
      // Log the action
      await this.auditLogModel.log({
        user_id: messageData.user_id,
        action: 'send_message',
        entity_type: 'candidate',
        entity_id: messageData.candidate_id,
        details: `Sent ${messageData.message_type} message`
      });
      
      return { success: true, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Create a job posting
   * @param {Object} jobData - Job data
   * @param {number} userId - User creating the job
   * @returns {Object} - Created job
   */
  async createJob(jobData, userId) {
    try {
      const job = await this.jobModel.create({
        ...jobData,
        created_by: userId
      });
      
      // Log the action
      await this.auditLogModel.log({
        user_id: userId,
        action: 'create_job',
        entity_type: 'job',
        entity_id: job.id,
        details: `Created job: ${job.title}`
      });
      
      return { success: true, job };
    } catch (error) {
      console.error('Error creating job:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Search for candidates
   * @param {Object} searchParams - Search parameters
   * @param {number} userId - User performing the search
   * @param {boolean} saveQuery - Whether to save the search query
   * @returns {Object} - Search results
   */
  async searchCandidates(searchParams, userId, saveQuery = false) {
    try {
      let candidates = [];
      
      // Determine search type and execute
      if (searchParams.searchTerm) {
        // Text search
        candidates = await this.candidateModel.search(
          searchParams.searchTerm,
          searchParams.options
        );
      } else if (searchParams.skills && searchParams.skills.length > 0) {
        // Skills search
        candidates = await this.candidateModel.searchBySkills(
          searchParams.skills,
          searchParams.options
        );
      } else if (searchParams.company) {
        // Experience search
        candidates = await this.candidateModel.getByExperience(
          searchParams.company,
          searchParams.title,
          searchParams.options
        );
      } else {
        // Default to getting all candidates with paging
        candidates = await this.candidateModel.getAll(searchParams.options);
      }
      
      // Save search query if requested
      if (saveQuery && searchParams.queryName) {
        await this.searchQueryModel.saveQuery(
          userId,
          searchParams.queryName,
          searchParams
        );
        
        // Log the action
        await this.auditLogModel.log({
          user_id: userId,
          action: 'save_search',
          entity_type: 'search_query',
          entity_id: null,
          details: `Saved search query: ${searchParams.queryName}`
        });
      }
      
      return { 
        success: true, 
        candidates,
        total: candidates.length
      };
    } catch (error) {
      console.error('Error searching candidates:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Import candidates from CSV
   * @param {string} csvContent - CSV content
   * @param {number} userId - User importing the data
   * @returns {Object} - Import results
   */
  async importCandidates(csvContent, userId) {
    try {
      const results = await this.dataImportExport.importCandidatesFromCsv(csvContent, userId);
      
      // Log the action
      await this.auditLogModel.log({
        user_id: userId,
        action: 'import_candidates',
        entity_type: 'system',
        entity_id: null,
        details: `Imported ${results.imported} candidates from CSV`
      });
      
      return { success: results.success, results };
    } catch (error) {
      console.error('Error importing candidates:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Export candidates to CSV
   * @param {Array} candidateIds - Candidate IDs to export (empty for all)
   * @param {number} userId - User exporting the data
   * @returns {Object} - CSV content
   */
  async exportCandidates(candidateIds, userId) {
    try {
      const csvContent = await this.dataImportExport.exportCandidatesToCsv(candidateIds);
      
      // Log the action
      await this.auditLogModel.log({
        user_id: userId,
        action: 'export_candidates',
        entity_type: 'system',
        entity_id: null,
        details: `Exported candidates to CSV`
      });
      
      return { success: true, csvContent };
    } catch (error) {
      console.error('Error exporting candidates:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Backup the database
   * @param {number} userId - User creating the backup
   * @returns {Object} - Backup result
   */
  async backupDatabase(userId) {
    try {
      const dbManager = new DatabaseManager();
      const backupPath = await dbManager.backupDatabase('user_requested');
      
      // Log the action
      await this.auditLogModel.log({
        user_id: userId,
        action: 'backup_database',
        entity_type: 'system',
        entity_id: null,
        details: `Created database backup: ${backupPath}`
      });
      
      return { success: true, backupPath };
    } catch (error) {
      console.error('Error backing up database:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Initialize all system components
   */
  async initialize() {
    try {
      // Cleanup expired sessions
      await this.sessionModel.cleanupExpiredSessions();
      
      // Log system start
      await this.auditLogModel.log({
        user_id: null,
        action: 'system_start',
        entity_type: 'system',
        entity_id: null,
        details: 'System initialized'
      });
      
      console.log('Integration service initialized');
      return true;
    } catch (error) {
      console.error('Error initializing integration service:', error);
      throw error;
    }
  }
}

// ==================================================
// Helper utilities
// ==================================================

/**
 * Data validation helper
 */
const ValidationHelper = {
  /**
   * Validate object against schema
   * @param {Object} data - Data to validate
   * @param {Joi.Schema} schema - Joi validation schema
   * @returns {Object} - Validation result
   */
  validate(data, schema) {
    const { error, value } = schema.validate(data, { 
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      return {
        valid: false,
        errors: error.details.map(detail => detail.message),
        value: null
      };
    }
    
    return {
      valid: true,
      errors: [],
      value
    };
  },
  
  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean} - Whether email is valid
   */
  isValidEmail(email) {
    return config.validation.email.test(email);
  },
  
  /**
   * Validate phone number
   * @param {string} phone - Phone to validate
   * @returns {boolean} - Whether phone is valid
   */
  isValidPhone(phone) {
    return config.validation.phoneNumber.test(phone);
  }
};

/**
 * Error handling helpers
 */
class ErrorHandler {
  /**
   * Format error response
   * @param {Error} error - Error object
   * @param {string} context - Error context
   * @returns {Object} - Formatted error
   */
  static formatError(error, context = '') {
    return {
      success: false,
      error: error.message,
      context,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Log error
   * @param {Error} error - Error object
   * @param {string} context - Error context
   */
  static logError(error, context = '') {
    console.error(`ERROR [${context}]:`, error.message);
    console.error(error.stack);
  }
  
  /**
   * Handle API error
   * @param {Error} error - Error object
   * @param {string} context - Error context
   * @returns {Object} - Error response
   */
  static handleApiError(error, context = '') {
    this.logError(error, context);
    return this.formatError(error, context);
  }
}

// ==================================================
// Main Export
// ==================================================

module.exports = {
  // Core database
  DatabaseManager,
  SecurityUtils,
  ValidationSchemas,
  ValidationHelper,
  ErrorHandler,
  
  // Models
  UserModel,
  SessionModel,
  CredentialModel,
  CandidateModel,
  EvaluationModel,
  MessageModel,
  MessageTemplateModel,
  JobModel,
  SystemSettingModel,
  AuditLogModel,
  SearchQueryModel,
  
  // Import/Export
  DataImportExport,
  
  // Integration
  IntegrationService,
  
  // Initialize the database and return integration service
  async initialize() {
    const dbManager = new DatabaseManager();
    await dbManager.initialize();
    
    const integrationService = new IntegrationService(dbManager.db);
    await integrationService.initialize();
    
    return {
      dbManager,
      integrationService
    };
  }
};