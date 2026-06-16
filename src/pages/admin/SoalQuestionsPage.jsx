import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, X, Eye, Pencil, Trash2, Plus, Clock, Calendar, Copy, Lock, Unlock } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import Modal from '../../components/common/Modal'
import '../../styles/common.css'
import '../../pages/admin/DashboardPage.css'
import './ManajemenTemaPage.css'
import './ManajemenSoalPage.css'
import { apiFetch } from '../../utils/apiFetch'

const MONTHS = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const JSDAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu']

function formatDisplayDate(dateStr) {
    if (!dateStr || !dateStr.includes('-')) return dateStr
    const [y, m, d] = dateStr.split('-').map(Number)
    const jsDay = new Date(y, m - 1, d).getDay()
    return `${JSDAY_NAMES[jsDay]}, ${d} ${MONTHS[m]} ${y}`
}

const QUESTION_TYPES = [
    { value: 'QUIZ', label: 'Quiz', color: '#1d4ed8', bg: '#eff6ff' },
    { value: 'MATCH', label: 'Pasangkan', color: '#166534', bg: '#f0fdf4' },
    { value: 'SORTING', label: 'Urutkan', color: '#92400e', bg: '#fffbeb' },
    { value: 'DRAG_AND_DROP', label: 'Drag & Drop', color: '#6b21a8', bg: '#faf5ff' },
    { value: 'PUZZLE', label: 'Puzzle', color: '#a8a121', bg: '#fafde7' },
]

const TIPE_ITEM_OPTIONS = {
    MATCH: [
        { value: 'PERTANYAAN', label: 'Pertanyaan (kiri)' },
        { value: 'JAWABAN', label: 'Jawaban (kanan)' },
    ],
    DRAG_AND_DROP: [
        { value: 'PERTANYAAN', label: 'Drop Zone (wadah)' },
        { value: 'JAWABAN', label: 'Item Drag (item)' },
    ],
}

const NEEDS_RELATION = ['MATCH', 'DRAG_AND_DROP']

const emptyQForm = { questionType: 'QUIZ', contentInstruction: '', timeLimitMinutes: '', scorePoint: '' }
const emptyOptForm = { teksOpsi: '', kunciJawaban: false, urutanBenar: '', tipeItem: '' }
const emptyRelForm = { opsiPertanyaanId: '', opsiJawabanId: '' }

function getMediaType(url) {
    if (!url) return null
    const path = url.toLowerCase().split('?')[0]
    if (/\.(mp3|wav|ogg|aac|m4a|flac)$/.test(path)) return 'audio'
    return 'image'
}

function MediaCell({ url }) {
    if (!url) return <span className="no-media">&mdash;</span>
    const type = getMediaType(url)
    if (type === 'audio') return <audio controls className="opsi-audio-preview"><source src={url} /></audio>
    return <a href={url} target="_blank" rel="noreferrer" className="opsi-img-link"><img src={url} alt="media" className="opsi-img-thumb" /></a>
}

function TypeBadge({ type }) {
    const config = QUESTION_TYPES.find((t) => t.value === type) || { label: type, color: '#374151', bg: '#f3f4f6' }
    return <span className="type-badge" style={{ color: config.color, background: config.bg }}>{config.label}</span>
}

