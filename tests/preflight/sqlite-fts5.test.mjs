import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

const TITLE = 'Article A';
const BODY = 'knowledge workspace fts5 smoke test';
const TERM = 'knowledge';

test('node:sqlite FTS5 in-memory: create, insert one row, MATCH with bound query', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('CREATE VIRTUAL TABLE docs USING fts5(title, body)');

    db.prepare('INSERT INTO docs (title, body) VALUES (?, ?)').run(TITLE, BODY);

    const row = db
      .prepare('SELECT title, body FROM docs WHERE docs MATCH ?')
      .get(TERM);

    assert.ok(row, 'FTS5 MATCH should return the inserted row');
    assert.equal(row.title, TITLE);
    assert.equal(row.body, BODY);
  } finally {
    db.close();
  }
});
