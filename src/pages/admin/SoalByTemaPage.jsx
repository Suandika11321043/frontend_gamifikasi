import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import Modal from '../../components/Modal'
import '../../components/common.css'
import '../../pages/admin/DashboardPage.css'
import './ManajemenTemaPage.css'
import './ManajemenSoalPage.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

const QUESTION_TYPES = [
    { value: 'QUIZ', label: 'Quiz', color: '#1d4ed8', bg: '#eff6ff' },
    { value: 'MATCH', label: 'Pasangkan', color: '#166534', bg: '#f0fdf4' },
    { value: 'SORTING', label: 'Urutkan', color: '#92400e', bg: '#fffbeb' },
    { value: 'DRAG_AND_DROP', label: 'Drag & Drop', color: '#6b21a8', bg: '#faf5ff' },
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

const emptyQForm = { questionType: 'QUIZ', contentInstruction: '' }
const emptyOptForm = { teksOpsi: '', kunciJawaban: false, urutanBenar: '', tipeItem: '' }
const emptyRelForm = { opsiPertanyaanId: '', opsiJawabanId: '' }

async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('token')
    const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    }
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
    if (res.status === 204) return null
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan.')
    return data
}

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

    const filtered = questionList.filter((q) => {
        const matchSearch = (q.contentInstruction ?? '').toLowerCase().includes(search.toLowerCase())
        return matchSearch && (filterType === '' || q.questionType === filterType)
    })

    const openAdd = () => {
        setForm(emptyQForm); setImageFile(null); setImagePreview(null)
        setAudioFile(null); setExistingAudio(null); setEditId(null); setError(''); setShowModal(true)
    }

    const openEdit = (q) => {
        setForm({ questionType: q.questionType ?? 'QUIZ', contentInstruction: q.contentInstruction ?? '' })
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
        setShowOpsiModal(true); fetchOptions(q.id)
        if (NEEDS_RELATION.includes(q.questionType)) fetchRelations(q.id)
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

    const pertanyaanOpts = optionsList.filter((o) => o.tipeItem === 'PERTANYAAN')
    const jawabanOpts = optionsList.filter((o) => o.tipeItem === 'JAWABAN')
    const getOptLabel = (id) => { const o = optionsList.find((x) => x.id === id); return o ? o.teksOpsi : `#${id}` }

    const isRelation = activeQuestion && NEEDS_RELATION.includes(activeQuestion.questionType)
    const tipeItemOptions = activeQuestion ? (TIPE_ITEM_OPTIONS[activeQuestion.questionType] ?? []) : []

    return (
        <div className="dashboard-wrapper">
            <Sidebar activePath="/admin/soal" />

            <main className="dashboard-main">
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
                    <button className="btn-primary" onClick={openAdd}>+ Tambah Soal</button>
                </header>

                <div className="soal-toolbar">
                    <input className="tema-search" type="text" placeholder="Cari instruksi soal..."
                        value={search} onChange={(e) => setSearch(e.target.value)} />
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
                            <tr><th>No</th><th>Tipe</th><th>Instruksi</th><th>Media</th><th>Aksi</th></tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="empty-row">Memuat soal...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="empty-row">Belum ada soal untuk tema ini.</td></tr>
                            ) : filtered.map((q, idx) => (
                                <tr key={q.id}>
                                    <td>{idx + 1}</td>
                                    <td><TypeBadge type={q.questionType} /></td>
                                    <td className="soal-instruction-cell">{q.contentInstruction}</td>
                                    <td>
                                        <div className="soal-media-icons">
                                            {q.contentImage && <span className="media-badge" title="Gambar">🖼</span>}
                                            {q.contentAudio && <span className="media-badge" title="Audio">🔊</span>}
                                            {!q.contentImage && !q.contentAudio && <span className="no-media">—</span>}
                                        </div>
                                    </td>
                                    <td className="action-cell">
                                        <button className="btn-detail" onClick={() => openOpsiModal(q)}>Opsi</button>
                                        <button className="btn-edit" onClick={() => openEdit(q)}>Edit</button>
                                        <button className="btn-delete" onClick={() => setDeleteId(q.id)}>Hapus</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

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
                </Modal>
            )}
        </div>
    )
}

export default SoalByTemaPage
