import { useEffect, useMemo, useState } from 'react'
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
  const [sourceMatches, setSourceMatches] = useState<SearchMatch[]>([])
  const [resultOutputs, setResultOutputs] = useState<ResultOutput[]>([])
  const [status, setStatus] = useState<StatusKey>('ready')
  const [toastMessage, setToastMessage] = useState('')
  const t = messages[language]

  const lineCount = useMemo(() => {
    if (!sourceText.length) {
      return 0
    }

    return sourceText.split('\n').length
  }, [sourceText])

  useEffect(() => {
    void refreshMatches(sourceText, replaceQuery)
  }, [sourceText, replaceQuery])

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

  async function runConvert(nextSourceText = sourceText) {
    const outputs = await convertAllFormats(nextSourceText, ignoreEmptyLines)
    setResultOutputs(outputs)
    setStatus('converted')
  }

  async function runReplace() {
    const result = await replaceText(sourceText, replaceQuery, replaceWith)
    setSourceText(result.output)
    await runConvert(result.output)
    setStatus(replaceQuery ? 'replaced' : 'noSearchTerm')
  }

  async function refreshMatches(text: string, query: string) {
    if (!query) {
      setSourceMatches([])
      return
    }

    const result = await searchMatches(text, query, false)
    setSourceMatches(result.matches)
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
            text={toolbarText[language]}
            onReplaceQueryChange={setReplaceQuery}
            onReplaceWithChange={setReplaceWith}
            onReplace={() => void runReplace()}
            onReverseLines={() => void handleReverseLines()}
            onDeduplicateLines={() => void handleDeduplicateLines()}
            onSortLines={() => void handleSortLines()}
            onCommaValuesToLines={() => void handleCommaValuesToLines()}
          />
          <InputEditor
            value={sourceText}
            searchQuery={replaceQuery}
            matches={sourceMatches}
            text={inputText[language]}
            onChange={setSourceText}
            onCopySource={() => void handleCopySource()}
            onClearSource={() => void handleClearSource()}
            onPasteSource={() => void handlePasteSource()}
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
    applyReplace: '应用替换到原始内容',
    lineToolsEyebrow: '行工具',
    lineToolsTitle: '行处理',
    reverseLines: '按行逆序',
    deduplicateLines: '按行去重',
    sortLines: '升序排序',
    commaToLines: '逗号转行',
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
    applyReplace: 'Apply replacement',
    lineToolsEyebrow: 'Line Tools',
    lineToolsTitle: 'Line Processing',
    reverseLines: 'Reverse lines',
    deduplicateLines: 'Deduplicate',
    sortLines: 'Sort ascending',
    commaToLines: 'Comma to lines',
  },
}

const inputText = {
  zh: {
    eyebrow: '输入',
    title: '原始内容',
    copy: '复制',
    paste: '粘贴',
    clear: '清除',
    placeholder: '请输入内容',
  },
  en: {
    eyebrow: 'Input',
    title: 'Source Content',
    copy: 'Copy',
    paste: 'Paste',
    clear: 'Clear',
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
