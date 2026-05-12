import { invoke } from '@tauri-apps/api/core'

export type ConvertMode = 'double' | 'single' | 'plain'

export type ResultOutput = {
  format: ConvertMode
  label: string
  output: string
}

export type Preferences = {
  editor: {
    showLineNumbers: boolean
    softWrap: boolean
  }
  appearance: {
    theme: 'light' | 'dark'
    language: 'zh' | 'en'
  }
}

export const defaultPreferences: Preferences = {
  editor: {
    showLineNumbers: true,
    softWrap: true,
  },
  appearance: {
    theme: 'light',
    language: 'zh',
  },
}

const isTauriRuntime = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

const resultFormats: Array<{ format: ConvertMode; label: string }> = [
  { format: 'double', label: '双引号格式' },
  { format: 'single', label: '单引号格式' },
  { format: 'plain', label: '纯逗号格式' },
]

export async function convertLines(
  input: string,
  mode: ConvertMode,
  ignoreEmptyLines: boolean,
  wrapWithParentheses: boolean,
) {
  if (!isTauriRuntime) {
    return { output: convertLinesLocal(input, mode, ignoreEmptyLines, wrapWithParentheses) }
  }

  return invoke<{ output: string }>('convert_lines_command', {
    request: {
      input,
      mode,
      ignoreEmptyLines,
      wrapWithParentheses,
    },
  })
}

export async function convertAllFormats(
  input: string,
  ignoreEmptyLines: boolean,
  wrapWithParentheses: boolean,
): Promise<ResultOutput[]> {
  const outputs = await Promise.all(
    resultFormats.map(async ({ format, label }) => {
      const result = await convertLines(input, format, ignoreEmptyLines, wrapWithParentheses)
      return {
        format,
        label,
        output: result.output,
      }
    }),
  )

  return outputs
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

export async function loadPreferences() {
  if (!isTauriRuntime) {
    return defaultPreferences
  }

  return invoke<Preferences>('load_preferences_command')
}

export async function savePreferences(preferences: Preferences) {
  if (!isTauriRuntime) {
    return preferences
  }

  return invoke<Preferences>('save_preferences_command', {
    request: {
      preferences,
    },
  })
}

export async function closeSettingsWindow() {
  if (!isTauriRuntime) {
    return
  }

  return invoke('close_settings_window_command')
}

function convertLinesLocal(input: string, mode: ConvertMode, ignoreEmptyLines: boolean, wrapWithParentheses: boolean) {
  const output = input
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

  return wrapWithParentheses ? `(${output})` : output
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
