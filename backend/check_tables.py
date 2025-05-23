import sqlite3

conn = sqlite3.connect('dev.db')
cursor = conn.cursor()
cursor.execute('SELECT name FROM sqlite_master WHERE type="table"')
tables = [table[0] for table in cursor.fetchall()]
print("Tables in database:", tables)

conn.close() 