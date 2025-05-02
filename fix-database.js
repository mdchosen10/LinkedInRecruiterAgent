// fix-database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Database path - matches your schema configuration
const dbPath = path.join(__dirname, 'data', 'linkedin_recruiter.db');
console.log('Looking for database at:', dbPath);

// Ensure the data directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Created directory: ${dbDir}`);
}

// Create database connection
const db = new sqlite3.Database(dbPath);

// Hash a password
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function setupDatabase() {
  return new Promise((resolve, reject) => {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    
    // Begin transaction
    db.run('BEGIN TRANSACTION', async function(err) {
      if (err) return reject(err);
      
      try {
        // Create users table with password_hash
        db.run(`
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
        `, function(err) {
          if (err) {
            console.error('Error creating users table:', err);
            return reject(err);
          }
          console.log('Users table created or already exists.');
          
          // Check if admin user exists
          db.get("SELECT COUNT(*) as count FROM users", async function(err, row) {
            if (err) {
              console.error('Error checking users:', err);
              return reject(err);
            }
            
            if (row.count === 0) {
              // Create default admin user with hashed password
              try {
                const hashedPassword = await hashPassword('defaultpassword');
                db.run(
                  "INSERT INTO users (username, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)",
                  ["admin", "admin@example.com", hashedPassword, "Default Admin", "admin"],
                  function(err) {
                    if (err) {
                      console.error('Error creating default user:', err);
                      return reject(err);
                    }
                    console.log('Default admin user created with id:', this.lastID);
                    db.run('COMMIT', resolve);
                  }
                );
              } catch (hashError) {
                console.error('Error hashing password:', hashError);
                db.run('ROLLBACK', () => reject(hashError));
              }
            } else {
              console.log(`${row.count} users already exist in the database`);
              db.run('COMMIT', resolve);
            }
          });
        });
      } catch (error) {
        console.error('Setup error:', error);
        db.run('ROLLBACK', () => reject(error));
      }
    });
  });
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('Database setup complete');
    db.close();
  })
  .catch(error => {
    console.error('Database setup failed:', error);
    db.run('ROLLBACK', () => db.close());
  });