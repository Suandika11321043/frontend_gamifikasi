import { useState, useEffect, useCallback } from 'react'
import { Search, X, Eye, Pencil, Trash2, FolderPlus } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import Modal from '../../components/common/Modal'
import '../../styles/common.css'
import '../../pages/admin/DashboardPage.css'
import './ManajemenTemaPage.css'
import { apiFetch } from '../../utils/apiFetch'

const emptyForm = { nameTopic: '', description: '' }


import TopicIcon from '../../components/common/TopicIcon'

function ManajemenTemaPage() {
    const [temaList, setTemaList] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [search, setSearch] = useState('')

    const [form, setForm] = useState(emptyForm)
    const [iconFile, setIconFile] = useState(null)
    const [iconPreview, setIconPreview] = useState(null)
    const [editId, setEditId] = useState(null)
    const [showModal, setShowModal] = useState(false)

    const [detailTema, setDetailTema] = useState(null)
    const [deleteId, setDeleteId] = useState(null)

    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    const fetchTema = useCallback(async () => {
        setLoading(true)
        setFetchError('')
        try {
            const data = await apiFetch('/topics')
            setTemaList(Array.isArray(data) ? data : [])
        } catch (err) {
            setFetchError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchTema() }, [fetchTema])

    const filtered = temaList.filter((t) =>
        (t.nameTopic ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (t.description ?? '').toLowerCase().includes(search.toLowerCase())
    )

    const openAdd = () => {
        setForm(emptyForm)
        setIconFile(null)
        setIconPreview(null)
        setEditId(null)
        setError('')
        setShowModal(true)
    }

    const openEdit = (tema) => {
        setForm({
            nameTopic: tema.nameTopic ?? '',
            description: tema.description ?? '',
        })
        setIconFile(null)
        setIconPreview(tema.icon ?? null)
        setEditId(tema.id)
        setError('')
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setError('')
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleIconChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setIconFile(file)
        setIconPreview(URL.createObjectURL(file))
    }

    const handleSave = async () => {
        if (!form.nameTopic.trim()) {
            setError('Nama tema wajib diisi.')
            return
        }
        setSaving(true)
        setError('')
        try {
            const fd = new FormData()
            fd.append('nameTopic', form.nameTopic)
            fd.append('description', form.description)
            if (iconFile) fd.append('icon', iconFile)

            if (editId !== null) {
                await apiFetch(`/topics/${editId}`, { method: 'PUT', body: fd })
            } else {
                await apiFetch('/topics', { method: 'POST', body: fd })
            }
            setShowModal(false)
            fetchTema()
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        try {
            await apiFetch(`/topics/${deleteId}`, { method: 'DELETE' })
            setDeleteId(null)
            fetchTema()
        } catch (err) {
            setError(err.message)
            setDeleteId(null)
        }
    }

    return (
        <AdminLayout activePath="/admin/tema">
            <header className="dashboard-header">
                <div>
                    <h1>Manajemen Tema</h1>
                    <p className="page-subtitle">{temaList.length} tema tersedia</p>
                </div>
                <button className="btn-primary" onClick={openAdd}>
                    <FolderPlus size={16} />
                    Tambah Tema
                </button>
            </header>

            <div className="page-toolbar">
                <div className="search-wrapper">
                    <span className="search-icon"><Search size={15} /></span>
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Cari nama atau deskripsi tema..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Cari tema"
                    />
                    {search && (
                        <button className="search-clear" onClick={() => setSearch('')} title="Hapus pencarian">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <span className="count-badge">{filtered.length} dari {temaList.length} tema</span>
            </div>

            {fetchError && <p className="modal-error">{fetchError}</p>}

            {loading ? (
                <p className="tema-loading">Memuat data...</p>
            ) : filtered.length === 0 ? (
                <div className="tema-empty">
                    <span className="tema-empty-icon">📂</span>
                    <p>Belum ada tema. Klik <strong>+ Tambah Tema</strong> untuk memulai.</p>
                </div>
            ) : (
                <div className="tema-grid">
                    {filtered.map((tema) => (
                        <div key={tema.id} className="tema-card">
                            <div className="tema-card-icon-wrap">
                                <TopicIcon icon={tema.icon} name={tema.nameTopic} size="lg" />
                            </div>
                            <div className="tema-card-body">
                                <h3 className="tema-card-name">{tema.nameTopic}</h3>
                                <p className="tema-card-desc">
                                    {tema.description || <span className="tema-no-desc">—</span>}
                                </p>
                            </div>
                            <div className="tema-card-actions">
                                <button className="btn-icon btn-icon-detail" onClick={() => setDetailTema(tema)} title="Detail tema">
                                    <Eye size={15} />
                                </button>
                                <button className="btn-icon btn-icon-edit" onClick={() => openEdit(tema)} title="Edit tema">
                                    <Pencil size={15} />
                                </button>
                                <button className="btn-icon btn-icon-delete" onClick={() => setDeleteId(tema.id)} title="Hapus tema">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Tambah / Edit */}
            {showModal && (
                <Modal
                    title={editId !== null ? 'Edit Tema' : 'Tambah Tema'}
                    onClose={closeModal}
                >
                    {error && <p className="modal-error">{error}</p>}

                    <div className="form-group">
                        <label>Nama Tema</label>
                        <input
                            name="nameTopic"
                            value={form.nameTopic}
                            onChange={handleChange}
                            placeholder="contoh: Pahlawan"
                        />
                    </div>
                    <div className="form-group">
                        <label>Deskripsi</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Deskripsi singkat tentang tema ini..."
                            rows={3}
                            className="form-textarea"
                        />
                    </div>
                    <div className="form-group">
                        <label>Ikon Tema</label>
                        {iconPreview && (
                            <div className="icon-preview-wrap">
                                <TopicIcon icon={iconPreview} name={form.nameTopic || '?'} size="md" />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleIconChange}
                            className="input-file"
                        />
                    </div>

                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={closeModal} disabled={saving}>
                            Batal
                        </button>
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal Detail Tema */}
            {detailTema && (
                <Modal
                    title="Detail Tema"
                    className="modal-detail"
                    onClose={() => setDetailTema(null)}
                >
                    <div className="detail-icon-wrap">
                        <TopicIcon icon={detailTema.icon} name={detailTema.nameTopic} size="xl" />
                    </div>
                    <div className="detail-grid">
                        <span className="detail-label">Nama Tema</span>
                        <span className="detail-value">{detailTema.nameTopic}</span>
                        <span className="detail-label">Deskripsi</span>
                        <span className="detail-value">
                            {detailTema.description || <span style={{ color: '#9ca3af' }}>—</span>}
                        </span>
                    </div>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => { setDetailTema(null); openEdit(detailTema) }}>
                            Edit
                        </button>
                        <button className="btn-primary" onClick={() => setDetailTema(null)}>
                            Tutup
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal Konfirmasi Hapus */}
            {deleteId !== null && (
                <Modal
                    title="Hapus Tema?"
                    className="modal-confirm"
                    onClose={() => setDeleteId(null)}
                >
                    <p>Tema ini akan dihapus secara permanen.</p>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setDeleteId(null)}>
                            Batal
                        </button>
                        <button className="btn-danger" onClick={handleDelete}>
                            Hapus
                        </button>
                    </div>
                </Modal>
            )}
        </AdminLayout>
    )
}

export default ManajemenTemaPage
