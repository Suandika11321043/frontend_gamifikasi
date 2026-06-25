/** Metadata keping dari jawaban / respons puzzle. */
export function puzzlePiecesMeta(item) {
    return {
        correctPieces: item?.correctPieces ?? item?.correctPiecesCount ?? null,
        totalPieces: item?.totalPieces ?? item?.totalPiecesCount ?? null,
    }
}

/**
 * Label hasil puzzle — tidak memakai "Salah" jika masih ada keping benar (skor proporsional).
 */
export function formatPuzzleResultBadge(item) {
    const { correctPieces, totalPieces } = puzzlePiecesMeta(item)
    const score = item?.earnedScore ?? 0
    const scoreText = score > 0 ? ` · +${score} poin` : ''

    if (item?.correct === true || (totalPieces > 0 && correctPieces === totalPieces)) {
        return { text: `✓ Semua keping benar${scoreText}`, variant: 'correct' }
    }

    if (totalPieces > 0 && correctPieces != null && correctPieces > 0) {
        return {
            text: `🧩 ${correctPieces} dari ${totalPieces} keping benar${scoreText}`,
            variant: 'partial',
        }
    }

    return { text: `✗ Belum sempurna${scoreText}`, variant: 'wrong' }
}

export function isPuzzlePartial(item) {
    const { correctPieces, totalPieces } = puzzlePiecesMeta(item)
    return totalPieces > 0 && correctPieces != null && correctPieces > 0 && correctPieces < totalPieces
}
