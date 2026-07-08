import { useState } from 'react'
import type { ResultOutput } from '../services/tauriApi'

type ResultViewProps = {
  ignoreEmptyLines: boolean
  wrapWithParentheses: boolean
  outputs: ResultOutput[]
  text: {
    title: string
    ignoreEmptyLines: string
    wrapWithParentheses: string
    copy: string
    collapse: string
    empty: string
    expand: string
  }
  formatLabels: Record<ResultOutput['format'], string>
  onIgnoreEmptyLinesChange: (value: boolean) => void
  onWrapWithParenthesesChange: (value: boolean) => void
  onCopy: (output: string) => void
}

function ResultView({
  ignoreEmptyLines,
  wrapWithParentheses,
  outputs,
  text,
  formatLabels,
  onIgnoreEmptyLinesChange,
  onWrapWithParenthesesChange,
  onCopy,
}: ResultViewProps) {
  const [expandedFormat, setExpandedFormat] = useState<ResultOutput['format'] | null>(null)

  function runButtonAction(event: React.PointerEvent<HTMLButtonElement>, action: () => void) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    event.preventDefault()
    action()
  }

  function runKeyboardAction(event: React.MouseEvent<HTMLButtonElement>, action: () => void) {
    if (event.detail === 0) {
      action()
    }
  }

  function toggleExpandedFormat(format: ResultOutput['format']) {
    setExpandedFormat((current) => (current === format ? null : format))
  }

  return (
    <section className="result-panel workbench-panel">
      <div className="panel-header result-header">
        <div className="result-title-row">
          <div>
            <h2>{text.title}</h2>
          </div>
        </div>
        <div className="result-actions" aria-label={text.title}>
          <label className="toggle">
            <input
              type="checkbox"
              checked={ignoreEmptyLines}
              onChange={(event) => onIgnoreEmptyLinesChange(event.target.checked)}
            />
            <span>{text.ignoreEmptyLines}</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={wrapWithParentheses}
              onChange={(event) => onWrapWithParenthesesChange(event.target.checked)}
            />
            <span>{text.wrapWithParentheses}</span>
          </label>
        </div>
      </div>

      <div className="result-cards">
        {outputs.map((item) => (
          <article key={item.format} className="result-card">
            <div className="result-card-header">
              <div>
                <h3>{formatLabels[item.format]}</h3>
              </div>
              <div className="result-card-actions">
                {item.output ? (
                  <button
                    className="secondary-button"
                    type="button"
                    aria-expanded={expandedFormat === item.format}
                    onPointerDown={(event) => runButtonAction(event, () => toggleExpandedFormat(item.format))}
                    onClick={(event) => runKeyboardAction(event, () => toggleExpandedFormat(item.format))}
                  >
                    {expandedFormat === item.format ? text.collapse : text.expand}
                  </button>
                ) : null}
                <button
                  className="secondary-button"
                  type="button"
                  onPointerDown={(event) => runButtonAction(event, () => onCopy(item.output))}
                  onClick={(event) => runKeyboardAction(event, () => onCopy(item.output))}
                >
                  {text.copy}
                </button>
              </div>
            </div>
            <div className={expandedFormat === item.format ? 'result-surface expanded' : 'result-surface'}>
              {item.output ? (
                <p className="result-text" title={item.output}>
                  {item.output}
                </p>
              ) : (
                <p className="empty-state">{text.empty}</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ResultView
