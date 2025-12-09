import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = `${__dirname}/courses.db`;

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  
  console.log('Connected to database');
  
  // Check if reminders table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='reminders';", (err, row) => {
    if (err) {
      console.error('Error checking for reminders table:', err);
      return;
    }
    
    if (row) {
      console.log('Reminders table exists');
      // Get the schema of the reminders table
      db.all("PRAGMA table_info(reminders);", (err, columns) => {
        if (err) {
          console.error('Error getting table info:', err);
          return;
        }
        console.log('Reminders table schema:');
        console.table(columns);
        
        // Try to select from the table
        db.all("SELECT * FROM reminders LIMIT 5;", (err, rows) => {
          if (err) {
            console.error('Error querying reminders:', err);
            return;
          }
          console.log('First 5 reminders:');
          console.table(rows);
          
          db.close();
        });
      });
    } else {
      console.log('Reminders table does not exist');
      db.close();
    }
  });
});