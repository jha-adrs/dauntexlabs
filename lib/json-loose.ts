// Relaxed JSON ("loose" mode in the JSON formatter): rewrites JS-object-literal
// conveniences into strict JSON, then JSON.parse. Never executes input as code —
// the site's CSP forbids eval/new Function, and pasted text must not run.
//
// Accepted: // and /* */ comments, single-quoted strings, unquoted keys, trailing
// commas. Anything else that isn't JSON (identifiers like window, calls) is rejected.

const IDENT_START = /[A-Za-z_$]/
const IDENT_PART = /[A-Za-z0-9_$]/
const LITERALS = new Set(['true', 'false', 'null'])

export function parseLooseJson(input: string): unknown {
  let out = ''
  let i = 0
  const n = input.length

  // Skip whitespace and comments from position j; returns the next index.
  const skipTrivia = (j: number): number => {
    while (j < n) {
      const c = input[j]
      if (/\s/.test(c)) j++
      else if (c === '/' && input[j + 1] === '/') {
        while (j < n && input[j] !== '\n') j++
      } else if (c === '/' && input[j + 1] === '*') {
        const end = input.indexOf('*/', j + 2)
        if (end === -1) throw new SyntaxError('Unterminated /* comment')
        j = end + 2
      } else break
    }
    return j
  }

  while (i < n) {
    const c = input[i]
    if (c === '"' || c === "'") {
      // Re-emit any string as a double-quoted JSON string.
      let j = i + 1
      let s = ''
      while (j < n && input[j] !== c) {
        if (input[j] === '\\') {
          const next = input[j + 1]
          if (next === undefined) break
          // \' is not a JSON escape: emit the bare quote.
          s += next === "'" ? "'" : '\\' + next
          j += 2
          continue
        }
        s += input[j] === '"' ? '\\"' : input[j]
        j++
      }
      if (j >= n) throw new SyntaxError('Unterminated string')
      out += `"${s}"`
      i = j + 1
    } else if (c === '/' && (input[i + 1] === '/' || input[i + 1] === '*')) {
      i = skipTrivia(i)
    } else if (c === ',') {
      const next = skipTrivia(i + 1)
      if (input[next] !== '}' && input[next] !== ']') out += ','
      i = i + 1
    } else if (/[-0-9.]/.test(c)) {
      // Numbers as one token, so the exponent in 1e5 isn't read as an identifier.
      let j = i + 1
      while (j < n && /[0-9eE.+-]/.test(input[j])) j++
      out += input.slice(i, j)
      i = j
    } else if (IDENT_START.test(c)) {
      let j = i + 1
      while (j < n && IDENT_PART.test(input[j])) j++
      const word = input.slice(i, j)
      if (LITERALS.has(word)) out += word
      else if (input[skipTrivia(j)] === ':') out += JSON.stringify(word)
      else throw new SyntaxError(`Unexpected identifier "${word}"`)
      i = j
    } else {
      out += c
      i++
    }
  }
  return JSON.parse(out)
}
