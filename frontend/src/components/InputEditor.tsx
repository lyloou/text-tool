import { useRef, type RefObject } from 'react'
import type { FindOptions, SearchMatch } from '../services/tauriApi'

type InputEditorProps = {
  editorRef: RefObject<HTMLTextAreaElement | null>
  findInputRef: RefObject<HTMLInputElement | null>
  replaceInputRef: RefObject<HTMLInputElement | null>
  value: string
  searchQuery: string
  replaceWith: string
  matches: SearchMatch[]
  findOptions: FindOptions
  findVisible: boolean
  replaceVisible: boolean
  text: {
    copy: string
    copyHighlights: string
    paste: string
    clear: string
    lineTools: string
    reverseLines: string
    deduplicateLines: string
    sortLines: string
    commaToLines: string
    find: string
    replaceWith: string
    matchCount: (count: number) => string
    matchHint: (query: string, count: number) => string
    caseSensitive: string
    wholeWord: string
    useRegex: string
    showReplace: string
    replaceOne: string
    replaceAll: string
    placeholder: string
  }
  onChange: (value: string) => void
  onSearchQueryChange: (value: string) => void
  onReplaceWithChange: (value: string) => void
  onFindOptionChange: (option: keyof FindOptions, value: boolean) => void
  onReplaceVisibleChange: (value: boolean) => void
  onReplace: () => void
  onReplaceAll: () => void
  onFindEscape: () => void
  onCopySource: () => void
  onCopyHighlights: () => void
  onClearSource: () => void
  onPasteSource: () => void
  showCopyHighlights: boolean
  canCopyHighlights: boolean
  onReverseLines: () => void
  onDeduplicateLines: () => void
  onSortLines: () => void
  onCommaValuesToLines: () => void
}

function InputEditor({
  editorRef,
  findInputRef,
  replaceInputRef,
  value,
  searchQuery,
  replaceWith,
  matches,
  findOptions,
  findVisible,
  replaceVisible,
  text,
  onChange,
  onSearchQueryChange,
  onReplaceWithChange,
  onFindOptionChange,
  onReplaceVisibleChange,
  onReplace,
  onReplaceAll,
  onFindEscape,
  onCopySource,
  onCopyHighlights,
  onClearSource,
  onPasteSource,
  showCopyHighlights,
  canCopyHighlights,
  onReverseLines,
  onDeduplicateLines,
  onSortLines,
  onCommaValuesToLines,
}: InputEditorProps) {
  const highlightRef = useRef<HTMLDivElement>(null)

  function handleScroll(event: React.UIEvent<HTMLTextAreaElement>) {
    if (!highlightRef.current) {
      return
    }

    highlightRef.current.scrollTop = event.currentTarget.scrollTop
    highlightRef.current.scrollLeft = event.currentTarget.scrollLeft
  }

  function handleFindInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onFindEscape()
    }
  }

  return (
    <section className="panel editor-panel">
      <div className="editor-toolbar" aria-label={text.lineTools}>
        <div className="line-action-bar">
          <button className="line-action-button" type="button" onClick={onReverseLines}>
            {text.reverseLines}
          </button>
          <button className="line-action-button" type="button" onClick={onDeduplicateLines}>
            {text.deduplicateLines}
          </button>
          <button className="line-action-button" type="button" onClick={onSortLines}>
            {text.sortLines}
          </button>
          <button className="line-action-button" type="button" onClick={onCommaValuesToLines}>
            {text.commaToLines}
          </button>
        </div>
        <div className="input-actions">
          {showCopyHighlights ? (
            <button
              className="secondary-button"
              type="button"
              onClick={onCopyHighlights}
              disabled={!canCopyHighlights}
            >
              {text.copyHighlights}
            </button>
          ) : null}
          <button className="secondary-button" type="button" onClick={onCopySource}>
            {text.copy}
          </button>
          <button className="secondary-button" type="button" onClick={onPasteSource}>
            {text.paste}
          </button>
          <button className="secondary-button" type="button" onClick={onClearSource}>
            {text.clear}
          </button>
        </div>
      </div>
      <div className="editor-stack">
        {findVisible ? (
          <div className={replaceVisible ? 'find-popover replace-open' : 'find-popover'} role="search">
            <div className="find-popover-row">
              <label>
                <span>{text.find}</span>
                <input
                  ref={findInputRef}
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                  onKeyDown={handleFindInputKeyDown}
                />
              </label>
              <span className="find-match-pill">{text.matchCount(matches.length)}</span>
            </div>

            {replaceVisible ? (
              <div className="find-popover-row">
                <label>
                  <span>{text.replaceWith}</span>
                  <input
                    ref={replaceInputRef}
                    value={replaceWith}
                    onChange={(event) => onReplaceWithChange(event.target.value)}
                    onKeyDown={handleFindInputKeyDown}
                  />
                </label>
              </div>
            ) : null}

            <div className="find-popover-actions">
              <button
                className={findOptions.caseSensitive ? 'option-chip active' : 'option-chip'}
                type="button"
                title={text.caseSensitive}
                onClick={() => onFindOptionChange('caseSensitive', !findOptions.caseSensitive)}
              >
                Aa
              </button>
              <button
                className={findOptions.wholeWord ? 'option-chip active' : 'option-chip'}
                type="button"
                title={text.wholeWord}
                onClick={() => onFindOptionChange('wholeWord', !findOptions.wholeWord)}
              >
                Ab
              </button>
              <button
                className={findOptions.useRegex ? 'option-chip active' : 'option-chip'}
                type="button"
                title={text.useRegex}
                onClick={() => onFindOptionChange('useRegex', !findOptions.useRegex)}
              >
                .*
              </button>
              {!replaceVisible ? (
                <button className="secondary-button compact-button" type="button" onClick={() => onReplaceVisibleChange(true)}>
                  {text.showReplace}
                </button>
              ) : null}
              <button className="primary-button compact-button" type="button" onClick={onReplace}>
                {text.replaceOne}
              </button>
              <button className="secondary-button compact-button" type="button" onClick={onReplaceAll}>
                {text.replaceAll}
              </button>
            </div>

            <p className="find-popover-hint">{text.matchHint(searchQuery, matches.length)}</p>
          </div>
        ) : null}
        <div ref={highlightRef} className="editor-highlight-layer" aria-hidden="true">
          <pre className="editor-highlight-text">{renderHighlightedText(value, searchQuery, matches)}</pre>
        </div>
        <textarea
          ref={editorRef}
          className="editor editor-overlay"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onScroll={handleScroll}
          placeholder={text.placeholder}
          spellCheck={false}
        />
      </div>
    </section>
  )
}

function renderHighlightedText(value: string, searchQuery: string, matches: SearchMatch[]) {
  if (!value) {
    return ' '
  }

  if (!searchQuery || !matches.length) {
    return <span>{value}</span>
  }

  const parts: Array<{ text: string; highlighted: boolean }> = []
  let cursor = 0

  matches.forEach((match) => {
    if (cursor < match.start) {
      parts.push({ text: value.slice(cursor, match.start), highlighted: false })
    }

    parts.push({ text: value.slice(match.start, match.end), highlighted: true })
    cursor = match.end
  })

  if (cursor < value.length) {
    parts.push({ text: value.slice(cursor), highlighted: false })
  }

  return parts.map((part, index) =>
    part.highlighted ? (
      <mark key={`${part.text}-${index}`}>{part.text}</mark>
    ) : (
      <span key={`${part.text}-${index}`}>{part.text}</span>
    ),
  )
}

export default InputEditor
