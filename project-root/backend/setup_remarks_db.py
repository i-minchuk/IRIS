"""Creation of remarks table in SQLite and demo data."""
import sqlite3
from datetime import datetime, timedelta
import uuid
import sys

DB_PATH = 'iris_dev.db'

def create_remarks_table():
    """Creates remarks, remark_comments, remark_tags tables for SQLite."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='remarks'")
    if cursor.fetchone():
        print("WARNING: Table remarks already exists")
    else:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS remarks (
                id TEXT PRIMARY KEY,
                project_id INTEGER,
                document_id INTEGER,
                revision_id INTEGER,
                workflow_step_id INTEGER,
                source TEXT NOT NULL DEFAULT 'internal',
                status TEXT NOT NULL DEFAULT 'new',
                priority TEXT NOT NULL DEFAULT 'medium',
                category TEXT NOT NULL DEFAULT 'other',
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                location_ref TEXT,
                author_id INTEGER NOT NULL,
                assignee_id INTEGER,
                due_date TEXT,
                resolution TEXT,
                resolved_by INTEGER,
                resolved_at TEXT,
                parent_id TEXT,
                related_remark_ids TEXT,
                attachments TEXT,
                history TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
                FOREIGN KEY (author_id) REFERENCES users(id),
                FOREIGN KEY (assignee_id) REFERENCES users(id)
            )
        """)
        print("OK: Table remarks created")
    
    # Create remark_comments table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='remark_comments'")
    if not cursor.fetchone():
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS remark_comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                remark_id TEXT NOT NULL,
                author_id INTEGER NOT NULL,
                text TEXT NOT NULL,
                is_internal INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (remark_id) REFERENCES remarks(id) ON DELETE CASCADE,
                FOREIGN KEY (author_id) REFERENCES users(id)
            )
        """)
        print("OK: Table remark_comments created")
    
    # Create remark_tags table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='remark_tags'")
    if not cursor.fetchone():
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS remark_tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                color TEXT DEFAULT '#CBD5E0'
            )
        """)
        print("OK: Table remark_tags created")
    
    # Create remark_tag_links table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='remark_tag_links'")
    if not cursor.fetchone():
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS remark_tag_links (
                remark_id TEXT NOT NULL,
                tag_id INTEGER NOT NULL,
                PRIMARY KEY (remark_id, tag_id),
                FOREIGN KEY (remark_id) REFERENCES remarks(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES remark_tags(id) ON DELETE CASCADE
            )
        """)
        print("OK: Table remark_tag_links created")
    
    conn.commit()
    conn.close()


def add_demo_remarks():
    """Adds 5 demo remarks."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check existing count
    cursor.execute("SELECT COUNT(*) FROM remarks")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print(f"WARNING: Already {count} records in remarks")
        conn.close()
        return
    
    now = datetime.utcnow()
    uids = [str(uuid.uuid4()) for _ in range(5)]
    
    demo_data = [
        (
            uids[0], 1, 1, None, None,
            'internal', 'new', 'high', 'design_error',
            'Height marks mismatch',
            'Height marks on the plan do not match the section at node A',
            'Node A, section 1-1', 1, None,
            (now + timedelta(days=7)).isoformat(), None, None, None,
            None, None, None,
            '[{"action": "created", "user_id": 1, "timestamp": "' + now.isoformat() + '", "old_status": null, "new_status": "new", "comment": "Remark created"}]',
            now.isoformat(), now.isoformat()
        ),
        (
            uids[1], 1, 2, None, None,
            'internal', 'in_progress', 'medium', 'discrepancy',
            'Missing column binding',
            'Binding axes for columns K5-K8 not specified',
            'Slab plan', 1, 2,
            None, None, None, None,
            None, None, None,
            '[{"action": "created", "user_id": 1, "timestamp": "' + now.isoformat() + '", "old_status": null, "new_status": "new", "comment": ""}, {"action": "status_change", "user_id": 2, "timestamp": "' + now.isoformat() + '", "old_status": "new", "new_status": "in_progress", "comment": "In progress"}]',
            now.isoformat(), now.isoformat()
        ),
        (
            uids[2], 1, 3, None, None,
            'customer', 'new', 'critical', 'norm_violation',
            'SNiP 2.01.07-85 violation',
            'Loads on slab exceed allowable',
            'Load calculation', 1, None,
            (now + timedelta(days=3)).isoformat(), None, None, None,
            None, None, None,
            '[{"action": "created", "user_id": 1, "timestamp": "' + now.isoformat() + '", "old_status": null, "new_status": "new", "comment": "Critical remark from customer"}]',
            now.isoformat(), now.isoformat()
        ),
        (
            uids[3], 2, 4, None, None,
            'internal', 'resolved', 'low', 'incompleteness',
            'Beam section check',
            'Additional check of beam B3 section required',
            'Slab beams', 1, None,
            None, 'Section checked, matches loads', 1,
            (now - timedelta(days=2)).isoformat(),
            None, None, None,
            '[{"action": "created", "user_id": 1, "timestamp": "' + now.isoformat() + '", "old_status": null, "new_status": "new", "comment": ""}, {"action": "status_change", "user_id": 1, "timestamp": "' + now.isoformat() + '", "old_status": "new", "new_status": "resolved", "comment": "Checked"}]',
            now.isoformat(), (now - timedelta(days=2)).isoformat()
        ),
        (
            uids[4], 1, None, None, None,
            'internal', 'deferred', 'medium', 'other',
            'Reinforcement optimization',
            'Possible to reduce armature diameter in slab P2',
            None, 1, None,
            None, None, None, None,
            None, None, None,
            '[{"action": "created", "user_id": 1, "timestamp": "' + now.isoformat() + '", "old_status": null, "new_status": "new", "comment": ""}, {"action": "status_change", "user_id": 1, "timestamp": "' + now.isoformat() + '", "old_status": "new", "new_status": "deferred", "comment": "Deferred to next iteration"}]',
            now.isoformat(), now.isoformat()
        ),
    ]
    
    cursor.executemany("""
        INSERT INTO remarks 
        (id, project_id, document_id, revision_id, workflow_step_id,
         source, status, priority, category, title, description, location_ref,
         author_id, assignee_id, due_date, resolution, resolved_by, resolved_at,
         parent_id, related_remark_ids, attachments, history, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, demo_data)
    
    conn.commit()
    print(f"OK: Added {len(demo_data)} demo remarks")
    
    # Add tags
    tags = [
        ('critical', '#EF5350'),
        ('urgent', '#FFA726'),
        ('for_check', '#42A5F5'),
        ('for_approval', '#AB47BC'),
        ('optimization', '#66BB6A'),
    ]
    
    for name, color in tags:
        cursor.execute("INSERT OR IGNORE INTO remark_tags (name, color) VALUES (?, ?)", (name, color))
    
    conn.commit()
    print("OK: Tags added")
    
    conn.close()


if __name__ == "__main__":
    print("=" * 50)
    print("Setting up remarks table for SQLite")
    print("=" * 50)
    
    try:
        create_remarks_table()
        add_demo_remarks()
        print("=" * 50)
        print("SUCCESS: Setup completed!")
        print("=" * 50)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
