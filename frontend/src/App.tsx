import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import InputEditor from './components/InputEditor'
import ResultView from './components/ResultView'
import Toolbar from './components/Toolbar'
import {
  convertAllFormats,
  commaValuesToLines,
  deduplicateLines,
  readClipboardText,
  replaceText,
  searchMatches,
  sortLinesAscending,
  writeClipboardText,
  type FindOptions,
  type ResultOutput,
  type SearchMatch,
} from './services/tauriApi'

type Language = 'zh' | 'en'
type Theme = 'light' | 'dark'
type StatusKey =
  | 'ready'
  | 'converted'
  | 'replaced'
  | 'noSearchTerm'
  | 'reversed'
  | 'deduplicated'
  | 'sorted'
  | 'commaToLines'
  | 'cleared'
  | 'pasted'
  | 'copied'
  | 'invalidSearch'

const messages = {
  zh: {
    appEyebrow: '文本工具',
    appTitle: '文本处理工作台',
    statusLabel: '当前文档状态',
    lines: '行',
    matches: '匹配',
    language: '语言',
    theme: '主题',
    lightTheme: '日间',
    darkTheme: '夜间',
    invalidSearch: '查找表达式无效',
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
      replaced: '已替换原始内容',
      noSearchTerm: '未输入查找内容',
      reversed: '已按行逆序',
      deduplicated: '已按行去重',
      sorted: '已升序排序',
      commaToLines: '已将逗号内容转为行',
      cleared: '已清除原始内容',
      pasted: '已从剪贴板粘贴',
      copied: '已复制',
      invalidSearch: '查找表达式无效',
    },
  },
  en: {
    appEyebrow: 'Text Utility',
    appTitle: 'Text Processing Workbench',
    statusLabel: 'Current document status',
    lines: 'lines',
    matches: 'matches',
    language: 'Language',
    theme: 'Theme',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    invalidSearch: 'Invalid search expression',
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
      replaced: 'Replaced source text',
      noSearchTerm: 'No search term',
      reversed: 'Reversed source lines',
      deduplicated: 'Deduplicated source lines',
      sorted: 'Sorted source lines',
      commaToLines: 'Converted comma values to lines',
      cleared: 'Cleared source text',
      pasted: 'Pasted from clipboard',
      copied: 'Copied',
      invalidSearch: 'Invalid search expression',
    },
  },
} satisfies Record<Language, object>

