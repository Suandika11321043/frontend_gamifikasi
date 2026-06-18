import MultipleChoiceOptions from './MultipleChoiceOptions'

export default function QuizQuestion({ question, answer, onAnswer }) {
    return (
        <MultipleChoiceOptions
            options={question.options}
            selectedId={answer ?? null}
            mode="quiz"
            onSelect={(optionId) => onAnswer(question.questionId, optionId)}
        />
    )
}
