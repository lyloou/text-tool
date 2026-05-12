import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import './App.css'
import InputEditor from './components/InputEditor'
import ResultView from './components/ResultView'
import {
  convertAllFormats,
  commaValuesToLines,
  deduplicateLines,
  defaultPreferences,
  loadPreferences,
  readClipboardText,
  savePreferences,
  sortLinesAscending,
  sortLinesDescending,
  writeClipboardText,
  type Preferences,
  type ResultOutput,
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

const resultPanelStorageKey = 'rust-data-process.resultPanelExpanded'
const isTauriRuntime = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

const messages = {
  zh: {
    settings: '设置',
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
    },
  },
  en: {
    settings: 'Settings',
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
    },
  },
} satisfies Record<Language, object>

function App() {
  const [sourceText, setSourceText] = useState('')
  const [ignoreEmptyLines, setIgnoreEmptyLines] = useState(true)
  const [wrapWithParentheses, setWrapWithParentheses] = useState(false)
  const [preferences, setPreferences] = useState(defaultPreferences)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [resultPanelExpanded, setResultPanelExpanded] = useState(() => {
    const saved = window.localStorage.getItem(resultPanelStorageKey)
    return saved === null ? true : saved === 'true'
  })
  const [numericSort, setNumericSort] = useState(false)
  const [resultOutputs, setResultOutputs] = useState<ResultOutput[]>([])
  const [status, setStatus] = useState<StatusKey>('ready')
  const [toastMessage, setToastMessage] = useState('')
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const sourceTextRef = useRef('')
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
    if (resultPanelExpanded) {
      void runConvert(sourceText)
    }
  }, [sourceText, ignoreEmptyLines, wrapWithParentheses, resultPanelExpanded])

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
    if (!toastMessage) {
      return
    }

    const timer = window.setTimeout(() => setToastMessage(''), 1600)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!event.metaKey || event.shiftKey || event.ctrlKey) {
        return
      }

      if (event.key === '1') {
        event.preventDefault()
        setSettingsOpen(false)
        focusEditor()
        return
      }

      if (event.key === '2') {
        event.preventDefault()
        setResultPanelExpanded((current) => !current)
        return
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

  function updateEditorPreference(option: keyof typeof preferences.editor, value: boolean) {
    setPreferences((current) => {
      const nextPreferences = {
        ...current,
        editor: {
          ...current.editor,
          [option]: value,
        },
      }

      void savePreferences(nextPreferences).catch(() => undefined)
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

      void savePreferences(nextPreferences).catch(() => undefined)
      return nextPreferences
    })
  }

  function focusEditor() {
    editorRef.current?.focus()
  }

  function getCurrentSourceText() {
    return editorRef.current?.value ?? sourceTextRef.current
  }

  function updateSourceText(value: string) {
    sourceTextRef.current = value
    setSourceText(value)
  }

  async function handleReverseLines() {
    const reversedText = reverseLinesLocal(getCurrentSourceText())
    updateSourceText(reversedText)
    setStatus('reversed')
  }

  async function handleDeduplicateLines() {
    const result = await deduplicateLines(getCurrentSourceText())
    updateSourceText(result.output)
    setStatus('deduplicated')
  }

  async function handleSortLines() {
    const result = await sortLinesAscending(getCurrentSourceText(), numericSort)
    updateSourceText(result.output)
    setStatus('sorted')
  }

  async function handleSortLinesDescending() {
    const result = await sortLinesDescending(getCurrentSourceText(), numericSort)
    updateSourceText(result.output)
    setStatus('sorted')
  }

  async function handleCommaValuesToLines() {
    const result = await commaValuesToLines(getCurrentSourceText())
    updateSourceText(result.output)
    setStatus('commaToLines')
  }

  async function handleClearSource() {
    updateSourceText('')
    setStatus('cleared')
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
    updateSourceText(text)
    setStatus('pasted')
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

  return (
    <main className="app-shell" data-theme={theme}>
      <header className="app-header" onPointerDown={handleWindowDrag}>
        <div className="header-metrics" aria-label={t.statusLabel}>
          <div className="settings-menu">
            <button
              className={settingsOpen ? 'settings-button active' : 'settings-button'}
              type="button"
              title={t.settings}
              aria-label={t.settings}
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen(!settingsOpen)}
            >
              ⚙
            </button>
            {settingsOpen ? (
              <div className="settings-popover">
                <div className="settings-group">
                  <h3>{t.workspaceSettings}</h3>
                  <button
                    className={resultPanelExpanded ? 'sort-option-toggle active' : 'sort-option-toggle'}
                    type="button"
                    aria-pressed={resultPanelExpanded}
                    onClick={() => setResultPanelExpanded(!resultPanelExpanded)}
                  >
                    <span className="toggle-track" aria-hidden="true">
                      <span className="toggle-thumb" />
                    </span>
                    <span>{t.showResults}</span>
                  </button>
                </div>
                <div className="settings-group">
                  <h3>{t.editorSettings}</h3>
                  <button
                    className={preferences.editor.showLineNumbers ? 'sort-option-toggle active' : 'sort-option-toggle'}
                    type="button"
                    aria-pressed={preferences.editor.showLineNumbers}
                    onClick={() => updateEditorPreference('showLineNumbers', !preferences.editor.showLineNumbers)}
                  >
                    <span className="toggle-track" aria-hidden="true">
                      <span className="toggle-thumb" />
                    </span>
                    <span>{t.showLineNumbers}</span>
                  </button>
                  <button
                    className={preferences.editor.softWrap ? 'sort-option-toggle active' : 'sort-option-toggle'}
                    type="button"
                    aria-pressed={preferences.editor.softWrap}
                    onClick={() => updateEditorPreference('softWrap', !preferences.editor.softWrap)}
                  >
                    <span className="toggle-track" aria-hidden="true">
                      <span className="toggle-thumb" />
                    </span>
                    <span>{t.softWrap}</span>
                  </button>
                </div>
                <div className="settings-group">
                  <h3>{t.appearanceSettings}</h3>
                  <div className="settings-row">
                    <span>{t.theme}</span>
                    <div className="segmented-control" aria-label={t.theme}>
                      <button
                        className={theme === 'light' ? 'active' : ''}
                        type="button"
                        title={t.lightTheme}
                        aria-label={t.lightTheme}
                        onClick={() => updateAppearancePreference('theme', 'light')}
                      >
                        ☀
                      </button>
                      <button
                        className={theme === 'dark' ? 'active' : ''}
                        type="button"
                        title={t.darkTheme}
                        aria-label={t.darkTheme}
                        onClick={() => updateAppearancePreference('theme', 'dark')}
                      >
                        ◐
                      </button>
                    </div>
                  </div>
                  <div className="settings-row">
                    <span>{t.language}</span>
                    <div className="language-switch" aria-label={t.language}>
                      <button
                        className={language === 'zh' ? 'active' : ''}
                        type="button"
                        title="中文"
                        aria-label="中文"
                        onClick={() => updateAppearancePreference('language', 'zh')}
                      >
                        中
                      </button>
                      <button
                        className={language === 'en' ? 'active' : ''}
                        type="button"
                        title="English"
                        aria-label="English"
                        onClick={() => updateAppearancePreference('language', 'en')}
                      >
                        EN
                      </button>
                    </div>
                  </div>
                </div>
                <div className="settings-group">
                  <h3>{t.shortcutSettings}</h3>
                  <div className="shortcut-row">
                    <span>{t.focusEditorShortcut}</span>
                    <kbd>⌘1</kbd>
                  </div>
                  <div className="shortcut-row">
                    <span>{t.toggleResultsShortcut}</span>
                    <kbd>⌘2</kbd>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <section className={resultPanelExpanded ? 'workspace-grid' : 'workspace-grid results-collapsed'}>
        <div className="workbench-column source-column">
          <InputEditor
            editorRef={editorRef}
            value={sourceText}
            numericSort={numericSort}
            showLineNumbers={preferences.editor.showLineNumbers}
            softWrap={preferences.editor.softWrap}
            text={inputText[language]}
            onChange={updateSourceText}
            onNumericSortChange={setNumericSort}
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
            onIgnoreEmptyLinesChange={setIgnoreEmptyLines}
            onWrapWithParenthesesChange={setWrapWithParentheses}
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

export default App
