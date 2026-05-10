import type { ResultOutput } from '../services/tauriApi'

type ResultViewProps = {
  ignoreEmptyLines: boolean
  outputs: ResultOutput[]
  text: {
    title: string
    ignoreEmptyLines: string
    convert: string
    copy: string
    empty: string
  }
  formatLabels: Record<ResultOutput['format'], string>
  onIgnoreEmptyLinesChange: (value: boolean) => void
  onConvert: () => void
  onCopy: (output: string) => void
}

function ResultView({
  ignoreEmptyLines,
  outputs,
  text,
  formatLabels,
  onIgnoreEmptyLinesChange,
  onConvert,
  onCopy,
}: ResultViewProps) {
  return (
    <section className="result-panel workbench-panel">
      <div className="panel-header result-header">
        <div>
          <h2>{text.title}</h2>
        </div>
        <div className="result-actions">
          <label className="toggle">
            <input
              type="checkbox"
              checked={ignoreEmptyLines}
              onChange={(event) => onIgnoreEmptyLinesChange(event.target.checked)}
            />
            <span>{text.ignoreEmptyLines}</span>
          </label>
          <button className="primary-button" type="button" onClick={onConvert}>
            {text.convert}
          </button>
        </div>
      </div>

      <div className="result-cards">
        {outputs.map((item) => (
          <article key={item.format} className="result-card">
            <div className="result-card-header">
              <div>
                <h3>{formatLabels[item.format]}</h3>
              </div>
              <button className="secondary-button" type="button" onClick={() => onCopy(item.output)}>
                {text.copy}
              </button>
            </div>
            <div className="result-surface">
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
