export default function QuizQuestion({ question, answer, onAnswer }) {
    const allHaveImg = question.options.length > 0 && question.options.every((o) => !!o.mediaOpsi)
    return (
        <div className={`question-card__options${allHaveImg ? ' question-card__options--grid' : ''}`}>
            {question.options.map((opt) => {
                const selected = answer === opt.optionId
                return (
                    <button
                        key={opt.optionId}
                        className={`option-btn ${selected ? 'option-btn--selected' : ''} ${opt.mediaOpsi ? 'option-btn--has-img' : ''}`}
                        onClick={() => onAnswer(question.questionId, opt.optionId)}
                    >
                        {opt.mediaOpsi && (
                            <img src={opt.mediaOpsi} alt={opt.teksOpsi} className="option-btn__img" />
                        )}
                        {!allHaveImg && <span className="option-btn__dot" />}
                        <span>{opt.teksOpsi}</span>
                    </button>
                )
            })}
        </div>
    )
}
