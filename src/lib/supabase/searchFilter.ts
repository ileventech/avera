// Supabase's `.or()` sends its argument as literal, unparameterized PostgREST
// filter syntax — unlike `.eq()`/`.gte()`, there's no escaping. A raw search
// string containing a comma followed by `column.op.value` syntax would be
// reparsed as an additional filter condition on any column, not literal
// search text. Two escaping layers apply, innermost first: (1) SQL ILIKE
// pattern metacharacters (`\`, `%`, `_`) so the user's text is matched
// literally, not as wildcards; (2) PostgREST's own quoted-value syntax
// (wrap in `"..."`, escape `"`/`\`) so commas/parens/periods in the result
// can't be reparsed as filter grammar separators.
function ilikeContains(raw: string): string {
  const likeEscaped = raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
  const pattern = `%${likeEscaped}%`;
  const quoted = pattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${quoted}"`;
}

export function buildSearchOr(columns: string[], term: string): string {
  const value = ilikeContains(term);
  return columns.map(c => `${c}.ilike.${value}`).join(',');
}
