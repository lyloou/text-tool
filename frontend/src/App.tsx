import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import './App.css'
import InputEditor from './components/InputEditor'
import ResultView from './components/ResultView'
import {
  closeSettingsWindow,
  convertAllFormats,
  commaValuesToLines,
  deduplicateLines,
  defaultPreferences,
  findMatches,
  loadPreferences,
  readClipboardText,
  replaceAll,
  replaceFirst,
  savePreferences,
  sortLinesAscending,
  sortLinesDescending,
  writeClipboardText,
  type FindOptions,
  type Preferences,
  type ResultOutput,
  type SearchMatch,
} from './services/tauriApi'

type Language = Preferences['appearance']['language']
type Theme = Preferences['appearance']['theme']
type StatusKey =
  | 'ready'
  | 'converted'
  | 'reversed'
  | 'deduplicated'
  | 'sorted'
  | 'commaToLines'
  | 'cleared'
  | 'pasted'
  | 'copied'
  | 'replaced'

type FindPanelState = {
  expanded: boolean
  mode: 'find' | 'replace'
  focusVersion: number
  query: string
  replaceWith: string
  caseSensitive: boolean
  wholeWord: boolean
  useRegex: boolean
  matches: SearchMatch[]
  activeMatchIndex: number
  error: string
}

type HistorySnapshot = {
  sourceText: string
  ignoreEmptyLines: boolean
  wrapWithParentheses: boolean
  numericSort: boolean
  status: StatusKey
}

const resultPanelStorageKey = 'text-tool.resultPanelExpanded'
const isTauriRuntime = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
const isSettingsWindow =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('window') === 'settings'
const defaultFindPanel: FindPanelState = {
  expanded: false,
  mode: 'find',
  focusVersion: 0,
  query: '',
  replaceWith: '',
  caseSensitive: false,
  wholeWord: false,
  useRegex: false,
  matches: [],
  activeMatchIndex: -1,
  error: '',
}

const messages = {
  zh: {
    settings: '设置',
    closeSettings: '关闭设置',
    editorSettings: '编辑器',
    appearanceSettings: '外观',
    shortcutSettings: '快捷键',
    workspaceSettings: '工作区',
    showResults: '显示结果区',
    showLineNumbers: '显示行号',
    softWrap: '自动换行',
    focusEditorShortcut: '聚焦编辑区',
    toggleResultsShortcut: '显示/隐藏结果区',
    statusLabel: '当前文档状态',
    lines: '行',
    language: '语言',
    theme: '主题',
    lightTheme: '日间',
    darkTheme: '夜间',
    footerReady: '已准备处理 UTF-8 文本',
    footerEncoding: 'UTF-8',
    footerLocal: '本地处理',
    toastCopied: '已复制',
    formats: {
      double: '双引号格式',
      single: '单引号格式',
      plain: '纯逗号格式',
    },
    status: {
      ready: '就绪',
      converted: '已转换',
      reversed: '已按行逆序',
      deduplicated: '已按行去重',
      sorted: '已升序排序',
      commaToLines: '已将逗号内容转为行',
      cleared: '已清除原始内容',
      pasted: '已从剪贴板粘贴',
      copied: '已复制',
      replaced: '已替换',
    },
  },
  en: {
    settings: 'Settings',
    closeSettings: 'Close settings',
    editorSettings: 'Editor',
    appearanceSettings: 'Appearance',
    shortcutSettings: 'Shortcuts',
    workspaceSettings: 'Workspace',
    showResults: 'Show results',
    showLineNumbers: 'Line numbers',
    softWrap: 'Soft wrap',
    focusEditorShortcut: 'Focus editor',
    toggleResultsShortcut: 'Show/hide results',
    statusLabel: 'Current document status',
    lines: 'lines',
    language: 'Language',
    theme: 'Theme',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    footerReady: 'Ready for UTF-8 source text',
    footerEncoding: 'UTF-8',
    footerLocal: 'Local processing',
    toastCopied: 'Copied',
    formats: {
      double: 'Double quoted',
      single: 'Single quoted',
      plain: 'Plain comma',
    },
    status: {
      ready: 'Ready',
      converted: 'Converted',
      reversed: 'Reversed source lines',
      deduplicated: 'Deduplicated source lines',
      sorted: 'Sorted source lines',
      commaToLines: 'Converted comma values to lines',
      cleared: 'Cleared source text',
      pasted: 'Pasted from clipboard',
      copied: 'Copied',
      replaced: 'Replaced',
    },
  },
} satisfies Record<Language, object>

