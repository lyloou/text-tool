import type { RefObject } from 'react'
import type { FindOptions } from '../services/tauriApi'

type ToolbarProps = {
  replaceQuery: string
  replaceWith: string
  matchCount: number
  findOptions: FindOptions
  replaceVisible: boolean
  text: {
    eyebrow: string
    title: string
    matchCount: (count: number) => string
    replaceEyebrow: string
    replaceTitle: string
    find: string
    replaceWith: string
    matchHint: (query: string, count: number) => string
    caseSensitive: string
    wholeWord: string
    useRegex: string
    showReplace: string
    replaceOne: string
    replaceAll: string
  }
  findInputRef: RefObject<HTMLInputElement | null>
  replaceInputRef: RefObject<HTMLInputElement | null>
  onReplaceQueryChange: (value: string) => void
  onReplaceWithChange: (value: string) => void
  onFindOptionChange: (option: keyof FindOptions, value: boolean) => void
  onReplaceVisibleChange: (value: boolean) => void
  onReplace: () => void
  onReplaceAll: () => void
  onEscape: () => void
}

function Toolbar({
  replaceQuery,
  replaceWith,
  matchCount,
  findOptions,
  replaceVisible,
  text,
  findInputRef,
  replaceInputRef,
  onReplaceQueryChange,
  onReplaceWithChange,
  onFindOptionChange,
  onReplaceVisibleChange,
  onReplace,
  onReplaceAll,
  onEscape,
}: ToolbarProps) {
  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onEscape()
    }
  }

  return (
    <section className="toolbar-panel source-toolbar">
      <div className="toolbar-row">
        <div>
          <p className="eyebrow">{text.eyebrow}</p>
          <h2>{text.title}</h2>
        </div>
        <p className="match-count">{text.matchCount(matchCount)}</p>
      </div>

      <div className="tool-block replace-tool">
        <div className="mini-tool-header">
          <p className="eyebrow">{text.replaceEyebrow}</p>
          <h3>{text.replaceTitle}</h3>
        </div>
        <div className={replaceVisible ? 'field-row two-columns' : 'field-row'}>
          <label>
            <span>{text.find}</span>
            <input
              ref={findInputRef}
              value={replaceQuery}
              onChange={(event) => onReplaceQueryChange(event.target.value)}
              onKeyDown={handleInputKeyDown}
            />
            <span className="match-hint">{text.matchHint(replaceQuery, matchCount)}</span>
          </label>
          {replaceVisible ? (
            <label>
              <span>{text.replaceWith}</span>
              <input
                ref={replaceInputRef}
                value={replaceWith}
                onChange={(event) => onReplaceWithChange(event.target.value)}
                onKeyDown={handleInputKeyDown}
              />
            </label>
          ) : null}
        </div>
        <div className="find-option-row">
          <button
            className={findOptions.caseSensitive ? 'option-chip active' : 'option-chip'}
            type="button"
            onClick={() => onFindOptionChange('caseSensitive', !findOptions.caseSensitive)}
          >
            Aa
            <span>{text.caseSensitive}</span>
          </button>
          <button
            className={findOptions.wholeWord ? 'option-chip active' : 'option-chip'}
            type="button"
            onClick={() => onFindOptionChange('wholeWord', !findOptions.wholeWord)}
          >
            Ab
            <span>{text.wholeWord}</span>
          </button>
          <button
            className={findOptions.useRegex ? 'option-chip active' : 'option-chip'}
            type="button"
            onClick={() => onFindOptionChange('useRegex', !findOptions.useRegex)}
          >
            .*
            <span>{text.useRegex}</span>
          </button>
        </div>
        <div className="source-action-row">
          {!replaceVisible ? (
            <button className="secondary-button" type="button" onClick={() => onReplaceVisibleChange(true)}>
              {text.showReplace}
            </button>
          ) : null}
          <button className="primary-button" type="button" onClick={onReplace}>
            {text.replaceOne}
          </button>
          <button className="secondary-button" type="button" onClick={onReplaceAll}>
            {text.replaceAll}
          </button>
        </div>
      </div>
    </section>
  )
}

export default Toolbar
