# Common Errors and Solutions

## 1. unable to open database file (SqliteError code: 14)

**Error:**
```
thread 'main' panicked at src\main.rs:21:10:
Failed to connect to database: Database(SqliteError { code: 14, message: "unable to open database file" })
```

**Cause:**
- On Windows, the SQLite URI path may use backslashes (\), but SQLite expects forward slashes (/) in the URI.
- The directory may exist but the app does not have write permissions.
- The path may be malformed or not what SQLite expects.

**Solution:**
- Ensure the directory exists and is writable.
- In Rust, replace backslashes with forward slashes in the database path before passing it to SQLite:
  ```rust
  let db_path_str = db_path.display().to_string().replace('\\', "/");
  let database_url = format!("sqlite:{}", db_path_str);
  ```
- Add a debug print to verify the final path:
  ```rust
  println!("[DEBUG] Using database path: {}", database_url);
  ```

**Reference:**
- See `src-tauri/src/main.rs` for the fix. 