type SettingsText = (typeof messages)['zh']

function App() {
  const [sourceText, setSourceText] = useState('')
  const [ignoreEmptyLines, setIgnoreEmptyLines] = useState(true)
  const [wrapWithParentheses, setWrapWithParentheses] = useState(false)
  const [preferences, setPreferences] = useState(defaultPreferences)
  const [resultPanelExpanded, setResultPanelExpanded] = useState(() => {
    const saved = window.localStorage.getItem(resultPanelStorageKey)
    return saved === null ? true : saved === 'true'
  })
  const [numericSort, setNumericSort] = useState(false)
  const [resultOutputs, setResultOutputs] = useState<ResultOutput[]>([])
  const [findPanel, setFindPanel] = useState<FindPanelState>(defaultFindPanel)
  const [status, setStatus] = useState<StatusKey>('ready')
  const [toastMessage, setToastMessage] = useState('')
  const [, setHistoryPast] = useState<HistorySnapshot[]>([])
  const [, setHistoryFuture] = useState<HistorySnapshot[]>([])
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const sourceTextRef = useRef('')
  const ignoreEmptyLinesRef = useRef(true)
  const wrapWithParenthesesRef = useRef(false)
  const numericSortRef = useRef(false)
  const statusRef = useRef<StatusKey>('ready')
  const convertFrameRef = useRef<number | null>(null)
  const language = preferences.appearance.language
  const theme = preferences.appearance.theme
  const t = messages[language]

  const lineCount = useMemo(() => {
    if (!sourceText.length) {
      return 0
    }

    return sourceText.split('\n').length
  }, [sourceText])

  useEffect(() => {
    sourceTextRef.current = sourceText
  }, [sourceText])

  useEffect(() => {
    ignoreEmptyLinesRef.current = ignoreEmptyLines
  }, [ignoreEmptyLines])

  useEffect(() => {
    wrapWithParenthesesRef.current = wrapWithParentheses
  }, [wrapWithParentheses])

  useEffect(() => {
    numericSortRef.current = numericSort
  }, [numericSort])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    if (resultPanelExpanded) {
      scheduleConvert(sourceText)
    }
  }, [sourceText, ignoreEmptyLines, wrapWithParentheses, resultPanelExpanded])

  useEffect(() => {
    return () => {
      if (convertFrameRef.current !== null) {
        window.cancelAnimationFrame(convertFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isSettingsWindow) {
      return
    }

    const frame = window.requestAnimationFrame(focusEditor)
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(resultPanelStorageKey, String(resultPanelExpanded))
  }, [resultPanelExpanded])

  useEffect(() => {
    let active = true

    async function loadSavedPreferences() {
      const savedPreferences = await loadPreferences()

      if (active) {
        setPreferences(savedPreferences)
      }
    }

    void loadSavedPreferences()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let unlisten: (() => void) | undefined

    async function listenForPreferenceChanges() {
      if (!isTauriRuntime) {
        return
      }

      const { listen } = await import('@tauri-apps/api/event')
      unlisten = await listen<Preferences>('preferences-updated', (event) => {
        setPreferences(event.payload)
      })
    }

    void listenForPreferenceChanges()

    return () => {
      unlisten?.()
    }
  }, [])

  useEffect(() => {
    let unlisten: (() => void) | undefined

    async function listenForResultPanelChanges() {
      if (!isTauriRuntime) {
        return
      }

      const { listen } = await import('@tauri-apps/api/event')
      unlisten = await listen<boolean>('result-panel-expanded-updated', (event) => {
        setResultPanelExpanded(event.payload)
      })
    }

    void listenForResultPanelChanges()

    return () => {
      unlisten?.()
    }
  }, [])

  useEffect(() => {
    if (!isSettingsWindow || !isTauriRuntime) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        void closeSettingsWindow()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!toastMessage) {
      return
    }

    const timer = window.setTimeout(() => setToastMessage(''), 1600)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  useEffect(() => {
    if (!findPanel.expanded) {
      return
    }

    let active = true
    const options = getFindOptions(findPanel)

    async function updateMatches() {
      try {
        const result = await findMatches(sourceText, findPanel.query, options)

        if (!active) {
          return
        }

        const activeMatchIndex = getNextActiveMatchIndex(result.matches, findPanel.activeMatchIndex)
        setFindPanel((current) => ({
          ...current,
          matches: result.matches,
          activeMatchIndex,
          error: '',
        }))

        if (activeMatchIndex >= 0) {
          selectMatch(result.matches[activeMatchIndex], false)
        }
      } catch (error) {
        if (active) {
          setFindPanel((current) => ({
            ...current,
            matches: [],
            activeMatchIndex: -1,
            error: error instanceof Error ? error.message : String(error),
          }))
        }
      }
    }

    void updateMatches()

    return () => {
      active = false
    }
  }, [
    sourceText,
    findPanel.expanded,
    findPanel.query,
    findPanel.caseSensitive,
    findPanel.wholeWord,
    findPanel.useRegex,
  ])

  useEffect(() => {
    if (!findPanel.expanded) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeFindPanel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [findPanel.expanded])

  useEffect(() => {
    if (isSettingsWindow) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!event.metaKey || event.ctrlKey) {
        return
      }

      const key = event.key.toLowerCase()

      if (key === 'z') {
        event.preventDefault()

        if (event.shiftKey) {
          redoHistory()
        } else {
          undoHistory()
        }
        return
      }

      if (event.shiftKey) {
        return
      }

      if (event.key === '1') {
        event.preventDefault()
        focusEditor()
        return
      }

      if (event.key === '2') {
        event.preventDefault()
        setResultPanelExpanded((current) => !current)
        return
      }

      if (key === 'f') {
        event.preventDefault()
        openFindPanel('find')
        return
      }

      if (key === 'r') {
        event.preventDefault()
        openFindPanel('replace')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function runConvert(nextSourceText = sourceText) {
    const outputs = await convertAllFormats(nextSourceText, ignoreEmptyLines, wrapWithParentheses)
    setResultOutputs(outputs)
    setStatus('converted')
  }

  function scheduleConvert(nextSourceText = sourceText) {
    if (convertFrameRef.current !== null) {
      window.cancelAnimationFrame(convertFrameRef.current)
    }

    convertFrameRef.current = window.requestAnimationFrame(() => {
      convertFrameRef.current = null
      void runConvert(nextSourceText)
    })
  }

  function updateEditorPreference(option: keyof typeof preferences.editor, value: boolean) {
    setPreferences((current) => {
      const nextPreferences = {
        ...current,
        editor: {
          ...current.editor,
          [option]: value,
        },
      }

      void persistPreferences(nextPreferences)
      return nextPreferences
    })
  }

  function updateAppearancePreference(option: keyof typeof preferences.appearance, value: Language | Theme) {
    setPreferences((current) => {
      const nextPreferences = {
        ...current,
        appearance: {
          ...current.appearance,
          [option]: value,
        },
      }

      void persistPreferences(nextPreferences)
      return nextPreferences
    })
  }

  async function persistPreferences(nextPreferences: Preferences) {
    await savePreferences(nextPreferences).catch(() => undefined)

    if (isTauriRuntime) {
      const { emit } = await import('@tauri-apps/api/event')
      await emit('preferences-updated', nextPreferences)
    }
  }

  function updateResultPanelExpanded(value: boolean) {
    setResultPanelExpanded(value)
    window.localStorage.setItem(resultPanelStorageKey, String(value))

    if (isTauriRuntime) {
      void import('@tauri-apps/api/event').then(({ emit }) => emit('result-panel-expanded-updated', value))
    }
  }

  function focusEditor() {
    editorRef.current?.focus()
  }

  function getCurrentSourceText() {
    return editorRef.current?.value ?? sourceTextRef.current
  }

  function getHistorySnapshot(): HistorySnapshot {
    return {
      sourceText: sourceTextRef.current,
      ignoreEmptyLines: ignoreEmptyLinesRef.current,
      wrapWithParentheses: wrapWithParenthesesRef.current,
      numericSort: numericSortRef.current,
      status: statusRef.current,
    }
  }

  function applyHistorySnapshot(snapshot: HistorySnapshot) {
    sourceTextRef.current = snapshot.sourceText
    ignoreEmptyLinesRef.current = snapshot.ignoreEmptyLines
    wrapWithParenthesesRef.current = snapshot.wrapWithParentheses
    numericSortRef.current = snapshot.numericSort
    statusRef.current = snapshot.status
    setSourceText(snapshot.sourceText)
    setIgnoreEmptyLines(snapshot.ignoreEmptyLines)
    setWrapWithParentheses(snapshot.wrapWithParentheses)
    setNumericSort(snapshot.numericSort)
    setStatus(snapshot.status)
  }

  function commitHistorySnapshot(nextSnapshot: HistorySnapshot) {
    const currentSnapshot = getHistorySnapshot()

    if (areHistorySnapshotsEqual(currentSnapshot, nextSnapshot)) {
      return
    }

    setHistoryPast((current) => [...current, currentSnapshot])
    setHistoryFuture([])
    applyHistorySnapshot(nextSnapshot)
  }

  function updateUndoableState(values: Partial<HistorySnapshot>) {
    commitHistorySnapshot({
      ...getHistorySnapshot(),
      ...values,
    })
  }

  function updateSourceText(value: string) {
    updateUndoableState({ sourceText: value })
  }

  function undoHistory() {
    setHistoryPast((past) => {
      if (!past.length) {
        return past
      }

      const previousSnapshot = past[past.length - 1]
      setHistoryFuture((future) => [getHistorySnapshot(), ...future])
      applyHistorySnapshot(previousSnapshot)
      return past.slice(0, -1)
    })
  }

  function redoHistory() {
    setHistoryFuture((future) => {
      if (!future.length) {
        return future
      }

      const nextSnapshot = future[0]
      setHistoryPast((past) => [...past, getHistorySnapshot()])
      applyHistorySnapshot(nextSnapshot)
      return future.slice(1)
    })
  }

  function getSelectedText() {
    const editor = editorRef.current

    if (!editor || editor.selectionStart === editor.selectionEnd) {
      return ''
    }

    return editor.value.slice(editor.selectionStart, editor.selectionEnd)
  }

  function openFindPanel(mode: FindPanelState['mode']) {
    const selectedText = getSelectedText()

    setFindPanel((current) => ({
      ...current,
      expanded: true,
      mode,
      focusVersion: current.focusVersion + 1,
      query: selectedText || current.query,
      error: '',
    }))
  }

  function closeFindPanel() {
    setFindPanel((current) => ({
      ...current,
      expanded: false,
      matches: [],
      activeMatchIndex: -1,
      error: '',
    }))
    focusEditor()
  }

  function updateFindPanel(values: Partial<FindPanelState>) {
    setFindPanel((current) => {
      const shouldResetMatches =
        'query' in values || 'caseSensitive' in values || 'wholeWord' in values || 'useRegex' in values

      return {
        ...current,
        ...values,
        activeMatchIndex: shouldResetMatches ? -1 : values.activeMatchIndex ?? current.activeMatchIndex,
        error: shouldResetMatches ? '' : values.error ?? current.error,
      }
    })
  }

  function selectMatch(match: SearchMatch, shouldFocus = true) {
    const editor = editorRef.current

    if (!editor) {
      return
    }

    window.requestAnimationFrame(() => {
      if (shouldFocus) {
        editor.focus()
      }

      editor.setSelectionRange(match.start, match.end)
      scrollEditorToMatch(editor, match.start)
    })
  }

  function selectRelativeMatch(direction: 1 | -1) {
    if (!findPanel.matches.length) {
      return
    }

    const nextIndex =
      findPanel.activeMatchIndex < 0
        ? direction > 0
          ? 0
          : findPanel.matches.length - 1
        : (findPanel.activeMatchIndex + direction + findPanel.matches.length) % findPanel.matches.length

    setFindPanel((current) => ({
      ...current,
      activeMatchIndex: nextIndex,
    }))
    selectMatch(findPanel.matches[nextIndex])
  }

  async function handleReplaceCurrent() {
    if (!findPanel.query) {
      return null
    }

    try {
      const source = getCurrentSourceText()
      const activeMatch = findPanel.matches[findPanel.activeMatchIndex]
      const input = activeMatch ? source.slice(activeMatch.start) : source
      const result = await replaceFirst(input, findPanel.query, findPanel.replaceWith, getFindOptions(findPanel))
      const nextText = activeMatch ? source.slice(0, activeMatch.start) + result.output : result.output

      updateUndoableState({ sourceText: nextText, status: 'replaced' })
      return {
        nextText,
        replacedAt: activeMatch?.start ?? 0,
      }
    } catch (error) {
      updateFindPanel({ error: error instanceof Error ? error.message : String(error) })
      return null
    }
  }

  async function handleReplaceCurrentAndFindNext() {
    const result = await handleReplaceCurrent()

    if (!result) {
      return
    }

    const matches = await findMatches(result.nextText, findPanel.query, getFindOptions(findPanel)).then((value) => value.matches)
    const nextIndex = matches.findIndex((match) => match.start > result.replacedAt)
    const activeMatchIndex = nextIndex >= 0 ? nextIndex : getNextActiveMatchIndex(matches, -1)

    setFindPanel((current) => ({
      ...current,
      matches,
      activeMatchIndex,
      error: '',
    }))

    if (activeMatchIndex >= 0) {
      selectMatch(matches[activeMatchIndex])
    }
  }

  async function handleReplaceAll() {
    if (!findPanel.query) {
      return
    }

    try {
      const result = await replaceAll(getCurrentSourceText(), findPanel.query, findPanel.replaceWith, getFindOptions(findPanel))
      updateUndoableState({ sourceText: result.output, status: 'replaced' })
    } catch (error) {
      updateFindPanel({ error: error instanceof Error ? error.message : String(error) })
    }
  }

  async function handleReverseLines() {
    const reversedText = reverseLinesLocal(getCurrentSourceText())
    updateUndoableState({ sourceText: reversedText, status: 'reversed' })
  }

  async function handleDeduplicateLines() {
    const result = await deduplicateLines(getCurrentSourceText())
    updateUndoableState({ sourceText: result.output, status: 'deduplicated' })
  }

  async function handleSortLines() {
    const result = await sortLinesAscending(getCurrentSourceText(), numericSort)
    updateUndoableState({ sourceText: result.output, status: 'sorted' })
  }

  async function handleSortLinesDescending() {
    const result = await sortLinesDescending(getCurrentSourceText(), numericSort)
    updateUndoableState({ sourceText: result.output, status: 'sorted' })
  }

  async function handleCommaValuesToLines() {
    const result = await commaValuesToLines(getCurrentSourceText())
    updateUndoableState({ sourceText: result.output, status: 'commaToLines' })
  }

  async function handleClearSource() {
    updateUndoableState({ sourceText: '', status: 'cleared' })
  }

  async function handleCopySource() {
    const text = getCurrentSourceText()

    if (!text) {
      return
    }

    await writeClipboardText(text)
    setStatus('copied')
    setToastMessage(t.toastCopied)
  }

  async function handlePasteSource() {
    const text = await readClipboardText()
    updateUndoableState({ sourceText: text, status: 'pasted' })
  }

  async function handleCopy(output: string) {
    if (!output) {
      return
    }

    await writeClipboardText(output)
    setStatus('copied')
    setToastMessage(t.toastCopied)
  }

  async function handleWindowDrag(event: PointerEvent<HTMLElement>) {
    if (!isTauriRuntime || event.button !== 0 || event.target !== event.currentTarget) {
      return
    }

    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    await getCurrentWindow().startDragging()
  }

  if (isSettingsWindow) {
    return (
      <SettingsWindow
        preferences={preferences}
        resultPanelExpanded={resultPanelExpanded}
        text={t}
        onAppearancePreferenceChange={updateAppearancePreference}
        onEditorPreferenceChange={updateEditorPreference}
        onResultPanelExpandedChange={updateResultPanelExpanded}
      />
    )
  }

  return (
    <main className="app-shell" data-theme={theme}>
      <header className="app-header" onPointerDown={handleWindowDrag} />

      <section className={resultPanelExpanded ? 'workspace-grid' : 'workspace-grid results-collapsed'}>
        <div className="workbench-column source-column">
          <InputEditor
            editorRef={editorRef}
            value={sourceText}
            numericSort={numericSort}
            showLineNumbers={preferences.editor.showLineNumbers}
            softWrap={preferences.editor.softWrap}
            findPanel={findPanel}
            text={inputText[language]}
            onChange={updateSourceText}
            onCloseFind={closeFindPanel}
            onFindPanelChange={updateFindPanel}
            onFindPrevious={() => selectRelativeMatch(-1)}
            onFindNext={() => selectRelativeMatch(1)}
            onReplaceCurrent={() => void handleReplaceCurrent()}
            onReplaceCurrentAndFindNext={() => void handleReplaceCurrentAndFindNext()}
            onReplaceAll={() => void handleReplaceAll()}
            onNumericSortChange={(value) => updateUndoableState({ numericSort: value })}
            onCopySource={() => void handleCopySource()}
            onClearSource={() => void handleClearSource()}
            onPasteSource={() => void handlePasteSource()}
            onReverseLines={() => void handleReverseLines()}
            onDeduplicateLines={() => void handleDeduplicateLines()}
            onSortLines={() => void handleSortLines()}
            onSortLinesDescending={() => void handleSortLinesDescending()}
            onCommaValuesToLines={() => void handleCommaValuesToLines()}
          />
        </div>

        {resultPanelExpanded ? (
          <ResultView
            ignoreEmptyLines={ignoreEmptyLines}
            wrapWithParentheses={wrapWithParentheses}
            outputs={resultOutputs}
            text={resultText[language]}
            formatLabels={t.formats}
            onIgnoreEmptyLinesChange={(value) => updateUndoableState({ ignoreEmptyLines: value })}
            onWrapWithParenthesesChange={(value) => updateUndoableState({ wrapWithParentheses: value })}
            onCopy={(output) => void handleCopy(output)}
          />
        ) : null}
      </section>

      <footer className="status-bar">
        <div className="status-bar-group">
          <span>{t.status[status]}</span>
          <span>
            {lineCount} {t.lines}
          </span>
        </div>
        <div className="status-bar-group">
          <span>{t.footerReady}</span>
          <span>{t.footerEncoding}</span>
          <span>{t.footerLocal}</span>
        </div>
      </footer>

      {toastMessage ? (
        <div className="toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}
    </main>
  )
}

type SettingsWindowProps = {
  preferences: Preferences
  resultPanelExpanded: boolean
  text: SettingsText
  onAppearancePreferenceChange: (option: keyof Preferences['appearance'], value: Language | Theme) => void
  onEditorPreferenceChange: (option: keyof Preferences['editor'], value: boolean) => void
  onResultPanelExpandedChange: (value: boolean) => void
}

function SettingsWindow({
  preferences,
  resultPanelExpanded,
  text,
  onAppearancePreferenceChange,
  onEditorPreferenceChange,
  onResultPanelExpandedChange,
}: SettingsWindowProps) {
  const language = preferences.appearance.language
  const theme = preferences.appearance.theme

  return (
    <main className="settings-window" data-theme={theme}>
      <section className="settings-panel" aria-label={text.settings}>
        <div className="settings-panel-header">
          <h1>{text.settings}</h1>
        </div>
        <div className="settings-group">
          <h2>{text.workspaceSettings}</h2>
          <button
            className={resultPanelExpanded ? 'sort-option-toggle active' : 'sort-option-toggle'}
            type="button"
            aria-pressed={resultPanelExpanded}
            onClick={() => onResultPanelExpandedChange(!resultPanelExpanded)}
          >
            <span className="toggle-track" aria-hidden="true">
              <span className="toggle-thumb" />
            </span>
            <span>{text.showResults}</span>
          </button>
        </div>
        <div className="settings-group">
          <h2>{text.editorSettings}</h2>
          <button
            className={preferences.editor.showLineNumbers ? 'sort-option-toggle active' : 'sort-option-toggle'}
            type="button"
            aria-pressed={preferences.editor.showLineNumbers}
            onClick={() => onEditorPreferenceChange('showLineNumbers', !preferences.editor.showLineNumbers)}
          >
            <span className="toggle-track" aria-hidden="true">
              <span className="toggle-thumb" />
            </span>
            <span>{text.showLineNumbers}</span>
          </button>
          <button
            className={preferences.editor.softWrap ? 'sort-option-toggle active' : 'sort-option-toggle'}
            type="button"
            aria-pressed={preferences.editor.softWrap}
            onClick={() => onEditorPreferenceChange('softWrap', !preferences.editor.softWrap)}
          >
            <span className="toggle-track" aria-hidden="true">
              <span className="toggle-thumb" />
            </span>
            <span>{text.softWrap}</span>
          </button>
        </div>
        <div className="settings-group">
          <h2>{text.appearanceSettings}</h2>
          <div className="settings-row">
            <span>{text.theme}</span>
            <div className="segmented-control" aria-label={text.theme}>
              <button
                className={theme === 'light' ? 'active' : ''}
                type="button"
                title={text.lightTheme}
                aria-label={text.lightTheme}
                onClick={() => onAppearancePreferenceChange('theme', 'light')}
              >
                ☀
              </button>
              <button
                className={theme === 'dark' ? 'active' : ''}
                type="button"
                title={text.darkTheme}
                aria-label={text.darkTheme}
                onClick={() => onAppearancePreferenceChange('theme', 'dark')}
              >
                ◐
              </button>
            </div>
          </div>
          <div className="settings-row">
            <span>{text.language}</span>
            <div className="language-switch" aria-label={text.language}>
              <button
                className={language === 'zh' ? 'active' : ''}
                type="button"
                title="中文"
                aria-label="中文"
                onClick={() => onAppearancePreferenceChange('language', 'zh')}
              >
                中
              </button>
              <button
                className={language === 'en' ? 'active' : ''}
                type="button"
                title="English"
                aria-label="English"
                onClick={() => onAppearancePreferenceChange('language', 'en')}
              >
                EN
              </button>
            </div>
          </div>
        </div>
        <div className="settings-group">
          <h2>{text.shortcutSettings}</h2>
          <div className="shortcut-row">
            <span>{text.focusEditorShortcut}</span>
            <kbd>⌘1</kbd>
          </div>
          <div className="shortcut-row">
            <span>{text.toggleResultsShortcut}</span>
            <kbd>⌘2</kbd>
          </div>
        </div>
      </section>
    </main>
  )
}

const inputText = {
  zh: {
    copy: '复制',
    paste: '粘贴',
    clear: '清除',
    lineTools: '行工具',
    reverseLines: '倒排行',
    deduplicateLines: '去重',
    sortLines: '升序',
    sortLinesDescending: '降序',
    numericSort: '数字排序',
    commaToLines: '逗号转行',
    placeholder: '请输入内容',
    find: '查找',
    replace: '替换',
    openFind: '查找替换',
    closeFind: '关闭查找',
    previousMatch: '上一个',
    nextMatch: '下一个',
    replaceCurrent: '替换',
    replaceAll: '全部替换',
    caseSensitive: '区分大小写',
    wholeWord: '整词匹配',
    regex: '正则表达式',
    noResults: '无结果',
    resultCount: (active: number, total: number) => `${active}/${total}`,
  },
  en: {
    copy: 'Copy',
    paste: 'Paste',
    clear: 'Clear',
    lineTools: 'Line tools',
    reverseLines: 'Reverse',
    deduplicateLines: 'Deduplicate',
    sortLines: 'Sort',
    sortLinesDescending: 'Reverse sort',
    numericSort: 'Numeric sort',
    commaToLines: 'Comma to lines',
    placeholder: 'Enter content',
    find: 'Find',
    replace: 'Replace',
    openFind: 'Find and replace',
    closeFind: 'Close find',
    previousMatch: 'Previous match',
    nextMatch: 'Next match',
    replaceCurrent: 'Replace',
    replaceAll: 'Replace all',
    caseSensitive: 'Case sensitive',
    wholeWord: 'Whole word',
    regex: 'Regular expression',
    noResults: 'No results',
    resultCount: (active: number, total: number) => `${active}/${total}`,
  },
}

const resultText = {
  zh: {
    title: '转换结果',
    ignoreEmptyLines: '忽略空行',
    wrapWithParentheses: '添加括号',
    copy: '复制',
    empty: '转换结果会显示在这里。',
    hideResults: '隐藏转换区',
    showResults: '展开转换区',
    visibility: '转换区显示',
  },
  en: {
    title: 'Conversion Results',
    ignoreEmptyLines: 'Ignore empty lines',
    wrapWithParentheses: 'Add parentheses',
    copy: 'Copy',
    empty: 'Conversion results appear here.',
    hideResults: 'Hide conversion area',
    showResults: 'Show conversion area',
    visibility: 'Conversion area visibility',
  },
}

function reverseLinesLocal(value: string) {
  return value.split('\n').reverse().join('\n')
}

function getFindOptions(state: Pick<FindPanelState, 'caseSensitive' | 'wholeWord' | 'useRegex'>): FindOptions {
  return {
    caseSensitive: state.caseSensitive,
    wholeWord: state.wholeWord,
    useRegex: state.useRegex,
  }
}

function areHistorySnapshotsEqual(first: HistorySnapshot, second: HistorySnapshot) {
  return (
    first.sourceText === second.sourceText &&
    first.ignoreEmptyLines === second.ignoreEmptyLines &&
    first.wrapWithParentheses === second.wrapWithParentheses &&
    first.numericSort === second.numericSort &&
    first.status === second.status
  )
}

function getNextActiveMatchIndex(matches: SearchMatch[], currentIndex: number) {
  if (!matches.length) {
    return -1
  }

  if (currentIndex < 0) {
    return 0
  }

  return Math.min(currentIndex, matches.length - 1)
}

function scrollEditorToMatch(editor: HTMLTextAreaElement, matchStart: number) {
  const textBeforeMatch = editor.value.slice(0, matchStart)
  const lineIndex = textBeforeMatch.split('\n').length - 1
  const styles = window.getComputedStyle(editor)
  const lineHeight = Number.parseFloat(styles.lineHeight) || 23
  const paddingTop = Number.parseFloat(styles.paddingTop) || 0
  const targetTop = lineIndex * lineHeight + paddingTop - editor.clientHeight / 2 + lineHeight

  editor.scrollTop = Math.max(0, targetTop)
}

export default App
