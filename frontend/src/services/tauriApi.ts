import { invoke } from '@tauri-apps/api/core'

export type ConvertMode = 'double' | 'single' | 'plain'

export type SearchMatch = {
  start: number
  end: number
}

export type FindOptions = {
  caseSensitive: boolean
  wholeWord: boolean
  useRegex: boolean
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

export async function replaceText(input: string, find: string, replaceWith: string, options: FindOptions, replaceAll: boolean) {
  if (!isTauriRuntime) {
    return { output: replaceTextLocal(input, find, replaceWith, options, replaceAll) }
  }

  return invoke<{ output: string }>('replace_text_command', {
    request: {
      input,
      find,
      replaceWith,
      ...options,
      replaceAll,
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

export async function sortLinesAscending(input: string, numericSort: boolean) {
  if (!isTauriRuntime) {
    return { output: sortLinesLocal(input, numericSort, false) }
  }

  return invoke<{ output: string }>('sort_lines_ascending_command', {
    request: {
      input,
      numericSort,
    },
  })
}

export async function sortLinesDescending(input: string, numericSort: boolean) {
  if (!isTauriRuntime) {
    return { output: sortLinesLocal(input, numericSort, true) }
  }

  return invoke<{ output: string }>('sort_lines_descending_command', {
    request: {
      input,
      numericSort,
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

export async function searchMatches(text: string, query: string, options: FindOptions) {
  if (!isTauriRuntime) {
    return { matches: searchMatchesLocal(text, query, options) }
  }

  return invoke<{ matches: SearchMatch[] }>('search_matches_command', {
    request: {
      output: text,
      query,
      ...options,
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

export async function readClipboardText() {
  if (!isTauriRuntime) {
    return navigator.clipboard.readText()
  }

  const { readText } = await import('@tauri-apps/plugin-clipboard-manager')
  return readText()
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

function searchMatchesLocal(output: string, query: string, options: FindOptions) {
  if (!query) {
    return []
  }

  const regex = buildFindRegex(query, options)
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

function replaceTextLocal(
  input: string,
  find: string,
  replaceWith: string,
  options: FindOptions,
  replaceAll: boolean,
) {
  if (!find) {
    return input
  }

  const regex = buildFindRegex(find, options, replaceAll)
  return input.replace(regex, replaceWith)
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

function sortLinesLocal(input: string, numericSort: boolean, descending: boolean) {
  const lines = input.split('\n')
  return lines.sort((left, right) => compareLines(left, right, numericSort, descending)).join('\n')
}

function compareLines(left: string, right: string, numericSort: boolean, descending: boolean) {
  if (!numericSort) {
    return descending ? right.localeCompare(left) : left.localeCompare(right)
  }

  const leftNumber = leadingInteger(left)
  const rightNumber = leadingInteger(right)

  if (leftNumber !== null && rightNumber !== null) {
    return descending
      ? rightNumber - leftNumber || right.localeCompare(left)
      : leftNumber - rightNumber || left.localeCompare(right)
  }

  if (leftNumber !== null) {
    return -1
  }

  if (rightNumber !== null) {
    return 1
  }

  return descending ? right.localeCompare(left) : left.localeCompare(right)
}

function leadingInteger(value: string) {
  const match = value.match(/^-?\d+/)
  return match ? Number.parseInt(match[0], 10) : null
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

function buildFindRegex(query: string, options: FindOptions, replaceAll = true) {
  const flags = `${replaceAll ? 'g' : ''}${options.caseSensitive ? '' : 'i'}`
  const pattern = options.useRegex ? query : escapeRegExp(query)
  const wholeWordPattern = options.wholeWord ? `\\b(?:${pattern})\\b` : pattern
  return new RegExp(wholeWordPattern, flags)
}