function SoalQuestionsPage() {
    const { topicId, learningDate } = useParams()
    const navigate = useNavigate()

    // Breadcrumb data
    const [topic, setTopic] = useState(null)

    // Question list
    const [questionList, setQuestionList] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState('')

    // Question form
    const [form, setForm] = useState(emptyQForm)
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [audioFile, setAudioFile] = useState(null)
    const [existingAudio, setExistingAudio] = useState(null)
    const [editId, setEditId] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [deleteId, setDeleteId] = useState(null)

    // Reschedule date
    const [showReschedule, setShowReschedule] = useState(false)
    const [newDateVal, setNewDateVal] = useState('')
    const [rescheduleErr, setRescheduleErr] = useState('')
    const [rescheduling, setRescheduling] = useState(false)

    // Duplicate to another date
    const [showDuplicate, setShowDuplicate] = useState(false)
    const [dupDateVal, setDupDateVal] = useState('')
    const [dupErr, setDupErr] = useState('')
    const [duplicating, setDuplicating] = useState(false)
    const [activeDates, setActiveDates] = useState(new Set())

    // Delete all questions for this day
    const [showDeleteDay, setShowDeleteDay] = useState(false)
    const [deletingDay, setDeletingDay] = useState(false)
    const [deleteDayErr, setDeleteDayErr] = useState('')

    // Availability / lock
    const [isAvailable, setIsAvailable] = useState(false)
    const [togglingAvail, setTogglingAvail] = useState(false)
    const [showOpsiModal, setShowOpsiModal] = useState(false)
    const [activeQuestion, setActiveQuestion] = useState(null)
    const [optionsList, setOptionsList] = useState([])
    const [loadingOptions, setLoadingOptions] = useState(false)
    const [optForm, setOptForm] = useState(emptyOptForm)
    const [editingOptId, setEditingOptId] = useState(null)
    const [mediaOpsiFile, setMediaOpsiFile] = useState(null)
    const [mediaOpsiPreview, setMediaOpsiPreview] = useState(null)
    const [optionError, setOptionError] = useState('')
    const [savingOpt, setSavingOpt] = useState(false)

    // Relations
    const [relationsList, setRelationsList] = useState([])
    const [loadingRel, setLoadingRel] = useState(false)
    const [relForm, setRelForm] = useState(emptyRelForm)
    const [savingRel, setSavingRel] = useState(false)
    const [relError, setRelError] = useState('')

    // Puzzle
    const [puzzleData, setPuzzleData] = useState(null)
    const [puzzleForm, setPuzzleForm] = useState({ gridRows: '3', gridCols: '3' })
    const [puzzleImageFile, setPuzzleImageFile] = useState(null)
    const [savingPuzzle, setSavingPuzzle] = useState(false)
    const [puzzleError, setPuzzleError] = useState('')

    // Pieces
    const [piecesList, setPiecesList] = useState([])
    const [loadingPieces, setLoadingPieces] = useState(false)
    const emptyPieceForm = { pieceIndex: '', correctPosition: '' }
    const [pieceForm, setPieceForm] = useState(emptyPieceForm)
    const [editingPieceId, setEditingPieceId] = useState(null)
    const [pieceImageFile, setPieceImageFile] = useState(null)
    const [savingPiece, setSavingPiece] = useState(false)
    const [pieceError, setPieceError] = useState('')

    useEffect(() => {
        apiFetch(`/topics/${topicId}`).then(setTopic).catch(() => setTopic(null))
    }, [topicId])

    useEffect(() => {
        apiFetch(`/questions/topic/${topicId}`)
            .then((data) => {
                const list = Array.isArray(data) ? data : (data?.data ?? [])
                setActiveDates(new Set(list.map((q) => q.learningDate).filter(Boolean)))
            })
            .catch(() => { })
    }, [topicId])
    const fetchQuestions = useCallback(async () => {
        setLoading(true)
        setFetchError('')
        try {
            const data = await apiFetch(`/questions/topic/${topicId}/date/${learningDate}`)
            const list = Array.isArray(data) ? data : (data?.data ?? [])
            setQuestionList(list)
            // Derive isAvailable directly from each question's isAvailable field
            setIsAvailable(list.length > 0 && list.every((q) => q.isAvailable === true))
        } catch (err) {
            setFetchError(err.message)
        } finally {
            setLoading(false)
        }
    }, [topicId, learningDate])

    useEffect(() => { fetchQuestions() }, [fetchQuestions])

    const fetchOptions = useCallback(async (questionId) => {
        setLoadingOptions(true)
        setOptionError('')
        try {
            const data = await apiFetch(`/question-options/question/${questionId}`)
            setOptionsList(Array.isArray(data) ? data : [])
        } catch (err) {
            setOptionError(err.message)
        } finally {
            setLoadingOptions(false)
        }
    }, [])

    const fetchRelations = useCallback(async (questionId) => {
        setLoadingRel(true)
        try {
            const data = await apiFetch(`/matching-relations/question/${questionId}`)
            setRelationsList(Array.isArray(data) ? data : [])
        } catch {
            setRelationsList([])
        } finally {
            setLoadingRel(false)
        }
    }, [])

    const fetchPieces = useCallback(async (puzzleId) => {
        setLoadingPieces(true)
        try {
            const data = await apiFetch(`/jigsaw/puzzles/${puzzleId}/pieces`)
            setPiecesList(Array.isArray(data) ? data : [])
        } catch {
            setPiecesList([])
        } finally {
            setLoadingPieces(false)
        }
    }, [])

    const fetchPuzzle = useCallback(async (questionId) => {
        setPuzzleError('')
        try {
            const data = await apiFetch(`/jigsaw/questions/${questionId}/puzzle`)
            if (data) {
                setPuzzleData(data)
                setPuzzleForm({ gridRows: String(data.gridRows ?? 3), gridCols: String(data.gridCols ?? 3) })
                if (data.id) fetchPieces(data.id)
            }
        } catch {
            setPuzzleData(null)
        }
    }, [fetchPieces])

    const filtered = questionList.filter((q) => {
        const matchSearch = (q.contentInstruction ?? '').toLowerCase().includes(search.toLowerCase())
        return matchSearch && (filterType === '' || q.questionType === filterType)
    })

    const openAdd = () => {
        setForm(emptyQForm); setImageFile(null); setImagePreview(null)
        setAudioFile(null); setExistingAudio(null); setEditId(null); setError(''); setShowModal(true)
    }

    const openEdit = (q) => {
        setForm({
            questionType: q.questionType ?? 'QUIZ',
            contentInstruction: q.contentInstruction ?? '',
            timeLimitMinutes: q.timeLimitMinutes ? String(q.timeLimitMinutes) : '',
            scorePoint: q.scorePoint ? String(q.scorePoint) : '',
        })
        setImageFile(null); setImagePreview(q.contentImage ?? null)
        setAudioFile(null); setExistingAudio(q.contentAudio ?? null)
        setEditId(q.id); setError(''); setShowModal(true)
    }

    const handleQChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

    const handleSaveQuestion = async () => {
        if (!form.contentInstruction.trim()) { setError('Instruksi soal wajib diisi.'); return }
        setSaving(true); setError('')
        try {
            const fd = new FormData()
            fd.append('questionType', form.questionType)
            fd.append('contentInstruction', form.contentInstruction)
            if (form.timeLimitMinutes && Number(form.timeLimitMinutes) > 0) fd.append('timeLimitMinutes', form.timeLimitMinutes)
            if (form.scorePoint && Number(form.scorePoint) > 0) fd.append('scorePoint', form.scorePoint)
            if (imageFile) fd.append('contentImage', imageFile)
            if (audioFile) fd.append('contentAudio', audioFile)

            if (editId !== null) {
                await apiFetch(`/questions/${editId}`, { method: 'PUT', body: fd })
            } else {
                // POST /api/questions with topicId + learningDate (yyyy-MM-dd)
                fd.append('topicId', topicId)
                fd.append('learningDate', learningDate)
                await apiFetch('/questions', { method: 'POST', body: fd })
            }
            setShowModal(false); fetchQuestions()
        } catch (err) { setError(err.message) }
        finally { setSaving(false) }
    }

    const handleDeleteQuestion = async () => {
        try {
            await apiFetch(`/questions/${deleteId}`, { method: 'DELETE' })
            setDeleteId(null); fetchQuestions()
        } catch (err) { setError(err.message); setDeleteId(null) }
    }

    const openOpsiModal = (q) => {
        setActiveQuestion(q); setOptForm(emptyOptForm); setEditingOptId(null)
        setMediaOpsiFile(null); setOptionError(''); setRelForm(emptyRelForm); setRelError('')
        setPuzzleData(null); setPuzzleForm({ gridRows: '3', gridCols: '3' }); setPuzzleImageFile(null); setPuzzleError('')
        setPiecesList([]); setPieceForm(emptyPieceForm); setPieceImageFile(null); setEditingPieceId(null); setPieceError('')
        setShowOpsiModal(true)
        if (q.questionType === 'PUZZLE') fetchPuzzle(q.id)
        else { fetchOptions(q.id); if (NEEDS_RELATION.includes(q.questionType)) fetchRelations(q.id) }
    }

    const closeOpsiModal = () => {
        setShowOpsiModal(false); setActiveQuestion(null); setOptionsList([]); setRelationsList([]); setEditingOptId(null)
    }

    const handleOptChange = (e) => {
        const { name, value, type, checked } = e.target
        setOptForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const startEditOption = (opt) => {
        setOptForm({ teksOpsi: opt.teksOpsi ?? '', kunciJawaban: opt.kunciJawaban ?? false, urutanBenar: opt.urutanBenar ?? '', tipeItem: opt.tipeItem ?? '' })
        setEditingOptId(opt.id); setMediaOpsiFile(null)
        // show existing media as starting preview
        const existingMedia = opt.mediaOpsi ?? null
        setMediaOpsiPreview(existingMedia && /\.(jpe?g|png|gif|webp|svg)$/i.test(existingMedia.split('?')[0]) ? existingMedia : null)
    }

    const cancelEditOption = () => { setOptForm(emptyOptForm); setEditingOptId(null); setMediaOpsiFile(null); setMediaOpsiPreview(null) }

    const handleSaveOption = async () => {
        if (!optForm.teksOpsi.trim()) { setOptionError('Teks opsi wajib diisi.'); return }

        // Duplicate-order guard for SORTING
        if (activeQuestion.questionType === 'SORTING' && optForm.urutanBenar !== '') {
            const num = Number(optForm.urutanBenar)
            const duplicate = optionsList.find(
                (o) => Number(o.urutanBenar) === num && o.id !== editingOptId
            )
            if (duplicate) {
                setOptionError(`Urutan ${num} sudah dipakai oleh "${duplicate.teksOpsi}". Gunakan nomor yang berbeda.`)
                return
            }
        }

        setSavingOpt(true); setOptionError('')
        try {
            const fd = new FormData()
            fd.append('questionId', activeQuestion.id)
            fd.append('teksOpsi', optForm.teksOpsi)
            if (mediaOpsiFile) fd.append('mediaOpsi', mediaOpsiFile)
            const qType = activeQuestion.questionType
            if (qType === 'QUIZ') fd.append('kunciJawaban', optForm.kunciJawaban ? 'true' : 'false')
            else if (qType === 'SORTING') { if (optForm.urutanBenar !== '') fd.append('urutanBenar', optForm.urutanBenar) }
            else if (NEEDS_RELATION.includes(qType)) { if (optForm.tipeItem) fd.append('tipeItem', optForm.tipeItem) }
            if (editingOptId !== null) await apiFetch(`/question-options/${editingOptId}`, { method: 'PUT', body: fd })
            else await apiFetch('/question-options', { method: 'POST', body: fd })
            setOptForm(emptyOptForm); setEditingOptId(null); setMediaOpsiFile(null); setMediaOpsiPreview(null)
            fetchOptions(activeQuestion.id)
        } catch (err) { setOptionError(err.message) }
        finally { setSavingOpt(false) }
    }

    const handleDeleteOption = async (optId) => {
        try { await apiFetch(`/question-options/${optId}`, { method: 'DELETE' }); fetchOptions(activeQuestion.id) }
        catch (err) { setOptionError(err.message) }
    }

    const handleSaveRelation = async () => {
        if (!relForm.opsiPertanyaanId || !relForm.opsiJawabanId) { setRelError('Pilih kedua opsi.'); return }
        setSavingRel(true); setRelError('')
        try {
            await apiFetch('/matching-relations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId: activeQuestion.id,
                    opsiPertanyaanId: Number(relForm.opsiPertanyaanId),
                    opsiJawabanId: Number(relForm.opsiJawabanId),
                }),
            })
            setRelForm(emptyRelForm); fetchRelations(activeQuestion.id)
        } catch (err) { setRelError(err.message) }
        finally { setSavingRel(false) }
    }

    const handleDeleteRelation = async (relId) => {
        try { await apiFetch(`/matching-relations/${relId}`, { method: 'DELETE' }); fetchRelations(activeQuestion.id) }
        catch (err) { setRelError(err.message) }
    }

    const handleSavePuzzle = async () => {
        if (!puzzleForm.gridRows || !puzzleForm.gridCols) { setPuzzleError('Baris dan kolom wajib diisi.'); return }
        if (!puzzleImageFile && !puzzleData) { setPuzzleError('Gambar puzzle wajib diunggah.'); return }
        setSavingPuzzle(true); setPuzzleError('')
        try {
            const fd = new FormData()
            fd.append('gridRows', puzzleForm.gridRows)
            fd.append('gridCols', puzzleForm.gridCols)
            if (puzzleImageFile) fd.append('image', puzzleImageFile)
            if (puzzleData?.id) await apiFetch(`/jigsaw/puzzles/${puzzleData.id}`, { method: 'PUT', body: fd })
            else { fd.append('questionId', activeQuestion.id); await apiFetch('/jigsaw/puzzles', { method: 'POST', body: fd }) }
            fetchPuzzle(activeQuestion.id); setPuzzleImageFile(null)
        } catch (err) { setPuzzleError(err.message) }
        finally { setSavingPuzzle(false) }
    }

    const handleDeletePuzzle = async () => {
        if (!puzzleData?.id) return
        setSavingPuzzle(true); setPuzzleError('')
        try {
            await apiFetch(`/jigsaw/puzzles/${puzzleData.id}`, { method: 'DELETE' })
            setPuzzleData(null); setPuzzleForm({ gridRows: '3', gridCols: '3' }); setPiecesList([])
        } catch (err) { setPuzzleError(err.message) }
        finally { setSavingPuzzle(false) }
    }

    const handleSavePiece = async () => {
        if (pieceForm.pieceIndex === '' || pieceForm.correctPosition === '') { setPieceError('Index dan posisi benar wajib diisi.'); return }
        if (!pieceImageFile && !editingPieceId) { setPieceError('Gambar keping wajib diunggah untuk keping baru.'); return }
        setSavingPiece(true); setPieceError('')
        try {
            const fd = new FormData()
            fd.append('pieceIndex', pieceForm.pieceIndex)
            fd.append('correctPosition', pieceForm.correctPosition)
            if (pieceImageFile) fd.append('image', pieceImageFile)
            if (editingPieceId) await apiFetch(`/jigsaw/pieces/${editingPieceId}`, { method: 'PUT', body: fd })
            else await apiFetch(`/jigsaw/puzzles/${puzzleData.id}/pieces`, { method: 'POST', body: fd })
            setPieceForm(emptyPieceForm); setPieceImageFile(null); setEditingPieceId(null)
            fetchPieces(puzzleData.id)
        } catch (err) { setPieceError(err.message) }
        finally { setSavingPiece(false) }
    }

    const handleDeletePiece = async (pieceId) => {
        try { await apiFetch(`/jigsaw/pieces/${pieceId}`, { method: 'DELETE' }); fetchPieces(puzzleData.id) }
        catch (err) { setPieceError(err.message) }
    }

    const startEditPiece = (piece) => {
        setPieceForm({ pieceIndex: String(piece.pieceIndex ?? ''), correctPosition: String(piece.correctPosition ?? '') })
        setEditingPieceId(piece.id); setPieceImageFile(null)
    }

    const pertanyaanOpts = optionsList.filter((o) => o.tipeItem === 'PERTANYAAN')
    const jawabanOpts = optionsList.filter((o) => o.tipeItem === 'JAWABAN')
    const getOptLabel = (id) => { const o = optionsList.find((x) => x.id === id); return o ? o.teksOpsi : `#${id}` }

    const isRelation = activeQuestion && NEEDS_RELATION.includes(activeQuestion.questionType)
    const tipeItemOptions = activeQuestion ? (TIPE_ITEM_OPTIONS[activeQuestion.questionType] ?? []) : []

    const displayDate = formatDisplayDate(learningDate)

    const openReschedule = () => { setNewDateVal(learningDate); setRescheduleErr(''); setShowReschedule(true) }

    const handleReschedule = async () => {
        if (!newDateVal || newDateVal === learningDate) { setRescheduleErr('Pilih tanggal yang berbeda.'); return }
        const [y, m, d] = newDateVal.split('-').map(Number)
        const jsDay = new Date(y, m - 1, d).getDay()
        if (jsDay === 0 || jsDay === 6) { setRescheduleErr('Sabtu/Minggu bukan hari belajar.'); return }
        setRescheduling(true); setRescheduleErr('')
        try {
            await Promise.all(
                questionList.map((q) => {
                    const fd = new FormData()
                    fd.append('topicId', topicId)
                    fd.append('learningDate', newDateVal)
                    fd.append('questionType', q.questionType ?? 'QUIZ')
                    fd.append('contentInstruction', q.contentInstruction ?? '')
                    if (q.timeLimitMinutes) fd.append('timeLimitMinutes', q.timeLimitMinutes)
                    if (q.scorePoint) fd.append('scorePoint', q.scorePoint)
                    return apiFetch(`/questions/${q.id}`, { method: 'PUT', body: fd })
                })
            )
            setShowReschedule(false)
            navigate(`/admin/soal/${topicId}/date/${newDateVal}`, { replace: true })
        } catch (err) { setRescheduleErr(err.message) }
        finally { setRescheduling(false) }
    }

    const openDuplicate = () => { setDupDateVal(''); setDupErr(''); setShowDuplicate(true) }

    const handleDuplicate = async () => {
        if (!dupDateVal) { setDupErr('Pilih tanggal tujuan.'); return }
        if (dupDateVal === learningDate) { setDupErr('Pilih tanggal yang berbeda dari tanggal saat ini.'); return }
        const [y, m, d] = dupDateVal.split('-').map(Number)
        const jsDay = new Date(y, m - 1, d).getDay()
        if (jsDay === 0 || jsDay === 6) { setDupErr('Sabtu/Minggu bukan hari belajar.'); return }
        if (activeDates.has(dupDateVal)) { setDupErr(`Tanggal ${formatDisplayDate(dupDateVal)} sudah memiliki soal. Pilih tanggal lain.`); return }
        setDuplicating(true); setDupErr('')
        try {
            for (const q of questionList) {
                const fd = new FormData()
                fd.append('topicId', topicId)
                fd.append('learningDate', dupDateVal)
                fd.append('questionType', q.questionType ?? 'QUIZ')
                fd.append('contentInstruction', q.contentInstruction ?? '')
                if (q.timeLimitMinutes) fd.append('timeLimitMinutes', q.timeLimitMinutes)
                if (q.scorePoint) fd.append('scorePoint', q.scorePoint)
                const newQ = await apiFetch('/questions', { method: 'POST', body: fd })
                if (q.questionType !== 'PUZZLE' && newQ?.id) {
                    try {
                        const opts = await apiFetch(`/question-options/question/${q.id}`)
                        const optList = Array.isArray(opts) ? opts : []
                        for (const opt of optList) {
                            const ofd = new FormData()
                            ofd.append('questionId', newQ.id)
                            ofd.append('teksOpsi', opt.teksOpsi ?? '')
                            if (q.questionType === 'QUIZ') ofd.append('kunciJawaban', opt.kunciJawaban ? 'true' : 'false')
                            if (q.questionType === 'SORTING' && opt.urutanBenar != null) ofd.append('urutanBenar', opt.urutanBenar)
                            if (NEEDS_RELATION.includes(q.questionType) && opt.tipeItem) ofd.append('tipeItem', opt.tipeItem)
                            await apiFetch('/question-options', { method: 'POST', body: ofd })
                        }
                    } catch { /* skip options if fetch fails */ }
                }
            }
            setShowDuplicate(false)
        } catch (err) { setDupErr(err.message) }
        finally { setDuplicating(false) }
    }

    const handleDeleteDay = async () => {
        setDeletingDay(true); setDeleteDayErr('')
        try {
            await Promise.all(questionList.map((q) => apiFetch(`/questions/${q.id}`, { method: 'DELETE' })))
            setShowDeleteDay(false)
            navigate(`/admin/soal/${topicId}`, { replace: true })
        } catch (err) { setDeleteDayErr(err.message) }
        finally { setDeletingDay(false) }
    }

    const handleToggleAvailability = async () => {
        setTogglingAvail(true)
        try {
            await apiFetch(`/questions/topic/${topicId}/set-available`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ learningDate, available: !isAvailable }),
            })
            setIsAvailable((v) => !v)
        } catch (err) { setFetchError(err.message) }
        finally { setTogglingAvail(false) }
    }

    return (
        <AdminLayout activePath="/admin/soal">
            <nav className="soal-breadcrumb">
                <button className="btn-back" onClick={() => navigate('/admin/soal')}>← Manajemen Soal</button>
                <span className="breadcrumb-sep">/</span>
                <button className="btn-back" onClick={() => navigate(`/admin/soal/${topicId}`)}>{topic?.nameTopic ?? '...'}</button>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{displayDate}</span>
            </nav>

            <header className="dashboard-header">
                <div className="soal-header-title">
                    <h1>Soal — {displayDate}</h1>
                    <span className="soal-count-badge">{questionList.length} soal</span>
                    {isAvailable && (
                        <span className="soal-locked-badge"><Lock size={12} /> Aktif untuk Siswa</span>
                    )}
                    <button className="btn-icon btn-icon-edit reschedule-header-btn" onClick={openReschedule} title="Ubah tanggal" disabled={isAvailable}>
                        <Calendar size={15} />
                    </button>
                    <button className="btn-icon btn-icon-edit reschedule-header-btn" onClick={openDuplicate} title="Duplikat ke hari lain">
                        <Copy size={15} />
                    </button>
                    <button className="btn-icon btn-icon-delete reschedule-header-btn" onClick={() => { setDeleteDayErr(''); setShowDeleteDay(true) }} title="Hapus semua soal hari ini" disabled={questionList.length === 0 || isAvailable}>
                        <Trash2 size={15} />
                    </button>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                        className={`btn-avail-toggle${isAvailable ? ' btn-avail-toggle--on' : ' btn-avail-toggle--off'}`}
                        onClick={handleToggleAvailability}
                        disabled={togglingAvail}
                        title={isAvailable ? 'Klik untuk menonaktifkan (siswa tidak bisa mengerjakan)' : 'Klik untuk mengaktifkan soal untuk siswa'}
                    >
                        {togglingAvail
                            ? 'Menyimpan...'
                            : isAvailable
                                ? <><Lock size={14} /> Aktif — Kunci Editing</>
                                : <><Unlock size={14} /> Nonaktif — Aktifkan</>}
                    </button>
                    {!isAvailable && (
                        <button className="btn-primary" onClick={openAdd}>
                            <Plus size={16} /> Tambah Soal
                        </button>
                    )}
                </div>
            </header>

            <div className="flow-steps">
                <span className="flow-step flow-step--done">1. Tema</span>
                <span className="flow-step-sep">›</span>
                <span className="flow-step flow-step--done">2. Pilih Tanggal</span>
                <span className="flow-step-sep">›</span>
                <span className="flow-step flow-step--active">3. Kelola Soal</span>
            </div>

            {/* Locked banner */}
            {isAvailable && (
                <div className="soal-locked-banner">
                    <Lock size={16} />
                    <span>Soal ini sudah <strong>diaktifkan untuk siswa</strong>. Edit, hapus, dan tambah soal dinonaktifkan. Nonaktifkan terlebih dahulu untuk melakukan perubahan.</span>
                </div>
            )}

            <div className="soal-toolbar">
                <div className="search-wrapper" style={{ maxWidth: 380 }}>
                    <span className="search-icon"><Search size={15} /></span>
                    <input className="search-input" type="text" placeholder="Cari instruksi soal..."
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                    {search && (
                        <button className="search-clear" onClick={() => setSearch('')} title="Hapus"><X size={14} /></button>
                    )}
                </div>
                <div className="qtype-filter">
                    <button className={`qtype-btn${filterType === '' ? ' active' : ''}`} onClick={() => setFilterType('')}>Semua</button>
                    {QUESTION_TYPES.map((t) => (
                        <button key={t.value}
                            className={`qtype-btn${filterType === t.value ? ' active' : ''}`}
                            style={filterType === t.value ? { background: t.bg, color: t.color, borderColor: t.color } : {}}
                            onClick={() => setFilterType(filterType === t.value ? '' : t.value)}
                        >{t.label}</button>
                    ))}
                </div>
            </div>

            {fetchError && <p className="modal-error">{fetchError}</p>}

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr><th>No</th><th>Tipe</th><th>Instruksi</th><th>Waktu</th><th>Poin</th><th>Aksi</th></tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="empty-row">Memuat soal...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} className="empty-row">Belum ada soal untuk hari ini.</td></tr>
                        ) : filtered.map((q, idx) => (
                            <tr key={q.id}>
                                <td>{idx + 1}</td>
                                <td><TypeBadge type={q.questionType} /></td>
                                <td className="soal-instruction-cell">{q.contentInstruction}</td>
                                <td>
                                    {q.timeLimitMinutes
                                        ? <span className="timer-badge"><Clock size={12} /> {q.timeLimitMinutes} mnt</span>
                                        : <span className="no-media">&mdash;</span>}
                                </td>
                                <td>
                                    {q.scorePoint
                                        ? <span className="timer-badge" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fbbf24' }}>🏆 {q.scorePoint} poin</span>
                                        : <span className="no-media">&mdash;</span>}
                                </td>
                                <td>
                                    <div className="action-cell">
                                        <button className="btn-icon btn-icon-detail" onClick={() => openOpsiModal(q)} title="Kelola opsi"><Eye size={15} /></button>
                                        <button className="btn-icon btn-icon-edit" onClick={() => openEdit(q)} title="Edit soal" disabled={isAvailable}><Pencil size={15} /></button>
                                        <button className="btn-icon btn-icon-delete" onClick={() => setDeleteId(q.id)} title="Hapus soal" disabled={isAvailable}><Trash2 size={15} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Tambah / Edit Soal */}
            {showModal && (
                <Modal title={editId !== null ? 'Edit Soal' : 'Tambah Soal Baru'} onClose={() => setShowModal(false)}>
                    {error && <p className="modal-error">{error}</p>}

                    {/* Tipe Soal */}
                    <div className="form-group">
                        <label>Tipe Soal</label>
                        <div className="qtype-selector">
                            {QUESTION_TYPES.map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    className={`qtype-option${form.questionType === t.value ? ' selected' : ''}`}
                                    style={form.questionType === t.value ? { background: t.bg, color: t.color, borderColor: t.color } : {}}
                                    onClick={() => setForm((prev) => ({ ...prev, questionType: t.value }))}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Instruksi */}
                    <div className="form-group">
                        <label>Instruksi / Pertanyaan <span className="field-required">*</span></label>
                        <textarea
                            name="contentInstruction"
                            value={form.contentInstruction}
                            onChange={handleQChange}
                            placeholder="Tuliskan instruksi atau pertanyaan untuk siswa..."
                            rows={3}
                            className="form-textarea"
                        />
                    </div>

                    {/* Media — hanya untuk non-PUZZLE */}
                    {form.questionType !== 'PUZZLE' && (
                        <div className="soal-media-row">
                            <div className="form-group soal-media-field">
                                <label>Gambar <span className="field-optional">(opsional)</span></label>
                                {imagePreview && (
                                    <img src={imagePreview} alt="preview" className="media-preview-img" />
                                )}
                                <label className="file-upload-btn">
                                    📎 Pilih Gambar
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const f = e.target.files[0]
                                            if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)) }
                                        }}
                                    />
                                </label>
                                {imageFile && <span className="file-selected">✓ {imageFile.name}</span>}
                            </div>
                            <div className="form-group soal-media-field">
                                <label>Audio <span className="field-optional">(opsional)</span></label>
                                {audioFile
                                    ? <p className="file-selected">✓ {audioFile.name}</p>
                                    : existingAudio
                                        ? <audio controls src={existingAudio} className="audio-preview" />
                                        : null}
                                <label className="file-upload-btn">
                                    🎵 Pilih Audio
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => { const f = e.target.files[0]; if (f) setAudioFile(f) }}
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Batas Waktu + Poin — side by side */}
                    <div className="soal-meta-row">
                        <div className="form-group">
                            <label>⏱ Batas Waktu <span className="field-optional">(opsional)</span></label>
                            <div className="timer-input-row">
                                <input
                                    name="timeLimitMinutes"
                                    type="number"
                                    min="1"
                                    max="60"
                                    value={form.timeLimitMinutes}
                                    onChange={handleQChange}
                                    placeholder="misal: 2"
                                    className="timer-input"
                                />
                                <span className="timer-unit">menit</span>
                            </div>
                            <small className="form-hint">Kosongkan jika tidak ada batas waktu</small>
                        </div>
                        <div className="form-group">
                            <label>🏆 Poin Soal <span className="field-optional">(opsional)</span></label>
                            <div className="timer-input-row">
                                <input
                                    name="scorePoint"
                                    type="number"
                                    min="1"
                                    max="1000"
                                    value={form.scorePoint}
                                    onChange={handleQChange}
                                    placeholder="misal: 10"
                                    className="timer-input"
                                />
                                <span className="timer-unit">poin</span>
                            </div>
                            <small className="form-hint">Kosongkan untuk poin default sistem</small>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Batal</button>
                        <button className="btn-primary" onClick={handleSaveQuestion} disabled={saving}>
                            {saving ? 'Menyimpan...' : editId !== null ? 'Simpan Perubahan' : 'Tambah Soal'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Konfirmasi Hapus Soal */}
            {deleteId !== null && (
                <Modal title="Hapus Soal?" onClose={() => setDeleteId(null)}>
                    <p>Soal ini beserta semua opsinya akan dihapus secara permanen.</p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setDeleteId(null)}>Batal</button>
                        <button className="btn-danger" onClick={handleDeleteQuestion}>Hapus</button>
                    </div>
                </Modal>
            )}

            {/* Modal Kelola Opsi */}
            {showOpsiModal && activeQuestion && (
                <Modal title="Kelola Opsi Soal" className="modal-wide" onClose={closeOpsiModal}>
                    <div className="opsi-question-info">
                        <TypeBadge type={activeQuestion.questionType} />
                        <span className="opsi-q-text">{activeQuestion.contentInstruction}</span>
                    </div>

                    {isAvailable && (
                        <div className="opsi-locked-notice">
                            <Lock size={13} /> Soal aktif — hanya bisa dilihat, tidak bisa diedit.
                        </div>
                    )}

                    {optionError && <p className="modal-error">{optionError}</p>}

                    {activeQuestion.questionType === 'PUZZLE' ? (
                        <div className="puzzle-config-section">
                            {puzzleError && <p className="modal-error">{puzzleError}</p>}
                            {puzzleData && (
                                <div className="puzzle-current-info">
                                    <div className="puzzle-current-header">
                                        <div>
                                            <p className="opsi-section-label" style={{ margin: 0 }}>Puzzle Tersimpan</p>
                                            <p className="puzzle-grid-label">Grid: <strong>{puzzleData.gridRows} baris × {puzzleData.gridCols} kolom</strong></p>
                                        </div>
                                        <button className="btn-danger" onClick={handleDeletePuzzle} disabled={savingPuzzle} style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                                            Hapus Puzzle
                                        </button>
                                    </div>
                                    {puzzleData.imageUrl && <img src={puzzleData.imageUrl} alt="puzzle" className="puzzle-preview-img" />}
                                </div>
                            )}
                            <h4 className="opsi-form-title">{puzzleData ? '✏ Update Puzzle' : '+ Buat Puzzle'}</h4>
                            <div className="opsi-form-grid">
                                <div className="form-group">
                                    <label>Jumlah Baris</label>
                                    <input type="number" min="2" max="6" value={puzzleForm.gridRows}
                                        onChange={(e) => setPuzzleForm((p) => ({ ...p, gridRows: e.target.value }))} placeholder="contoh: 3" />
                                    <small className="form-hint">Minimal 2, maksimal 6</small>
                                </div>
                                <div className="form-group">
                                    <label>Jumlah Kolom</label>
                                    <input type="number" min="2" max="6" value={puzzleForm.gridCols}
                                        onChange={(e) => setPuzzleForm((p) => ({ ...p, gridCols: e.target.value }))} placeholder="contoh: 3" />
                                    <small className="form-hint">Minimal 2, maksimal 6</small>
                                </div>
                                <div className="form-group">
                                    <label>Gambar Puzzle {puzzleData ? '(kosongkan untuk tetap pakai gambar lama)' : '(wajib)'}</label>
                                    <input type="file" accept="image/*" className="input-file" onChange={(e) => setPuzzleImageFile(e.target.files[0] || null)} />
                                    {puzzleImageFile && <span className="file-selected">✓ {puzzleImageFile.name}</span>}
                                </div>
                            </div>
                            <div className="opsi-form-actions">
                                <button className="btn-primary" onClick={handleSavePuzzle} disabled={savingPuzzle}>
                                    {savingPuzzle ? 'Menyimpan...' : puzzleData ? 'Update Puzzle' : 'Buat Puzzle'}
                                </button>
                            </div>
                            {puzzleData?.id && (
                                <div className="rel-section">
                                    <h4 className="opsi-section-label">🧩 Keping Puzzle</h4>
                                    {pieceError && <p className="modal-error">{pieceError}</p>}
                                    {loadingPieces ? <p className="tema-loading">Memuat keping...</p>
                                        : piecesList.length === 0 ? <p className="opsi-empty">Belum ada keping.</p>
                                            : (
                                                <div className="opsi-table-wrap">
                                                    <table className="opsi-table">
                                                        <thead><tr><th>#</th><th>Index</th><th>Posisi Benar</th><th>Gambar</th><th>Aksi</th></tr></thead>
                                                        <tbody>
                                                            {piecesList.map((piece, idx) => (
                                                                <tr key={piece.id} className={editingPieceId === piece.id ? 'row-editing' : ''}>
                                                                    <td>{idx + 1}</td>
                                                                    <td><span className="answer-chip">{piece.pieceIndex}</span></td>
                                                                    <td><span className="answer-chip">#{piece.correctPosition}</span></td>
                                                                    <td>
                                                                        {piece.pieceImageUrl
                                                                            ? <a href={piece.pieceImageUrl} target="_blank" rel="noreferrer" className="opsi-img-link">
                                                                                <img src={piece.pieceImageUrl} alt={`keping ${piece.pieceIndex}`} className="opsi-img-thumb" />
                                                                            </a>
                                                                            : <span className="no-media">&mdash;</span>}
                                                                    </td>
                                                                    <td>
                                                                        <div className="action-cell">
                                                                            <button className="btn-edit" onClick={() => startEditPiece(piece)}>Edit</button>
                                                                            <button className="btn-delete" onClick={() => handleDeletePiece(piece.id)}>Hapus</button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                    <div className="opsi-form-section">
                                        <h4 className="opsi-form-title">{editingPieceId ? '✏ Edit Keping' : '+ Tambah Keping'}</h4>
                                        <div className="opsi-form-grid">
                                            <div className="form-group">
                                                <label>Piece Index</label>
                                                <input type="number" min="0" value={pieceForm.pieceIndex}
                                                    onChange={(e) => setPieceForm((p) => ({ ...p, pieceIndex: e.target.value }))} placeholder="contoh: 0" />
                                                <small className="form-hint">Dimulai dari 0</small>
                                            </div>
                                            <div className="form-group">
                                                <label>Correct Position</label>
                                                <input type="number" min="0" value={pieceForm.correctPosition}
                                                    onChange={(e) => setPieceForm((p) => ({ ...p, correctPosition: e.target.value }))} placeholder="contoh: 0" />
                                                <small className="form-hint">Posisi benar keping ini di grid</small>
                                            </div>
                                            <div className="form-group">
                                                <label>Gambar Keping {editingPieceId ? '(kosongkan untuk tetap pakai lama)' : '(wajib)'}</label>
                                                <input type="file" accept="image/*" className="input-file" onChange={(e) => setPieceImageFile(e.target.files[0] || null)} />
                                                {pieceImageFile && <span className="file-selected">✓ {pieceImageFile.name}</span>}
                                            </div>
                                        </div>
                                        <div className="opsi-form-actions">
                                            {editingPieceId && (
                                                <button className="btn-secondary" onClick={() => { setEditingPieceId(null); setPieceForm(emptyPieceForm); setPieceImageFile(null) }}>
                                                    Batal Edit
                                                </button>
                                            )}
                                            <button className="btn-primary" onClick={handleSavePiece} disabled={savingPiece}>
                                                {savingPiece ? 'Menyimpan...' : editingPieceId ? 'Update Keping' : 'Tambah Keping'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {activeQuestion.questionType === 'QUIZ' ? (
                                /* ── QUIZ: visual pilihan jawaban cards ─────────── */
                                <div className="quiz-opts-wrap">
                                    <div className="quiz-opts-header">
                                        <h4 className="opsi-section-label">Pilihan Jawaban</h4>
                                        {!loadingOptions && optionsList.length > 0 && (
                                            <span className="opsi-count-badge">{optionsList.length} opsi</span>
                                        )}
                                    </div>

                                    {loadingOptions ? (
                                        <p className="tema-loading">Memuat opsi...</p>
                                    ) : optionsList.length > 0 ? (
                                        <div className="quiz-opts-list">
                                            {optionsList.map((opt, idx) => (
                                                <div key={opt.id}
                                                    className={`quiz-opt-item${opt.kunciJawaban ? ' quiz-opt-item--correct' : ''}${editingOptId === opt.id ? ' quiz-opt-item--editing' : ''}`}>
                                                    <span className="quiz-opt-letter">{String.fromCodePoint(65 + idx)}</span>
                                                    {editingOptId === opt.id ? (
                                                        <div className="quiz-opt-edit-body">
                                                            <input
                                                                name="teksOpsi"
                                                                value={optForm.teksOpsi}
                                                                onChange={handleOptChange}
                                                                className="quiz-opt-edit-input"
                                                                placeholder="Teks jawaban..."
                                                                autoFocus
                                                            />
                                                            <label className="quiz-correct-check">
                                                                <input type="checkbox" name="kunciJawaban" checked={optForm.kunciJawaban} onChange={handleOptChange} disabled={isAvailable} />
                                                                Tandai sebagai jawaban benar
                                                            </label>
                                                            <div className="quiz-media-preview-block">
                                                                {mediaOpsiPreview ? (
                                                                    <img src={mediaOpsiPreview} alt="preview media" className="quiz-media-preview-img" />
                                                                ) : (
                                                                    optionsList.find(o => o.id === editingOptId)?.mediaOpsi && getMediaType(optionsList.find(o => o.id === editingOptId).mediaOpsi) === 'audio' && (
                                                                        <audio controls src={optionsList.find(o => o.id === editingOptId).mediaOpsi} className="quiz-opt-saved-audio" />
                                                                    )
                                                                )}
                                                                <label className="file-upload-btn file-upload-btn--sm">
                                                                    📎 {mediaOpsiFile ? 'Ganti Media' : (optionsList.find(o => o.id === editingOptId)?.mediaOpsi ? 'Ganti Media' : 'Pilih Media')}
                                                                    <input type="file" accept="image/*,audio/*" style={{ display: 'none' }}
                                                                        onChange={(e) => {
                                                                            const f = e.target.files[0] || null
                                                                            setMediaOpsiFile(f)
                                                                            if (f && f.type.startsWith('image/')) setMediaOpsiPreview(URL.createObjectURL(f))
                                                                            else setMediaOpsiPreview(null)
                                                                        }} />
                                                                </label>
                                                                {mediaOpsiFile && <span className="file-selected">✓ {mediaOpsiFile.name}</span>}
                                                            </div>
                                                            <div className="quiz-opt-edit-actions">
                                                                <button className="btn-secondary" onClick={cancelEditOption} disabled={savingOpt}>Batal</button>
                                                                <button className="btn-primary" onClick={handleSaveOption} disabled={savingOpt}>
                                                                    {savingOpt ? 'Menyimpan...' : 'Simpan'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {opt.mediaOpsi && getMediaType(opt.mediaOpsi) === 'image' && (
                                                                <img src={opt.mediaOpsi} alt="media opsi" className="quiz-opt-saved-img" />
                                                            )}
                                                            {opt.mediaOpsi && getMediaType(opt.mediaOpsi) === 'audio' && (
                                                                <audio controls src={opt.mediaOpsi} className="quiz-opt-saved-audio" />
                                                            )}
                                                            <span className="quiz-opt-text">{opt.teksOpsi}</span>
                                                            {opt.kunciJawaban && <span className="quiz-correct-badge">✓ Benar</span>}
                                                            <div className="quiz-opt-actions">
                                                                <button className="btn-icon btn-icon-edit" onClick={() => startEditOption(opt)} title="Edit opsi" disabled={isAvailable}>
                                                                    <Pencil size={13} />
                                                                </button>
                                                                <button className="btn-icon btn-icon-delete" onClick={() => handleDeleteOption(opt.id)} title="Hapus opsi" disabled={isAvailable}>
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}

                                    {/* Add new option row — hidden while editing an existing card or locked */}
                                    {!editingOptId && !isAvailable && (
                                        <div className="quiz-add-opt-row">
                                            <span className="quiz-opt-letter quiz-opt-letter--add">
                                                {String.fromCodePoint(65 + optionsList.length)}
                                            </span>
                                            <input
                                                name="teksOpsi"
                                                value={optForm.teksOpsi}
                                                onChange={handleOptChange}
                                                placeholder="Ketik pilihan jawaban baru..."
                                                className="quiz-add-opt-input"
                                            />
                                            <label className="quiz-correct-check">
                                                <input type="checkbox" name="kunciJawaban" checked={optForm.kunciJawaban} onChange={handleOptChange} />
                                                <span>Benar</span>
                                            </label>
                                            <label className="file-upload-btn file-upload-btn--sm" title="Lampirkan gambar / audio">
                                                📎
                                                <input type="file" accept="image/*,audio/*" style={{ display: 'none' }}
                                                    onChange={(e) => {
                                                        const f = e.target.files[0] || null
                                                        setMediaOpsiFile(f)
                                                        if (f && f.type.startsWith('image/')) setMediaOpsiPreview(URL.createObjectURL(f))
                                                        else if (f) setMediaOpsiPreview(null)
                                                        else setMediaOpsiPreview(null)
                                                    }} />
                                            </label>
                                            <button
                                                className="btn-primary quiz-add-opt-btn"
                                                onClick={handleSaveOption}
                                                disabled={savingOpt || !optForm.teksOpsi.trim()}
                                            >
                                                {savingOpt ? '...' : '+ Tambah'}
                                            </button>
                                        </div>
                                    )}
                                    {!editingOptId && (mediaOpsiPreview || mediaOpsiFile) && (
                                        <div className="quiz-add-media-preview">
                                            {mediaOpsiPreview && (
                                                <img src={mediaOpsiPreview} alt="preview media" className="quiz-media-preview-img" />
                                            )}
                                            {mediaOpsiFile && (
                                                <span className="file-selected">✓ {mediaOpsiFile.name}</span>
                                            )}
                                        </div>
                                    )}
                                    {!loadingOptions && optionsList.length === 0 && (
                                        <p className="opsi-empty" style={{ marginTop: 0 }}>Belum ada pilihan. Gunakan baris di atas untuk menambah.</p>
                                    )}
                                </div>
                            ) : isRelation ? (
                                /* ── MATCH / DRAG_AND_DROP: guided two-step UI ──────────────── */
                                <div className="match-section">

                                    {/* ── Step 1: Manage items ──────────────────────────────── */}
                                    <div className="match-step">
                                        <div className="match-step-header">
                                            <span className="match-step-num">1</span>
                                            <div className="match-step-info">
                                                <p className="match-step-title">
                                                    {activeQuestion.questionType === 'MATCH' ? 'Buat Item Pertanyaan & Jawaban' : 'Buat Drop Zone & Item Drag'}
                                                </p>
                                                <p className="match-step-desc">
                                                    {activeQuestion.questionType === 'MATCH'
                                                        ? 'Buat teks untuk sisi Kiri (pertanyaan) dan sisi Kanan (jawaban). Setelah selesai, pasangkan di Langkah 2.'
                                                        : 'Buat Drop Zone (wadah) dan Item Drag (item). Setelah selesai, pasangkan di Langkah 2.'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Two-column item board */}
                                        <div className="match-columns">
                                            <div className="match-col">
                                                <div className="match-col-header match-col-header--left">
                                                    <span>{tipeItemOptions[0]?.label ?? 'Sisi Kiri'}</span>
                                                    <span className="match-col-count">{pertanyaanOpts.length} item</span>
                                                </div>
                                                {loadingOptions ? <p className="tema-loading">Memuat...</p>
                                                    : pertanyaanOpts.length === 0
                                                        ? <p className="match-col-empty">Belum ada item di sisi ini</p>
                                                        : pertanyaanOpts.map((opt) => (
                                                            <div key={opt.id} className={`match-item-card match-item-card--left${editingOptId === opt.id ? ' match-item-card--editing' : ''}`}>
                                                                {opt.mediaOpsi && getMediaType(opt.mediaOpsi) === 'image' && (
                                                                    <img src={opt.mediaOpsi} alt="" className="match-item-thumb" />
                                                                )}
                                                                <span className="match-item-text">{opt.teksOpsi}</span>
                                                                <div className="match-item-actions">
                                                                    <button className="btn-icon btn-icon-edit" onClick={() => startEditOption(opt)} title="Edit" disabled={isAvailable}><Pencil size={12} /></button>
                                                                    <button className="btn-icon btn-icon-delete" onClick={() => handleDeleteOption(opt.id)} title="Hapus" disabled={isAvailable}><Trash2 size={12} /></button>
                                                                </div>
                                                            </div>
                                                        ))}
                                            </div>
                                            <div className="match-col">
                                                <div className="match-col-header match-col-header--right">
                                                    <span>{tipeItemOptions[1]?.label ?? 'Sisi Kanan'}</span>
                                                    <span className="match-col-count">{jawabanOpts.length} item</span>
                                                </div>
                                                {loadingOptions ? <p className="tema-loading">Memuat...</p>
                                                    : jawabanOpts.length === 0
                                                        ? <p className="match-col-empty">Belum ada item di sisi ini</p>
                                                        : jawabanOpts.map((opt) => (
                                                            <div key={opt.id} className={`match-item-card match-item-card--right${editingOptId === opt.id ? ' match-item-card--editing' : ''}`}>
                                                                {opt.mediaOpsi && getMediaType(opt.mediaOpsi) === 'image' && (
                                                                    <img src={opt.mediaOpsi} alt="" className="match-item-thumb" />
                                                                )}
                                                                <span className="match-item-text">{opt.teksOpsi}</span>
                                                                <div className="match-item-actions">
                                                                    <button className="btn-icon btn-icon-edit" onClick={() => startEditOption(opt)} title="Edit" disabled={isAvailable}><Pencil size={12} /></button>
                                                                    <button className="btn-icon btn-icon-delete" onClick={() => handleDeleteOption(opt.id)} title="Hapus" disabled={isAvailable}><Trash2 size={12} /></button>
                                                                </div>
                                                            </div>
                                                        ))}
                                            </div>
                                        </div>

                                        {/* Add / edit item form */}
                                        <div className="match-item-form">
                                            {editingOptId ? (
                                                <p className="match-edit-hint">
                                                    ✏ Mengedit: <strong>{optForm.tipeItem === 'PERTANYAAN' ? (tipeItemOptions[0]?.label ?? 'Kiri') : (tipeItemOptions[1]?.label ?? 'Kanan')}</strong>
                                                </p>
                                            ) : (
                                                <div className="match-side-toggle">
                                                    <button type="button"
                                                        className={`match-side-btn match-side-btn--left${optForm.tipeItem === 'PERTANYAAN' ? ' active' : ''}`}
                                                        onClick={() => setOptForm((p) => ({ ...p, tipeItem: 'PERTANYAAN' }))}>
                                                        + {tipeItemOptions[0]?.label ?? 'Sisi Kiri'}
                                                    </button>
                                                    <button type="button"
                                                        className={`match-side-btn match-side-btn--right${optForm.tipeItem === 'JAWABAN' ? ' active' : ''}`}
                                                        onClick={() => setOptForm((p) => ({ ...p, tipeItem: 'JAWABAN' }))}>
                                                        + {tipeItemOptions[1]?.label ?? 'Sisi Kanan'}
                                                    </button>
                                                </div>
                                            )}
                                            <div className="match-add-row">
                                                <input
                                                    name="teksOpsi"
                                                    value={optForm.teksOpsi}
                                                    onChange={handleOptChange}
                                                    placeholder="Ketik teks item..."
                                                    className="match-add-input"
                                                    disabled={!editingOptId && !optForm.tipeItem}
                                                />
                                                <label className={`file-upload-btn file-upload-btn--sm${!editingOptId && !optForm.tipeItem ? ' file-upload-btn--disabled' : ''}`} title="Lampirkan gambar / audio">
                                                    📎
                                                    <input type="file" accept="image/*,audio/*" style={{ display: 'none' }}
                                                        disabled={!editingOptId && !optForm.tipeItem}
                                                        onChange={(e) => {
                                                            const f = e.target.files[0] || null
                                                            setMediaOpsiFile(f)
                                                            if (f?.type.startsWith('image/')) setMediaOpsiPreview(URL.createObjectURL(f))
                                                            else setMediaOpsiPreview(null)
                                                        }} />
                                                </label>
                                                {editingOptId ? (
                                                    <>
                                                        <button className="btn-secondary" onClick={cancelEditOption} disabled={savingOpt}>Batal</button>
                                                        <button className="btn-primary" onClick={handleSaveOption} disabled={savingOpt || !optForm.teksOpsi.trim()}>
                                                            {savingOpt ? '...' : 'Simpan'}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button className="btn-primary" onClick={handleSaveOption}
                                                        disabled={savingOpt || !optForm.teksOpsi.trim() || !optForm.tipeItem}>
                                                        {savingOpt ? '...' : '+ Tambah'}
                                                    </button>
                                                )}
                                            </div>
                                            {mediaOpsiPreview && <img src={mediaOpsiPreview} alt="preview" className="quiz-media-preview-img" style={{ marginTop: 6 }} />}
                                            {mediaOpsiFile && !mediaOpsiPreview && <span className="file-selected">✓ {mediaOpsiFile.name}</span>}
                                            {!editingOptId && !optForm.tipeItem && (
                                                <p className="match-hint-text">⬆ Pilih sisi yang ingin ditambahkan itemnya terlebih dahulu.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* ── Step 2: Create pairs ───────────────────────────── */}
                                    <div className="match-step">
                                        <div className="match-step-header">
                                            <span className="match-step-num">2</span>
                                            <div className="match-step-info">
                                                <p className="match-step-title">Buat Pasangan</p>
                                                <p className="match-step-desc">Pilih satu item dari kiri dan satu dari kanan, lalu klik Pasangkan.</p>
                                            </div>
                                        </div>

                                        {relError && <p className="modal-error">{relError}</p>}

                                        {/* Pair selector */}
                                        <div className="match-pair-form">
                                            <div className="match-pair-select">
                                                <span className="match-pair-label match-pair-label--left">{tipeItemOptions[0]?.label ?? 'Kiri'}</span>
                                                <select value={relForm.opsiPertanyaanId}
                                                    onChange={(e) => setRelForm((p) => ({ ...p, opsiPertanyaanId: e.target.value }))}
                                                    className="form-select">
                                                    <option value="">— Pilih —</option>
                                                    {pertanyaanOpts.map((o) => <option key={o.id} value={o.id}>{o.teksOpsi}</option>)}
                                                </select>
                                            </div>
                                            <span className="match-arrow-connector">↔</span>
                                            <div className="match-pair-select">
                                                <span className="match-pair-label match-pair-label--right">{tipeItemOptions[1]?.label ?? 'Kanan'}</span>
                                                <select value={relForm.opsiJawabanId}
                                                    onChange={(e) => setRelForm((p) => ({ ...p, opsiJawabanId: e.target.value }))}
                                                    className="form-select">
                                                    <option value="">— Pilih —</option>
                                                    {jawabanOpts.map((o) => <option key={o.id} value={o.id}>{o.teksOpsi}</option>)}
                                                </select>
                                            </div>
                                            <button className="btn-primary match-pair-btn"
                                                onClick={handleSaveRelation}
                                                disabled={savingRel || !relForm.opsiPertanyaanId || !relForm.opsiJawabanId}>
                                                {savingRel ? '...' : '🔗 Pasangkan'}
                                            </button>
                                        </div>

                                        {/* Saved pairs */}
                                        {loadingRel ? <p className="tema-loading">Memuat pasangan...</p>
                                            : relationsList.length === 0
                                                ? <p className="opsi-empty">Belum ada pasangan. Pilih dari dropdown di atas lalu klik Pasangkan.</p>
                                                : (
                                                    <div className="match-pairs-list">
                                                        {relationsList.map((rel, idx) => (
                                                            <div key={rel.id} className="match-pair-card">
                                                                <span className="match-pair-num">{idx + 1}</span>
                                                                <span className="match-pair-left">{getOptLabel(rel.opsiPertanyaanId)}</span>
                                                                <span className="match-pair-arrow">↔</span>
                                                                <span className="match-pair-right">{getOptLabel(rel.opsiJawabanId)}</span>
                                                                <button className="btn-icon btn-icon-delete" onClick={() => handleDeleteRelation(rel.id)} title="Hapus pasangan" disabled={isAvailable}>
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                    </div>
                                </div>
                            ) : (
                                /* ── SORTING: numbered order cards ───────────────────────── */
                                <div className="sort-section">
                                    <div className="sort-section-header">
                                        <div className="sort-section-info">
                                            <p className="match-step-title">Item yang Perlu Diurutkan</p>
                                            <p className="match-step-desc">
                                                Tambahkan semua item beserta nomor urut yang benar. Siswa akan melihat item dalam urutan acak dan harus menyusunnya dengan benar.
                                            </p>
                                        </div>
                                        {!loadingOptions && optionsList.length > 0 && (
                                            <span className="opsi-count-badge">{optionsList.length} item</span>
                                        )}
                                    </div>

                                    {/* Ordered preview */}
                                    {loadingOptions ? (
                                        <p className="tema-loading">Memuat opsi...</p>
                                    ) : optionsList.length === 0 ? (
                                        <div className="sort-empty-state">
                                            <span className="sort-empty-icon">🔢</span>
                                            <p>Belum ada item. Gunakan form di bawah untuk menambahkan.</p>
                                        </div>
                                    ) : (
                                        <div className="sort-ordered-list">
                                            {[...optionsList]
                                                .sort((a, b) => (a.urutanBenar ?? 999) - (b.urutanBenar ?? 999))
                                                .map((opt) => (
                                                    <div key={opt.id}
                                                        className={`sort-item-card${editingOptId === opt.id ? ' sort-item-card--editing' : ''}`}>
                                                        <span className="sort-item-num">{opt.urutanBenar ?? '?'}</span>
                                                        <div className="sort-item-body">
                                                            {opt.mediaOpsi && getMediaType(opt.mediaOpsi) === 'image' && (
                                                                <img src={opt.mediaOpsi} alt="" className="sort-item-thumb" />
                                                            )}
                                                            {editingOptId === opt.id ? (
                                                                <div className="sort-inline-edit">
                                                                    <input
                                                                        name="teksOpsi"
                                                                        value={optForm.teksOpsi}
                                                                        onChange={handleOptChange}
                                                                        className="match-add-input"
                                                                        placeholder="Teks item..."
                                                                        autoFocus
                                                                    />
                                                                    <div className="sort-edit-meta">
                                                                        <div className="sort-order-field">
                                                                            <span className="sort-order-label">Urutan</span>
                                                                            <input
                                                                                name="urutanBenar"
                                                                                type="number"
                                                                                min="1"
                                                                                value={optForm.urutanBenar}
                                                                                onChange={handleOptChange}
                                                                                className="sort-order-input"
                                                                                placeholder="1"
                                                                            />
                                                                        </div>
                                                                        <label className="file-upload-btn file-upload-btn--sm">
                                                                            📎 Media
                                                                            <input type="file" accept="image/*,audio/*" style={{ display: 'none' }}
                                                                                onChange={(e) => {
                                                                                    const f = e.target.files[0] || null
                                                                                    setMediaOpsiFile(f)
                                                                                    if (f?.type.startsWith('image/')) setMediaOpsiPreview(URL.createObjectURL(f))
                                                                                    else setMediaOpsiPreview(null)
                                                                                }} />
                                                                        </label>
                                                                        {mediaOpsiPreview && <img src={mediaOpsiPreview} alt="preview" className="sort-edit-preview" />}
                                                                        {mediaOpsiFile && !mediaOpsiPreview && <span className="file-selected">✓ {mediaOpsiFile.name}</span>}
                                                                    </div>
                                                                    <div className="sort-edit-actions">
                                                                        <button className="btn-secondary" onClick={cancelEditOption} disabled={savingOpt}>Batal</button>
                                                                        <button className="btn-primary" onClick={handleSaveOption} disabled={savingOpt || !optForm.teksOpsi.trim()}>
                                                                            {savingOpt ? 'Menyimpan...' : 'Simpan'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="sort-item-text">{opt.teksOpsi}</span>
                                                            )}
                                                        </div>
                                                        {editingOptId !== opt.id && (
                                                            <div className="match-item-actions">
                                                                <button className="btn-icon btn-icon-edit" onClick={() => startEditOption(opt)} title="Edit" disabled={isAvailable}><Pencil size={12} /></button>
                                                                <button className="btn-icon btn-icon-delete" onClick={() => handleDeleteOption(opt.id)} title="Hapus" disabled={isAvailable}><Trash2 size={12} /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    )}

                                    {/* Add new item */}
                                    {!editingOptId && (
                                        <div className="sort-add-form">
                                            <div className="sort-add-num-wrap">
                                                <span className="sort-add-num-label">Urutan</span>
                                                <input
                                                    name="urutanBenar"
                                                    type="number"
                                                    min="1"
                                                    value={optForm.urutanBenar}
                                                    onChange={handleOptChange}
                                                    placeholder={(optionsList.length + 1).toString()}
                                                    className="sort-order-input"
                                                />
                                            </div>
                                            <input
                                                name="teksOpsi"
                                                value={optForm.teksOpsi}
                                                onChange={handleOptChange}
                                                placeholder="Ketik teks item..."
                                                className="match-add-input"
                                            />
                                            <label className="file-upload-btn file-upload-btn--sm" title="Lampirkan gambar / audio">
                                                📎
                                                <input type="file" accept="image/*,audio/*" style={{ display: 'none' }}
                                                    onChange={(e) => {
                                                        const f = e.target.files[0] || null
                                                        setMediaOpsiFile(f)
                                                        if (f?.type.startsWith('image/')) setMediaOpsiPreview(URL.createObjectURL(f))
                                                        else setMediaOpsiPreview(null)
                                                    }} />
                                            </label>
                                            <button
                                                className="btn-primary quiz-add-opt-btn"
                                                onClick={handleSaveOption}
                                                disabled={savingOpt || !optForm.teksOpsi.trim()}
                                            >
                                                {savingOpt ? '...' : '+ Tambah'}
                                            </button>
                                        </div>
                                    )}
                                    {!editingOptId && mediaOpsiPreview && (
                                        <img src={mediaOpsiPreview} alt="preview" className="quiz-media-preview-img" style={{ marginLeft: 8 }} />
                                    )}
                                    {!editingOptId && mediaOpsiFile && !mediaOpsiPreview && (
                                        <span className="file-selected" style={{ marginLeft: 8 }}>✓ {mediaOpsiFile.name}</span>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </Modal>
            )}

            {/* Modal Hapus Semua Soal Hari Ini */}
            {showDeleteDay && (
                <Modal title="Hapus Semua Soal Hari Ini?" onClose={() => setShowDeleteDay(false)}>
                    <p>Semua <strong>{questionList.length} soal</strong> pada <strong>{displayDate}</strong> beserta seluruh opsinya akan dihapus secara permanen.</p>
                    {deleteDayErr && <p className="modal-error" style={{ marginTop: 8 }}>{deleteDayErr}</p>}
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setShowDeleteDay(false)} disabled={deletingDay}>Batal</button>
                        <button className="btn-danger" onClick={handleDeleteDay} disabled={deletingDay}>
                            {deletingDay ? 'Menghapus...' : '🗑 Hapus Semua'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal Duplikat Soal ke Hari Lain */}
            {showDuplicate && (
                <Modal title="Duplikat Soal ke Hari Lain" onClose={() => setShowDuplicate(false)}>
                    <div className="reschedule-info">
                        <span className="reschedule-from-label">Dari</span>
                        <span className="reschedule-from-date">{displayDate}</span>
                    </div>
                    {dupErr && <p className="modal-error">{dupErr}</p>}
                    <div className="form-group">
                        <label className="reschedule-to-label">Salin ke tanggal</label>
                        <input
                            type="date"
                            value={dupDateVal}
                            onChange={(e) => { setDupDateVal(e.target.value); setDupErr('') }}
                            className="reschedule-date-input"
                        />
                        {dupDateVal && (() => {
                            const [y, m, d] = dupDateVal.split('-').map(Number)
                            const jsDay = new Date(y, m - 1, d).getDay()
                            const isWeekend = jsDay === 0 || jsDay === 6
                            return isWeekend
                                ? <p className="reschedule-warn">⚠ Sabtu/Minggu bukan hari belajar.</p>
                                : <p className="reschedule-preview">{formatDisplayDate(dupDateVal)}</p>
                        })()}
                    </div>
                    <p className="reschedule-note">
                        <strong>{questionList.length} soal</strong> akan disalin ke tanggal baru beserta teks opsinya. Media perlu diunggah ulang.
                    </p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setShowDuplicate(false)} disabled={duplicating}>Batal</button>
                        <button className="btn-primary" onClick={handleDuplicate}
                            disabled={duplicating || !dupDateVal || dupDateVal === learningDate}>
                            {duplicating ? 'Menyalin...' : '📋 Duplikat Soal'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal Ubah Tanggal */}
            {showReschedule && (
                <Modal title="Ubah Tanggal Soal" onClose={() => setShowReschedule(false)}>
                    <div className="reschedule-info">
                        <span className="reschedule-from-label">Dari</span>
                        <span className="reschedule-from-date">{displayDate}</span>
                    </div>
                    {rescheduleErr && <p className="modal-error">{rescheduleErr}</p>}
                    <div className="form-group">
                        <label className="reschedule-to-label">Pindah ke tanggal</label>
                        <input
                            type="date"
                            value={newDateVal}
                            onChange={(e) => { setNewDateVal(e.target.value); setRescheduleErr('') }}
                            className="reschedule-date-input"
                        />
                        {newDateVal && (() => {
                            const [y, m, d] = newDateVal.split('-').map(Number)
                            const jsDay = new Date(y, m - 1, d).getDay()
                            const isWeekend = jsDay === 0 || jsDay === 6
                            return isWeekend
                                ? <p className="reschedule-warn">⚠ Sabtu/Minggu bukan hari belajar.</p>
                                : <p className="reschedule-preview">{formatDisplayDate(newDateVal)}</p>
                        })()}
                    </div>
                    <p className="reschedule-note">
                        Semua <strong>{questionList.length} soal</strong> pada tanggal ini akan dipindahkan ke tanggal baru.
                    </p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setShowReschedule(false)} disabled={rescheduling}>Batal</button>
                        <button className="btn-primary" onClick={handleReschedule}
                            disabled={rescheduling || !newDateVal || newDateVal === learningDate}>
                            {rescheduling ? 'Memindahkan...' : '📅 Pindah Tanggal'}
                        </button>
                    </div>
                </Modal>
            )}
        </AdminLayout>
    )

}

export default SoalQuestionsPage