function App() {
  const [language, setLanguage] = useState<Language>('zh')
  const [theme, setTheme] = useState<Theme>('light')
  const [sourceText, setSourceText] = useState('')
  const [ignoreEmptyLines, setIgnoreEmptyLines] = useState(true)
  const [replaceQuery, setReplaceQuery] = useState('')
  const [replaceWith, setReplaceWith] = useState('')
  const [findOptions, setFindOptions] = useState<FindOptions>({
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
  })
  const [replaceVisible, setReplaceVisible] = useState(true)
  const [sourceMatches, setSourceMatches] = useState<SearchMatch[]>([])
  const [resultOutputs, setResultOutputs] = useState<ResultOutput[]>([])
  const [status, setStatus] = useState<StatusKey>('ready')
  const [toastMessage, setToastMessage] = useState('')
  const findInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const t = messages[language]

  const lineCount = useMemo(() => {
    if (!sourceText.length) {
      return 0
    }

    return sourceText.split('\n').length
  }, [sourceText])

  useEffect(() => {
    void refreshMatches(sourceText, replaceQuery)
  }, [sourceText, replaceQuery, findOptions])

  useEffect(() => {
    void runConvert(sourceText)
  }, [ignoreEmptyLines])

  useEffect(() => {
    if (!toastMessage) {
      return
    }

    const timer = window.setTimeout(() => setToastMessage(''), 1600)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!event.metaKey || event.shiftKey || event.ctrlKey || event.key.toLowerCase() !== 'f') {
        return
      }

      event.preventDefault()

      if (event.altKey) {
        setReplaceVisible(true)
        window.requestAnimationFrame(() => {
          replaceInputRef.current?.focus()
          replaceInputRef.current?.select()
        })
        return
      }

      window.requestAnimationFrame(() => {
        findInputRef.current?.focus()
        findInputRef.current?.select()
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function runConvert(nextSourceText = sourceText) {
    const outputs = await convertAllFormats(nextSourceText, ignoreEmptyLines)
    setResultOutputs(outputs)
    setStatus('converted')
  }

  async function runReplace(replaceAllMatches: boolean) {
    if (!replaceQuery) {
      setStatus('noSearchTerm')
      return
    }

    try {
      const result = await replaceText(sourceText, replaceQuery, replaceWith, findOptions, replaceAllMatches)
      setSourceText(result.output)
      await runConvert(result.output)
      setStatus('replaced')
    } catch {
      setSourceMatches([])
      setStatus('invalidSearch')
      setToastMessage(t.invalidSearch)
    }
  }

  async function refreshMatches(text: string, query: string) {
    if (!query) {
      setSourceMatches([])
      return
    }

    try {
      const result = await searchMatches(text, query, findOptions)
      setSourceMatches(result.matches)
    } catch {
      setSourceMatches([])
      setStatus('invalidSearch')
    }
  }

  function updateFindOption(option: keyof FindOptions, value: boolean) {
    setFindOptions((current) => ({
      ...current,
      [option]: value,
    }))
  }

  function focusEditor() {
    editorRef.current?.focus()
  }

  async function handleReverseLines() {
    const reversedText = reverseLinesLocal(sourceText)
    setSourceText(reversedText)
    await runConvert(reversedText)
    setStatus('reversed')
  }

  async function handleDeduplicateLines() {
    const result = await deduplicateLines(sourceText)
    setSourceText(result.output)
    await runConvert(result.output)
    setStatus('deduplicated')
  }

  async function handleSortLines() {
    const result = await sortLinesAscending(sourceText)
    setSourceText(result.output)
    await runConvert(result.output)
    setStatus('sorted')
  }

  async function handleCommaValuesToLines() {
    const result = await commaValuesToLines(sourceText)
    setSourceText(result.output)
    await runConvert(result.output)
    setStatus('commaToLines')
  }

  async function handleClearSource() {
    setSourceText('')
    await runConvert('')
    setStatus('cleared')
  }

  async function handleCopySource() {
    if (!sourceText) {
      return
    }

    await writeClipboardText(sourceText)
    setStatus('copied')
    setToastMessage(t.toastCopied)
  }

  async function handlePasteSource() {
    const text = await readClipboardText()
    setSourceText(text)
    await runConvert(text)
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

  return (
    <main className="app-shell" data-theme={theme}>
      <header className="app-header">
        <div>
          <p className="eyebrow">{t.appEyebrow}</p>
          <h1>{t.appTitle}</h1>
        </div>
        <div className="header-metrics" aria-label={t.statusLabel}>
          <div className="segmented-control" aria-label={t.theme}>
            <button
              className={theme === 'light' ? 'active' : ''}
              type="button"
              onClick={() => setTheme('light')}
            >
              {t.lightTheme}
            </button>
            <button
              className={theme === 'dark' ? 'active' : ''}
              type="button"
              onClick={() => setTheme('dark')}
            >
              {t.darkTheme}
            </button>
          </div>
          <div className="language-switch" aria-label={t.language}>
            <button
              className={language === 'zh' ? 'active' : ''}
              type="button"
              onClick={() => setLanguage('zh')}
            >
              中文
            </button>
            <button
              className={language === 'en' ? 'active' : ''}
              type="button"
              onClick={() => setLanguage('en')}
            >
              English
            </button>
          </div>
          <span>{t.status[status]}</span>
          <span>
            {lineCount} {t.lines}
          </span>
          <span>
            {sourceMatches.length} {t.matches}
          </span>
        </div>
      </header>

      <section className="workspace-grid">
        <div className="workbench-column source-column">
          <Toolbar
            replaceQuery={replaceQuery}
            replaceWith={replaceWith}
            matchCount={sourceMatches.length}
            findOptions={findOptions}
            replaceVisible={replaceVisible}
            text={toolbarText[language]}
            findInputRef={findInputRef}
            replaceInputRef={replaceInputRef}
            onReplaceQueryChange={setReplaceQuery}
            onReplaceWithChange={setReplaceWith}
            onFindOptionChange={updateFindOption}
            onReplaceVisibleChange={setReplaceVisible}
            onReplace={() => void runReplace(false)}
            onReplaceAll={() => void runReplace(true)}
            onEscape={focusEditor}
          />
          <InputEditor
            editorRef={editorRef}
            value={sourceText}
            searchQuery={replaceQuery}
            matches={sourceMatches}
            text={inputText[language]}
            onChange={setSourceText}
            onCopySource={() => void handleCopySource()}
            onClearSource={() => void handleClearSource()}
            onPasteSource={() => void handlePasteSource()}
            onReverseLines={() => void handleReverseLines()}
            onDeduplicateLines={() => void handleDeduplicateLines()}
            onSortLines={() => void handleSortLines()}
            onCommaValuesToLines={() => void handleCommaValuesToLines()}
          />
        </div>

        <ResultView
          ignoreEmptyLines={ignoreEmptyLines}
          outputs={resultOutputs}
          text={resultText[language]}
          formatLabels={t.formats}
          onIgnoreEmptyLinesChange={setIgnoreEmptyLines}
          onConvert={() => void runConvert()}
          onCopy={(output) => void handleCopy(output)}
        />
      </section>

      <footer className="status-bar">
        <span>{t.footerReady}</span>
        <span>{t.footerEncoding}</span>
        <span>{t.footerLocal}</span>
      </footer>

      {toastMessage ? (
        <div className="toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}
    </main>
  )
}

const toolbarText = {
  zh: {
    eyebrow: '原始文本操作',
    title: '原始内容工作台',
    matchCount: (count: number) => `命中 ${count} 项`,
    replaceEyebrow: '替换',
    replaceTitle: '查找替换',
    find: '查找',
    replaceWith: '替换为',
    matchHint: (query: string, count: number) => (query ? `匹配 ${count} 项` : '未输入查找内容'),
    caseSensitive: '区分大小写',
    wholeWord: '整字',
    useRegex: '正则',
    showReplace: '替换',
    replaceOne: '替换',
    replaceAll: '全部替换',
  },
  en: {
    eyebrow: 'Source Text Operations',
    title: 'Source Workbench',
    matchCount: (count: number) => `${count} matches`,
    replaceEyebrow: 'Replace',
    replaceTitle: 'Find and Replace',
    find: 'Find',
    replaceWith: 'Replace with',
    matchHint: (query: string, count: number) => (query ? `${count} matches` : 'No search term'),
    caseSensitive: 'Match case',
    wholeWord: 'Whole word',
    useRegex: 'Regex',
    showReplace: 'Replace',
    replaceOne: 'Replace',
    replaceAll: 'Replace all',
  },
}

const inputText = {
  zh: {
    eyebrow: '输入',
    title: '原始内容',
    copy: '复制',
    paste: '粘贴',
    clear: '清除',
    lineTools: '行工具',
    reverseLines: '逆序',
    deduplicateLines: '去重',
    sortLines: '升序',
    commaToLines: '逗号转行',
    placeholder: '请输入内容',
  },
  en: {
    eyebrow: 'Input',
    title: 'Source Content',
    copy: 'Copy',
    paste: 'Paste',
    clear: 'Clear',
    lineTools: 'Line tools',
    reverseLines: 'Reverse',
    deduplicateLines: 'Deduplicate',
    sortLines: 'Sort',
    commaToLines: 'Comma to lines',
    placeholder: 'Enter content',
  },
}

const resultText = {
  zh: {
    eyebrow: '结果工作台',
    title: '转换结果',
    ignoreEmptyLines: '忽略空行',
    convert: '转换',
    formatEyebrow: '输出格式',
    copy: '复制',
    empty: '转换结果会显示在这里。',
  },
  en: {
    eyebrow: 'Result Workbench',
    title: 'Conversion Results',
    ignoreEmptyLines: 'Ignore empty lines',
    convert: 'Convert',
    formatEyebrow: 'Output Format',
    copy: 'Copy',
    empty: 'Conversion results appear here.',
  },
}

function reverseLinesLocal(value: string) {
  return value.split('\n').reverse().join('\n')
}

export default App
