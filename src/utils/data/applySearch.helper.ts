import { db } from '@/utils/db';
import { Knex } from 'knex';
import { appConfig } from '@/config/app.config';

// Quote `Table.column` as `"Table"."column"` for raw SQL
function formatColumn(col: string): string {
  return col.includes('.')
    ? col
        .split('.')
        .map((part) => (part.startsWith('"') ? part : `"${part}"`))
        .join('.')
    : col.startsWith('"')
      ? col
      : `"${col}"`;
}

/**
 * ============================================================================
 * @name    applySearch
 * @desc
 * - Applies trigram word search across columns.
 * - Uses the `<%` operator so the GIN trigram index is used; the threshold (0.3) is
 *   `pg_trgm.word_similarity_threshold`, set on the database by migration `v-1-5-1_improveSearch`.
 * - The index only applies when every OR-ed column is on the same table; for columns across joined
 *   tables, search each table separately and combine the ids.
 * - Covers both exact substring matches (similarity = 1.0) and typo tolerance (similarity >= threshold).
 *
 * ============================================================================
 */
export function applySearch(query: any, columns: string[], search: string) {
  return query.where((builder: any) => {
    columns.forEach((col, index) => {
      const formattedCol = formatColumn(col);

      if (index === 0) {
        builder.whereRaw(`? <% ${formattedCol}`, [search]);
      } else {
        builder.orWhereRaw(`? <% ${formattedCol}`, [search]);
      }
    });
  });
}

/**
 * ============================================================================
 * @name    selectSearchScore
 * @desc
 * - Builds a `"simScore"` select column for ranking search results.
 * - Per column: prefix match + word-prefix match + word_similarity, the best column wins.
 * - Optional `popularitySql` (trusted SQL, e.g. a COUNT) adds `ln(1 + popularity)` so popular rows rank higher.
 *
 * ============================================================================
 */
export function selectSearchScore(columns: string[], search: string, popularitySql?: string): Knex.Raw {
  const weight = appConfig.search.SCORE_WEIGHT;
  const escapedSearch = search.replace(/[\\%_]/g, '\\$&');
  const bindings: string[] = [];

  const columnScores = columns.map((col) => {
    const formattedCol = formatColumn(col);
    bindings.push(`${escapedSearch}%`, `% ${escapedSearch}%`, search);
    return `(
      COALESCE((${formattedCol} ILIKE ?)::int, 0) * ${weight.prefixMatch}
      + COALESCE((${formattedCol} ILIKE ?)::int, 0) * ${weight.wordPrefixMatch}
      + COALESCE(word_similarity(?, ${formattedCol}), 0) * ${weight.fuzzyMatch}
    )`;
  });

  const popularityScore = popularitySql ? ` + ${weight.popularity} * ln(1 + COALESCE((${popularitySql}), 0))` : '';

  return db.raw(`(GREATEST(${columnScores.join(', ')})${popularityScore}) as "simScore"`, bindings);
}
