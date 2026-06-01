import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, X, Eye, Pencil, Trash2, Plus, Clock } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import Modal from '../../components/common/Modal'
import '../../styles/common.css'
import '../../pages/admin/DashboardPage.css'
import './ManajemenTemaPage.css'
import './ManajemenSoalPage.css'
import { apiFetch } from '../../utils/apiFetch'

const QUESTION_TYPES = [
    { value: 'QUIZ', label: 'Quiz', color: '#1d4ed8', bg: '#eff6ff' },
    { value: 'MATCH', label: 'Pasangkan', color: '#166534', bg: '#f0fdf4' },
    { value: 'SORTING', label: 'Urutkan', color: '#92400e', bg: '#fffbeb' },
    { value: 'DRAG_AND_DROP', label: 'Drag & Drop', color: '#6b21a8', bg: '#faf5ff' },
    { value: 'PUZZLE', label: 'Puzzle', color: '#a8a121', bg: '#faf5ff' },
]

const TIPE_ITEM_OPTIONS = {
    MATCH: [
        { value: 'PERTANYAAN', label: 'Pertanyaan (kiri)' },
        { value: 'JAWABAN', label: 'Jawaban (kanan)' },
    ],
    DRAG_AND_DROP: [
        { value: 'PERTANYAAN', label: 'Item Drag' },
        { value: 'JAWABAN', label: 'Drop Zone' },
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
    if (!url) return <span className="no-media">—</span>
    const type = getMediaType(url)
    if (type === 'audio') {
        return (
            <audio controls className="opsi-audio-preview">
                <source src={url} />
            </audio>
        )
    }
    return (
        <a href={url} target="_blank" rel="noreferrer" className="opsi-img-link">
            <img src={url} alt="media" className="opsi-img-thumb" />
        </a>
    )
}

function TypeBadge({ type }) {
    const config = QUESTION_TYPES.find((t) => t.value === type) || { label: type, color: '#374151', bg: '#f3f4f6' }
    return (
        <span className="type-badge" style={{ color: config.color, background: config.bg }}>
            {config.label}
        </span>
    )
}

function SoalByTemaPage() {
    const { topicId } = useParams()
    const navigate = useNavigate()

    const [topic, setTopic] = useState(null)
    const [questionList, setQuestionList] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState('')

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

    const [showOpsiModal, setShowOpsiModal] = useState(false)
    const [activeQuestion, setActiveQuestion] = useState(null)
    const [optionsList, setOptionsList] = useState([])
    const [loadingOptions, setLoadingOptions] = useState(false)
    const [optForm, setOptForm] = useState(emptyOptForm)
    const [editingOptId, setEditingOptId] = useState(null)
    const [mediaOpsiFile, setMediaOpsiFile] = useState(null)
    const [optionError, setOptionError] = useState('')
    const [savingOpt, setSavingOpt] = useState(false)

    const [relationsList, setRelationsList] = useState([])
    const [loadingRel, setLoadingRel] = useState(false)
    const [relForm, setRelForm] = useState(emptyRelForm)
    const [savingRel, setSavingRel] = useState(false)
    const [relError, setRelError] = useState('')

    const [puzzleData, setPuzzleData] = useState(null)
    const [puzzleForm, setPuzzleForm] = useState({ gridRows: '3', gridCols: '3' })
    const [puzzleImageFile, setPuzzleImageFile] = useState(null)
    const [savingPuzzle, setSavingPuzzle] = useState(false)
    const [puzzleError, setPuzzleError] = useState('')

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

    const fetchQuestions = useCallback(async () => {
        setLoading(true)
        setFetchError('')
        try {
            const data = await apiFetch(`/questions?topicId=${topicId}`)
            const list = Array.isArray(data) ? data : (data?.data ?? [])
            setQuestionList(list.filter((q) => String(q.topicId) === String(topicId)))
        } catch (err) {
            setFetchError(err.message)
        } finally {
            setLoading(false)
        }
    }, [topicId])

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
        setForm({ questionType: q.questionType ?? 'QUIZ', contentInstruction: q.contentInstruction ?? '', timeLimitMinutes: q.timeLimitMinutes ? String(q.timeLimitMinutes) : '', scorePoint: q.scorePoint ? String(q.scorePoint) : '' })
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
            fd.append('topicId', topicId)
            fd.append('questionType', form.questionType)
            fd.append('contentInstruction', form.contentInstruction)
            if (form.timeLimitMinutes && Number(form.timeLimitMinutes) > 0) {
                fd.append('timeLimitMinutes', form.timeLimitMinutes)
            }
            if (form.scorePoint && Number(form.scorePoint) > 0) {
                fd.append('scorePoint', form.scorePoint)
            }
            if (imageFile) fd.append('contentImage', imageFile)
            if (audioFile) fd.append('contentAudio', audioFile)
            if (editId !== null) {
                await apiFetch(`/questions/${editId}`, { method: 'PUT', body: fd })
            } else {
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
        if (q.questionType === 'PUZZLE') {
            fetchPuzzle(q.id)
        } else {
            fetchOptions(q.id)
            if (NEEDS_RELATION.includes(q.questionType)) fetchRelations(q.id)
        }
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
    }

    const cancelEditOption = () => { setOptForm(emptyOptForm); setEditingOptId(null); setMediaOpsiFile(null) }

    const handleSaveOption = async () => {
        if (!optForm.teksOpsi.trim()) { setOptionError('Teks opsi wajib diisi.'); return }
        setSavingOpt(true); setOptionError('')
        try {
            const fd = new FormData()
            fd.append('questionId', activeQuestion.id)
            fd.append('teksOpsi', optForm.teksOpsi)
            if (mediaOpsiFile) fd.append('mediaOpsi', mediaOpsiFile)
            const qType = activeQuestion.questionType
            if (qType === 'QUIZ') {
                fd.append('kunciJawaban', optForm.kunciJawaban ? 'true' : 'false')
            } else if (qType === 'SORTING') {
                if (optForm.urutanBenar !== '') fd.append('urutanBenar', optForm.urutanBenar)
            } else if (NEEDS_RELATION.includes(qType)) {
                if (optForm.tipeItem) fd.append('tipeItem', optForm.tipeItem)
            }
            if (editingOptId !== null) {
                await apiFetch(`/question-options/${editingOptId}`, { method: 'PUT', body: fd })
            } else {
                await apiFetch('/question-options', { method: 'POST', body: fd })
            }
            setOptForm(emptyOptForm); setEditingOptId(null); setMediaOpsiFile(null)
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
            if (puzzleData?.id) {
                await apiFetch(`/jigsaw/puzzles/${puzzleData.id}`, { method: 'PUT', body: fd })
            } else {
                fd.append('questionId', activeQuestion.id)
                await apiFetch('/jigsaw/puzzles', { method: 'POST', body: fd })
            }
            fetchPuzzle(activeQuestion.id)
            setPuzzleImageFile(null)
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
            if (editingPieceId) {
                await apiFetch(`/jigsaw/pieces/${editingPieceId}`, { method: 'PUT', body: fd })
            } else {
                await apiFetch(`/jigsaw/puzzles/${puzzleData.id}/pieces`, { method: 'POST', body: fd })
            }
            setPieceForm(emptyPieceForm); setPieceImageFile(null); setEditingPieceId(null)
            fetchPieces(puzzleData.id)
        } catch (err) { setPieceError(err.message) }
        finally { setSavingPiece(false) }
    }

    const handleDeletePiece = async (pieceId) => {
        try {
            await apiFetch(`/jigsaw/pieces/${pieceId}`, { method: 'DELETE' })
            fetchPieces(puzzleData.id)
        } catch (err) { setPieceError(err.message) }
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

    return (
        <AdminLayout activePath="/admin/soal">
            <nav className="soal-breadcrumb">
                <button className="btn-back" onClick={() => navigate('/admin/soal')}>← Manajemen Soal</button>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{topic?.nameTopic ?? '...'}</span>
            </nav>

            <header className="dashboard-header">
                <div className="soal-header-title">
                    <h1>Soal — {topic?.nameTopic ?? '...'}</h1>
                    <span className="soal-count-badge">{questionList.length} soal</span>
                </div>
                <button className="btn-primary" onClick={openAdd}>
                    <Plus size={16} />
                    Tambah Soal
                </button>
            </header>

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
                            <tr><td colSpan={5} className="empty-row">Memuat soal...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} className="empty-row">Belum ada soal untuk tema ini.</td></tr>
                        ) : filtered.map((q, idx) => (
                            <tr key={q.id}>
                                <td>{idx + 1}</td>
                                <td><TypeBadge type={q.questionType} /></td>
                                <td className="soal-instruction-cell">{q.contentInstruction}</td>
                                <td>
                                    {q.timeLimitMinutes
                                        ? <span className="timer-badge"><Clock size={12} /> {q.timeLimitMinutes} mnt</span>
                                        : <span className="no-media">—</span>}
                                </td>
                                <td>
                                    {q.scorePoint
                                        ? <span className="timer-badge" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fbbf24' }}>🏆 {q.scorePoint} poin</span>
                                        : <span className="no-media">—</span>}
                                </td>
                                <td>
                                    <div className="action-cell">
                                        <button className="btn-icon btn-icon-detail" onClick={() => openOpsiModal(q)} title="Kelola opsi"><Eye size={15} /></button>
                                        <button className="btn-icon btn-icon-edit" onClick={() => openEdit(q)} title="Edit soal"><Pencil size={15} /></button>
                                        <button className="btn-icon btn-icon-delete" onClick={() => setDeleteId(q.id)} title="Hapus soal"><Trash2 size={15} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Tambah / Edit Soal */}
            {showModal && (
                <Modal title={editId !== null ? 'Edit Soal' : 'Tambah Soal'} onClose={() => setShowModal(false)}>
                    {error && <p className="modal-error">{error}</p>}
                    <div className="form-group">
                        <label>Tipe Soal</label>
                        <select name="questionType" value={form.questionType} onChange={handleQChange} className="form-select">
                            {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Instruksi / Pertanyaan</label>
                        <textarea name="contentInstruction" value={form.contentInstruction} onChange={handleQChange}
                            placeholder="Tuliskan instruksi atau pertanyaan..." rows={3} className="form-textarea" />
                    </div>
                    {form.questionType !== 'PUZZLE' && (
                        <>
                            <div className="form-group">
                                <label>Gambar (opsional)</label>
                                {imagePreview && <img src={imagePreview} alt="preview" className="media-preview-img" />}
                                <input type="file" accept="image/*" className="input-file"
                                    onChange={(e) => { const f = e.target.files[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)) } }} />
                            </div>
                            <div className="form-group">
                                <label>Audio (opsional)</label>
                                {audioFile ? <p className="file-selected">✓ {audioFile.name}</p>
                                    : existingAudio ? <audio controls src={existingAudio} className="audio-preview" /> : null}
                                <input type="file" accept="audio/*" className="input-file"
                                    onChange={(e) => { const f = e.target.files[0]; if (f) setAudioFile(f) }} />
                            </div>
                        </>
                    )}
                    <div className="form-group">
                        <label>Batas Waktu (opsional)</label>
                        <div className="timer-input-row">
                            <Clock size={16} className="timer-input-icon" />
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
                        <small className="form-hint">Kosongkan jika soal tidak memiliki batas waktu</small>
                    </div>
                    <div className="form-group">
                        <label>Poin Soal (opsional)</label>
                        <div className="timer-input-row">
                            <span style={{ fontSize: 16 }}>🏆</span>
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
                        <small className="form-hint">Kosongkan untuk menggunakan poin default sistem</small>
                    </div>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Batal</button>
                        <button className="btn-primary" onClick={handleSaveQuestion} disabled={saving}>
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal Konfirmasi Hapus */}
            {deleteId !== null && (
                <Modal title="Hapus Soal?" className="modal-confirm" onClose={() => setDeleteId(null)}>
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

                    {optionError && <p className="modal-error">{optionError}</p>}

                    {activeQuestion.questionType === 'PUZZLE' ? (
                        /* ── Puzzle Config ── */
                        <div className="puzzle-config-section">
                            {puzzleError && <p className="modal-error">{puzzleError}</p>}

                            {/* Current puzzle info */}
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
                                    {puzzleData.imageUrl && (
                                        <img src={puzzleData.imageUrl} alt="puzzle" className="puzzle-preview-img" />
                                    )}
                                </div>
                            )}

                            {/* Create / Update puzzle form */}
                            <h4 className="opsi-form-title">{puzzleData ? '✏ Update Puzzle' : '+ Buat Puzzle'}</h4>
                            <div className="opsi-form-grid">
                                <div className="form-group">
                                    <label>Jumlah Baris (Grid Rows)</label>
                                    <input type="number" min="2" max="6" value={puzzleForm.gridRows}
                                        onChange={(e) => setPuzzleForm((p) => ({ ...p, gridRows: e.target.value }))}
                                        placeholder="contoh: 3" />
                                    <small className="form-hint">Minimal 2, maksimal 6</small>
                                </div>
                                <div className="form-group">
                                    <label>Jumlah Kolom (Grid Cols)</label>
                                    <input type="number" min="2" max="6" value={puzzleForm.gridCols}
                                        onChange={(e) => setPuzzleForm((p) => ({ ...p, gridCols: e.target.value }))}
                                        placeholder="contoh: 3" />
                                    <small className="form-hint">Minimal 2, maksimal 6</small>
                                </div>
                                <div className="form-group">
                                    <label>Gambar Puzzle {puzzleData ? '(kosongkan untuk tetap pakai gambar lama)' : '(wajib)'}</label>
                                    <input type="file" accept="image/*" className="input-file"
                                        onChange={(e) => setPuzzleImageFile(e.target.files[0] || null)} />
                                    {puzzleImageFile && <span className="file-selected">✓ {puzzleImageFile.name}</span>}
                                </div>
                            </div>
                            <div className="opsi-form-actions">
                                <button className="btn-primary" onClick={handleSavePuzzle} disabled={savingPuzzle}>
                                    {savingPuzzle ? 'Menyimpan...' : puzzleData ? 'Update Puzzle' : 'Buat Puzzle'}
                                </button>
                            </div>

                            {/* Pieces management — only shown once puzzle exists */}
                            {puzzleData?.id && (
                                <div className="rel-section">
                                    <h4 className="opsi-section-label">🧩 Keping Puzzle</h4>
                                    {pieceError && <p className="modal-error">{pieceError}</p>}

                                    {/* Pieces table */}
                                    {loadingPieces ? <p className="tema-loading">Memuat keping...</p>
                                        : piecesList.length === 0 ? <p className="opsi-empty">Belum ada keping. Tambahkan di bawah.</p>
                                            : (
                                                <div className="opsi-table-wrap">
                                                    <table className="opsi-table">
                                                        <thead>
                                                            <tr><th>#</th><th>Index</th><th>Posisi Benar</th><th>Gambar</th><th>Aksi</th></tr>
                                                        </thead>
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
                                                                            : <span className="no-media">—</span>}
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

                                    {/* Add / Edit piece form */}
                                    <div className="opsi-form-section">
                                        <h4 className="opsi-form-title">{editingPieceId ? '✏ Edit Keping' : '+ Tambah Keping'}</h4>
                                        <div className="opsi-form-grid">
                                            <div className="form-group">
                                                <label>Piece Index (urutan keping)</label>
                                                <input type="number" min="0" value={pieceForm.pieceIndex}
                                                    onChange={(e) => setPieceForm((p) => ({ ...p, pieceIndex: e.target.value }))}
                                                    placeholder="contoh: 0" />
                                                <small className="form-hint">Dimulai dari 0</small>
                                            </div>
                                            <div className="form-group">
                                                <label>Correct Position (posisi benar)</label>
                                                <input type="number" min="0" value={pieceForm.correctPosition}
                                                    onChange={(e) => setPieceForm((p) => ({ ...p, correctPosition: e.target.value }))}
                                                    placeholder="contoh: 0" />
                                                <small className="form-hint">Posisi benar keping ini di grid</small>
                                            </div>
                                            <div className="form-group">
                                                <label>Gambar Keping {editingPieceId ? '(kosongkan untuk tetap pakai gambar lama)' : '(wajib)'}</label>
                                                <input type="file" accept="image/*" className="input-file"
                                                    onChange={(e) => setPieceImageFile(e.target.files[0] || null)} />
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
                            {/* Options list */}
                            <div className="opsi-list-section">
                                <h4 className="opsi-section-label">Opsi tersimpan</h4>
                                {loadingOptions ? <p className="tema-loading">Memuat opsi...</p>
                                    : optionsList.length === 0 ? <p className="opsi-empty">Belum ada opsi. Tambahkan di bawah.</p>
                                        : (
                                            <div className="opsi-table-wrap">
                                                <table className="opsi-table">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th><th>Teks Opsi</th>
                                                            {activeQuestion.questionType === 'QUIZ' && <th>Kunci</th>}
                                                            {activeQuestion.questionType === 'SORTING' && <th>Urutan</th>}
                                                            {isRelation && <th>Tipe Item</th>}
                                                            <th>Media</th><th>Aksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {optionsList.map((opt, idx) => (
                                                            <tr key={opt.id} className={editingOptId === opt.id ? 'row-editing' : ''}>
                                                                <td>{idx + 1}</td>
                                                                <td>{opt.teksOpsi}</td>
                                                                {activeQuestion.questionType === 'QUIZ' && (
                                                                    <td>{opt.kunciJawaban
                                                                        ? <span className="answer-chip">✓ Benar</span>
                                                                        : <span className="wrong-chip">✗</span>}
                                                                    </td>
                                                                )}
                                                                {activeQuestion.questionType === 'SORTING' && (
                                                                    <td><span className="answer-chip">{opt.urutanBenar ?? '—'}</span></td>
                                                                )}
                                                                {isRelation && (
                                                                    <td>
                                                                        <span className={`tipe-chip tipe-${(opt.tipeItem ?? '').toLowerCase()}`}>
                                                                            {opt.tipeItem ?? '—'}
                                                                        </span>
                                                                    </td>
                                                                )}
                                                                <td className="opsi-media-cell">
                                                                    <MediaCell url={opt.mediaOpsi} />
                                                                </td>
                                                                <td>
                                                                    <div className="action-cell">
                                                                        <button className="btn-edit" onClick={() => startEditOption(opt)}>Edit</button>
                                                                        <button className="btn-delete" onClick={() => handleDeleteOption(opt.id)}>Hapus</button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                            </div>

                            {/* Add / Edit option form */}
                            <div className="opsi-form-section">
                                <h4 className="opsi-form-title">{editingOptId ? '✏ Edit Opsi' : '+ Tambah Opsi'}</h4>
                                <div className="opsi-form-grid">
                                    <div className="form-group">
                                        <label>Teks Opsi</label>
                                        <input name="teksOpsi" value={optForm.teksOpsi} onChange={handleOptChange} placeholder="contoh: Soekarno" />
                                    </div>
                                    {activeQuestion.questionType === 'QUIZ' && (
                                        <div className="form-group form-group--checkbox">
                                            <label className="checkbox-label">
                                                <input type="checkbox" name="kunciJawaban" checked={optForm.kunciJawaban} onChange={handleOptChange} />
                                                Ini adalah jawaban benar
                                            </label>
                                        </div>
                                    )}
                                    {activeQuestion.questionType === 'SORTING' && (
                                        <div className="form-group">
                                            <label>Urutan yang Benar</label>
                                            <input name="urutanBenar" type="number" min="1" value={optForm.urutanBenar} onChange={handleOptChange} placeholder="contoh: 1" />
                                        </div>
                                    )}
                                    {isRelation && tipeItemOptions.length > 0 && (
                                        <div className="form-group">
                                            <label>Tipe Item</label>
                                            <select name="tipeItem" value={optForm.tipeItem} onChange={handleOptChange} className="form-select">
                                                <option value="">— Pilih tipe —</option>
                                                {tipeItemOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label>Media / Gambar / Suara (opsional)</label>
                                        <input type="file" accept="image/*,audio/*" className="input-file"
                                            onChange={(e) => setMediaOpsiFile(e.target.files[0] || null)} />
                                        {mediaOpsiFile && <span className="file-selected">✓ {mediaOpsiFile.name}</span>}
                                    </div>
                                </div>
                                <div className="opsi-form-actions">
                                    {editingOptId && <button className="btn-secondary" onClick={cancelEditOption}>Batal Edit</button>}
                                    <button className="btn-primary" onClick={handleSaveOption} disabled={savingOpt}>
                                        {savingOpt ? 'Menyimpan...' : editingOptId ? 'Update Opsi' : 'Tambah Opsi'}
                                    </button>
                                </div>
                            </div>

                            {/* Matching Relations */}
                            {isRelation && (
                                <div className="rel-section">
                                    <h4 className="opsi-section-label">
                                        {activeQuestion.questionType === 'MATCH' ? 'Pasangan (Matching)' : 'Pasangan Drag & Drop'}
                                    </h4>
                                    {relError && <p className="modal-error">{relError}</p>}
                                    {loadingRel ? <p className="tema-loading">Memuat pasangan...</p>
                                        : relationsList.length === 0 ? <p className="opsi-empty">Belum ada pasangan.</p>
                                            : (
                                                <div className="opsi-table-wrap">
                                                    <table className="opsi-table">
                                                        <thead>
                                                            <tr><th>#</th><th>Pertanyaan / Drag</th><th>Jawaban / Drop Zone</th><th>Aksi</th></tr>
                                                        </thead>
                                                        <tbody>
                                                            {relationsList.map((rel, idx) => (
                                                                <tr key={rel.id}>
                                                                    <td>{idx + 1}</td>
                                                                    <td>{getOptLabel(rel.opsiPertanyaanId)}</td>
                                                                    <td>{getOptLabel(rel.opsiJawabanId)}</td>
                                                                    <td>
                                                                        <button className="btn-delete" onClick={() => handleDeleteRelation(rel.id)}>Hapus</button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                    <div className="opsi-form-section">
                                        <h4 className="opsi-form-title">+ Tambah Pasangan</h4>
                                        <div className="opsi-form-grid">
                                            <div className="form-group">
                                                <label>Pertanyaan / Item Drag</label>
                                                <select value={relForm.opsiPertanyaanId}
                                                    onChange={(e) => setRelForm((p) => ({ ...p, opsiPertanyaanId: e.target.value }))}
                                                    className="form-select">
                                                    <option value="">— Pilih opsi —</option>
                                                    {pertanyaanOpts.map((o) => <option key={o.id} value={o.id}>{o.teksOpsi}</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Jawaban / Drop Zone</label>
                                                <select value={relForm.opsiJawabanId}
                                                    onChange={(e) => setRelForm((p) => ({ ...p, opsiJawabanId: e.target.value }))}
                                                    className="form-select">
                                                    <option value="">— Pilih opsi —</option>
                                                    {jawabanOpts.map((o) => <option key={o.id} value={o.id}>{o.teksOpsi}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="opsi-form-actions">
                                            <button className="btn-primary" onClick={handleSaveRelation} disabled={savingRel}>
                                                {savingRel ? 'Menyimpan...' : 'Tambah Pasangan'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Modal>
            )}
        </AdminLayout>
    )
}

export default SoalByTemaPage
