import { useState, useEffect, useRef, useMemo } from 'react'
import OptionMedia, { getOptionMediaType } from './OptionMedia'
import { IconHand, IconPoint } from '../common/AppIcons'

function normalizeMatchAnswer(answer) {
    const raw = answer || {}
    const out = {}
    Object.entries(raw).forEach(([k, v]) => {
        const pId = Number(k)
        if (Number.isNaN(pId)) return
        const jVal = Array.isArray(v) ? v[0] : v
        const jId = Number(jVal)
        if (!Number.isNaN(jId)) out[pId] = jId
    })
    return out
}

export default function MatchQuestion({ question, answer, onAnswer, readOnly = false }) {
    const pertanyaan = question.options.filter((o) => o.tipeItem === 'PERTANYAAN')
    const jawaban = question.options.filter((o) => o.tipeItem === 'JAWABAN')
    const matchAnswer = useMemo(() => normalizeMatchAnswer(answer), [answer])

    const containerRef = useRef(null)
    const leftRefs = useRef({})
    const rightRefs = useRef({})

    const [dragging, setDragging] = useState(null)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [, forceRender] = useState(0)
    const bumpLayout = () => forceRender((n) => n + 1)

    useEffect(() => {
        forceRender((n) => n + 1)
        const onResize = () => forceRender((n) => n + 1)
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [matchAnswer, pertanyaan.length, jawaban.length])

    const getNode = (el, side) => {
        if (!el || !containerRef.current) return null
        const cRect = containerRef.current.getBoundingClientRect()
        const eRect = el.getBoundingClientRect()
        return {
            x: (side === 'right' ? eRect.right : eRect.left) - cRect.left,
            y: (eRect.top + eRect.height / 2) - cRect.top,
        }
    }

    const clientToRel = (cx, cy) => {
        if (!containerRef.current) return { x: 0, y: 0 }
        const r = containerRef.current.getBoundingClientRect()
        return { x: cx - r.left, y: cy - r.top }
    }

    const doMatch = (pId, jId) => {
        const newMatch = { ...matchAnswer }
        Object.keys(newMatch).forEach((k) => { if (newMatch[k] === jId) delete newMatch[k] })
        newMatch[pId] = jId
        onAnswer(question.questionId, newMatch)
        setDragging(null)
    }

    const removeMatch = (pId) => {
        const newMatch = { ...matchAnswer }
        delete newMatch[pId]
        onAnswer(question.questionId, Object.keys(newMatch).length > 0 ? newMatch : undefined)
    }

    const onMouseDown = (e, pId) => {
        e.preventDefault()
        setMousePos(clientToRel(e.clientX, e.clientY))
        setDragging(pId)
    }
    const onMouseMove = (e) => {
        if (dragging == null) return
        setMousePos(clientToRel(e.clientX, e.clientY))
    }
    const onMouseUpAnswer = (jId) => { if (dragging != null) doMatch(dragging, jId) }
    const cancelDrag = () => setDragging(null)

    const onTouchStart = (e, pId) => {
        const t = e.touches[0]
        setMousePos(clientToRel(t.clientX, t.clientY))
        setDragging(pId)
    }
    const onTouchMove = (e) => {
        if (dragging == null) return
        e.preventDefault()
        const t = e.touches[0]
        setMousePos(clientToRel(t.clientX, t.clientY))
    }
    const onTouchEndContainer = (e) => {
        if (dragging == null) return
        const t = e.changedTouches[0]
        const el = document.elementFromPoint(t.clientX, t.clientY)
        const target = el?.closest('[data-jid]')
        if (target) doMatch(dragging, parseInt(target.dataset.jid, 10))
        else setDragging(null)
    }

    const curve = (a, b) => {
        const mx = (a.x + b.x) / 2
        return `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`
    }

    const LINE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']
    const colorOf = (pId) => LINE_COLORS[pertanyaan.findIndex((p) => p.optionId === pId) % LINE_COLORS.length]

    const lines = Object.entries(matchAnswer).map(([pIdStr, jId]) => {
        const pId = Number(pIdStr)
        const from = getNode(leftRefs.current[pId], 'right')
        const to = getNode(rightRefs.current[jId], 'left')
        return from && to ? { pId, jId, from, to, color: colorOf(pId) } : null
    }).filter(Boolean)

    // Pastikan garis tergambar setelah layout selesai (riwayat / media gambar)
    useEffect(() => {
        if (!readOnly) return undefined
        const t1 = requestAnimationFrame(() => forceRender((n) => n + 1))
        const t2 = setTimeout(() => forceRender((n) => n + 1), 120)
        return () => {
            cancelAnimationFrame(t1)
            clearTimeout(t2)
        }
    }, [readOnly, matchAnswer, pertanyaan.length, jawaban.length])

    const dragFrom = dragging != null ? getNode(leftRefs.current[dragging], 'right') : null

    if (pertanyaan.length === 0 || jawaban.length === 0) {
        return <p className="quiz-empty-type">Data soal tidak lengkap.</p>
    }

    return (
        <div
            className={`match-line-wrap${!readOnly && dragging != null ? ' match-line-wrap--active' : ''}${readOnly ? ' match-line-wrap--readonly' : ''}`}
            ref={containerRef}
            onMouseMove={readOnly ? undefined : onMouseMove}
            onMouseUp={readOnly ? undefined : cancelDrag}
            onMouseLeave={readOnly ? undefined : cancelDrag}
            onTouchMove={readOnly ? undefined : onTouchMove}
            onTouchEnd={readOnly ? undefined : onTouchEndContainer}
        >
            <p className="match-line-hint">
                {readOnly
                    ? '↳ Pasangan jawabanmu'
                    : dragging != null
                        ? <><IconPoint size={16} /> Lepaskan di jawaban yang cocok</>
                        : <><IconHand size={16} /> Tahan &amp; seret dari pertanyaan ke jawaban</>}
            </p>

            <svg className="match-line-svg" aria-hidden="true">
                {lines.map(({ pId, from, to, color }) => (
                    <g key={pId}>
                        <path d={curve(from, to)} stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.6" />
                        <path d={curve(from, to)} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
                        <circle cx={from.x} cy={from.y} r="5" fill={color} />
                        <circle cx={to.x} cy={to.y} r="5" fill={color} />
                    </g>
                ))}
                {dragFrom && dragging != null && (
                    <path
                        d={curve(dragFrom, mousePos)}
                        stroke={colorOf(dragging)}
                        strokeWidth="3"
                        strokeDasharray="8 5"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.8"
                    />
                )}
            </svg>

            <div className="match-line-cols">
                <div className="match-line-col">
                    <p className="match-line-col-label">💬 Pertanyaan</p>
                    {pertanyaan.map((p, idx) => {
                        const isMatched = matchAnswer[p.optionId] !== undefined
                        const isDragging = dragging === p.optionId
                        const color = colorOf(p.optionId)
                        const mediaType = p.mediaOpsi ? getOptionMediaType(p.mediaOpsi) : null
                        return (
                            <div
                                key={p.optionId}
                                ref={(el) => { leftRefs.current[p.optionId] = el }}
                                className={[
                                    'match-line-item',
                                    'match-line-item--left',
                                    isMatched ? 'match-line-item--matched' : '',
                                    !readOnly && isDragging ? 'match-line-item--active' : '',
                                    mediaType === 'audio' || mediaType === 'video' ? 'match-line-item--has-audio' : '',
                                    mediaType === 'image' ? 'match-line-item--has-image' : '',
                                ].filter(Boolean).join(' ')}
                                style={(isMatched || (!readOnly && isDragging)) ? { '--mc': color } : undefined}
                                onMouseDown={readOnly ? undefined : (e) => onMouseDown(e, p.optionId)}
                                onTouchStart={readOnly ? undefined : (e) => onTouchStart(e, p.optionId)}
                            >
                                <span className="match-line-num">{idx + 1}</span>
                                <div className="match-line-body">
                                    {p.mediaOpsi && (
                                        <OptionMedia
                                            url={p.mediaOpsi}
                                            alt={p.teksOpsi || 'Media pertanyaan'}
                                            onLoad={readOnly ? bumpLayout : undefined}
                                        />
                                    )}
                                    <span className="match-line-text">{p.teksOpsi}</span>
                                </div>
                                {!readOnly && isMatched && (
                                    <button
                                        className="match-line-del"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        onClick={() => removeMatch(p.optionId)}
                                        aria-label="Lepas pasangan"
                                    >✕</button>
                                )}
                                <span
                                    className="match-line-node match-line-node--r"
                                    style={(isMatched || (!readOnly && isDragging)) ? { background: color, borderColor: color } : undefined}
                                />
                            </div>
                        )
                    })}
                </div>

                <div className="match-line-col">
                    <p className="match-line-col-label">✅ Jawaban</p>
                    {jawaban.map((j) => {
                        const matchedPId = pertanyaan.find((p) => matchAnswer[p.optionId] === j.optionId)?.optionId
                        const isMatched = matchedPId !== undefined
                        const isTarget = !readOnly && dragging != null && !isMatched
                        const color = isMatched ? colorOf(matchedPId) : undefined
                        const mediaType = j.mediaOpsi ? getOptionMediaType(j.mediaOpsi) : null
                        return (
                            <div
                                key={j.optionId}
                                ref={(el) => { rightRefs.current[j.optionId] = el }}
                                className={[
                                    'match-line-item',
                                    'match-line-item--right',
                                    isMatched ? 'match-line-item--matched' : '',
                                    isTarget ? 'match-line-item--target' : '',
                                    mediaType === 'audio' || mediaType === 'video' ? 'match-line-item--has-audio' : '',
                                    mediaType === 'image' ? 'match-line-item--has-image' : '',
                                ].filter(Boolean).join(' ')}
                                style={isMatched ? { '--mc': color } : undefined}
                                data-jid={j.optionId}
                                onMouseUp={readOnly ? undefined : () => onMouseUpAnswer(j.optionId)}
                            >
                                <span
                                    className="match-line-node match-line-node--l"
                                    style={isMatched ? { background: color, borderColor: color } : undefined}
                                />
                                <div className="match-line-body">
                                    {j.mediaOpsi && (
                                        <OptionMedia
                                            url={j.mediaOpsi}
                                            alt={j.teksOpsi || 'Media jawaban'}
                                            onLoad={readOnly ? bumpLayout : undefined}
                                        />
                                    )}
                                    <span className="match-line-text">{j.teksOpsi}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
