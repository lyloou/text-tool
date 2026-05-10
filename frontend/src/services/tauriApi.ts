import { invoke } from '@tauri-apps/api/core'

export type ConvertMode = 'double' | 'single' | 'plain'

export type SearchMatch = {
  start: number
  end: number
}

export type ResultOutput = {
  format: ConvertMode
  label: string
  output: string
}

const isTauriRuntime = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

const resultFormats: Array<{ format: ConvertMode; label: string }> = [
  { format: 'double', label: '双引号格式' },
  { format: 'single', label: '单引号格式' },
  { format: 'plain', label: '纯逗号格式' },
]

export async function convertLines(input: string, mode: ConvertMode, ignoreEmptyLines: boolean) {
  if (!isTauriRuntime) {
    return { output: convertLinesLocal(input, mode, ignoreEmptyLines) }
  }

  return invoke<{ output: string }>('convert_lines_command', {
    request: {
      input,
      mode,
      ignoreEmptyLines,
    },
  })
}

export async function convertAllFormats(input: string, ignoreEmptyLines: boolean): Promise<ResultOutput[]> {
  const outputs = await Promise.all(
    resultFormats.map(async ({ format, label }) => {
      const result = await convertLines(input, format, ignoreEmptyLines)
      return {
        format,
        label,
        output: result.output,
      }
    }),
  )

  return outputs
}

export async function replaceText(input: string, find: string, replaceWith: string) {
  if (!isTauriRuntime) {
    return { output: find ? input.replaceAll(find, replaceWith) : input }
  }

  return invoke<{ output: string }>('replace_text_command', {
    request: {
      input,
      find,
      replaceWith,
    },
  })
}

export async function deduplicateLines(input: string) {
  if (!isTauriRuntime) {
    return { output: deduplicateLinesLocal(input) }
  }

  return invoke<{ output: string }>('deduplicate_lines_command', {
    request: {
      input,
    },
  })
}

export async function sortLinesAscending(input: string) {
  if (!isTauriRuntime) {
    return { output: input.split('\n').sort().join('\n') }
  }

  return invoke<{ output: string }>('sort_lines_ascending_command', {
    request: {
      input,
    },
  })
}

export async function commaValuesToLines(input: string) {
  if (!isTauriRuntime) {
    return { output: commaValuesToLinesLocal(input) }
  }

  return invoke<{ output: string }>('comma_values_to_lines_command', {
    request: {
      input,
    },
  })
}

export async function searchMatches(text: string, query: string, caseSensitive: boolean) {
  if (!isTauriRuntime) {
    return { matches: searchMatchesLocal(text, query, caseSensitive) }
  }

  return invoke<{ matches: SearchMatch[] }>('search_matches_command', {
    request: {
      output: text,
      query,
      caseSensitive,
    },
  })
}

export async function writeClipboardText(value: string) {
  if (!isTauriRuntime) {
    await navigator.clipboard.writeText(value)
    return
  }

  const { writeText } = await import('@tauri-apps/plugin-clipboard-manager')
  await writeText(value)
}

function convertLinesLocal(input: string, mode: ConvertMode, ignoreEmptyLines: boolean) {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => !ignoreEmptyLines || line.length > 0)
    .map((line) => {
      if (mode === 'double') {
        return `"${line}"`
      }

      if (mode === 'single') {
        return `'${line}'`
      }

      return line
    })
    .join(',')
}

function searchMatchesLocal(output: string, query: string, caseSensitive: boolean) {
  if (!query) {
    return []
  }

  const flags = caseSensitive ? 'g' : 'gi'
  const regex = new RegExp(escapeRegExp(query), flags)
  const matches: SearchMatch[] = []

  for (const match of output.matchAll(regex)) {
    if (typeof match.index === 'number') {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
      })
    }
  }

  return matches
}

function deduplicateLinesLocal(input: string) {
  const seen = new Set<string>()

  return input
    .split('\n')
    .filter((line) => {
      if (seen.has(line)) {
        return false
      }

      seen.add(line)
      return true
    })
    .join('\n')
}

function commaValuesToLinesLocal(input: string) {
  return input
    .split(',')
    .map((value) => stripWrappingQuotes(value.trim()))
    .filter((value) => value.length > 0)
    .join('\n')
}

function stripWrappingQuotes(value: string) {
  if (value.length < 2) {
    return value
  }

  const first = value.at(0)
  const last = value.at(-1)

  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1)
  }

  return value
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
