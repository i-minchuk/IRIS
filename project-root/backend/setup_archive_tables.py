"""Создание таблиц archive в SQLite"""
import sqlite3

DB_PATH = 'iris_dev.db'

def create_archive_tables():
    """Создаёт таблицы archive для SQLite."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Проверяем существующие таблицы
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    existing = [r[0] for r in cursor.fetchall()]
    
    created = []
    
    # Archive Entries
    if 'archive_entries' not in existing:
        cursor.execute("""
            CREATE TABLE archive_entries (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                entry_type TEXT NOT NULL,
                source_table TEXT NOT NULL,
                source_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                content_snapshot TEXT,
                author_id TEXT,
                occurred_at TEXT NOT NULL,
                tags TEXT DEFAULT '[]',
                attachments TEXT DEFAULT '[]',
                related_entry_ids TEXT DEFAULT '[]',
                is_pinned INTEGER DEFAULT 0,
                is_deleted INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
            )
        """)
        created.append('archive_entries')
        print("OK: Table archive_entries created")
    
    # Archive Materials
    if 'archive_materials' not in existing:
        cursor.execute("""
            CREATE TABLE archive_materials (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                material_type TEXT NOT NULL,
                name TEXT NOT NULL,
                specification TEXT,
                manufacturer TEXT,
                quantity REAL,
                unit TEXT,
                used_in_constructions TEXT DEFAULT '[]',
                certificates TEXT DEFAULT '[]',
                attached_files TEXT DEFAULT '[]',
                entry_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (entry_id) REFERENCES archive_entries(id) ON DELETE SET NULL
            )
        """)
        created.append('archive_materials')
        print("OK: Table archive_materials created")
    
    # Archive Constructions
    if 'archive_constructions' not in existing:
        cursor.execute("""
            CREATE TABLE archive_constructions (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                name TEXT NOT NULL,
                construction_type TEXT NOT NULL,
                designation TEXT,
                location TEXT,
                materials_used TEXT DEFAULT '[]',
                documents_related TEXT DEFAULT '[]',
                status TEXT DEFAULT 'planned',
                installed_at TEXT,
                tested_at TEXT,
                accepted_at TEXT,
                photos TEXT DEFAULT '[]',
                entry_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (entry_id) REFERENCES archive_entries(id) ON DELETE SET NULL
            )
        """)
        created.append('archive_constructions')
        print("OK: Table archive_constructions created")
    
    # Archive Search Index
    if 'archive_search_index' not in existing:
        cursor.execute("""
            CREATE TABLE archive_search_index (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                entry_id TEXT,
                material_id TEXT,
                construction_id TEXT,
                search_text TEXT NOT NULL,
                weight REAL DEFAULT 1.0,
                indexed_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (entry_id) REFERENCES archive_entries(id) ON DELETE CASCADE,
                FOREIGN KEY (material_id) REFERENCES archive_materials(id) ON DELETE CASCADE,
                FOREIGN KEY (construction_id) REFERENCES archive_constructions(id) ON DELETE CASCADE
            )
        """)
        created.append('archive_search_index')
        print("OK: Table archive_search_index created")
    
    conn.commit()
    
    if not created:
        print("OK: All archive tables already exist")
    else:
        print(f"OK: Created {len(created)} archive tables")
    
    conn.close()


if __name__ == "__main__":
    print("=" * 50)
    print("Creating archive tables for SQLite")
    print("=" * 50)
    create_archive_tables()
    print("=" * 50)
    print("SUCCESS!")
    print("=" * 50)
