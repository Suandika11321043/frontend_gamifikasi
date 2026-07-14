import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, Eye, Pencil, Trash2, UserPlus, Camera, User, Users } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import AvatarImg from '../../components/common/AvatarImg'
import Modal from '../../components/common/Modal'
import '../../styles/common.css'
import '../../pages/admin/DashboardPage.css'
import './DaftarSiswaPage.css'
import { apiFetch, getErrorMessage, unwrapList } from '../../utils/apiFetch'
import { validateImageFile } from '../../utils/validateFile'

const emptyForm = { name: '', group: '' }

function DaftarSiswaPage() {
    const [siswaList, setSiswaList] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [search, setSearch] = useState('')
    const [form, setForm] = useState(emptyForm)
    const [avatarFile, setAvatarFile] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)
    const avatarInputRef = useRef(null)
    const [editId, setEditId] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [detailSiswa, setDetailSiswa] = useState(null)
    const [deleteId, setDeleteId] = useState(null)
    const [error, setError] = useState('')
    const [pageError, setPageError] = useState('')
    const [deleteError, setDeleteError] = useState('')
    const [deleting, setDeleting] = useState(false)
    const [saving, setSaving] = useState(false)

    const fetchSiswa = useCallback(async () => {
        setLoading(true)
        setFetchError('')
        try {
            const data = await apiFetch('/students')
            setSiswaList(unwrapList(data))
        } catch (err) {
            setFetchError(getErrorMessage(err, 'Gagal memuat daftar siswa. Silakan coba lagi.'))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchSiswa() }, [fetchSiswa])

    const filtered = siswaList.filter((s) =>
        (s.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (s.group ?? '').toLowerCase().includes(search.toLowerCase())
    )

    const revokeAvatarPreview = useCallback((preview) => {
        if (preview?.startsWith('blob:')) {
            URL.revokeObjectURL(preview)
        }
    }, [])

    const openAdd = () => {
        setForm(emptyForm)
        setAvatarFile(null)
        setAvatarPreview((prev) => {
            revokeAvatarPreview(prev)
            return null
        })
        setEditId(null)
        setError('')
        setShowModal(true)
    }

    const openEdit = (siswa) => {
        setForm({
            name: siswa.name ?? '',
            group: siswa.group ?? '',
        })
        setAvatarFile(null)
        setAvatarPreview((prev) => {
            revokeAvatarPreview(prev)
            return siswa.avatar ?? null
        })
        setEditId(siswa.id)
        setError('')
        setShowModal(true)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleAvatarChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const fileErr = validateImageFile(file)
        if (fileErr) {
            setError(fileErr)
            e.target.value = ''
            return
        }
        setError('')
        setAvatarFile(file)
        setAvatarPreview((prev) => {
            revokeAvatarPreview(prev)
            return URL.createObjectURL(file)
        })
    }

    const handleSave = async () => {
        const name = form.name.trim()
        const group = form.group.trim()
        if (!name || !group) {
            setError('Nama dan kelompok wajib diisi.')
            return
        }
        setSaving(true)
        setError('')
        try {
            const fd = new FormData()
            fd.append('name', name)
            fd.append('group', group)
            if (avatarFile) fd.append('avatar', avatarFile)

            if (editId) {
                await apiFetch(`/students/${editId}`, { method: 'PUT', body: fd })
            } else {
                await apiFetch('/students', { method: 'POST', body: fd })
            }
            setAvatarPreview((prev) => {
                revokeAvatarPreview(prev)
                return null
            })
            setAvatarFile(null)
            setShowModal(false)
            fetchSiswa()
        } catch (err) {
            setError(getErrorMessage(err, 'Gagal menyimpan data siswa. Silakan coba lagi.'))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        setDeleteError('')
        try {
            await apiFetch(`/students/${deleteId}`, { method: 'DELETE' })
            setDeleteId(null)
            setPageError('')
            fetchSiswa()
        } catch (err) {
            setDeleteError(err.message)
        } finally {
            setDeleting(false)
        }
    }

    const closeModal = () => {
        setShowModal(false)
        setError('')
        setAvatarFile(null)
        setAvatarPreview((prev) => {
            revokeAvatarPreview(prev)
            return null
        })
    }

    const isEditing = editId !== null
    const modalTitle = isEditing ? 'Edit Data Siswa' : 'Tambah Siswa Baru'
    let saveLabel = 'Tambah Siswa'
    if (saving) { saveLabel = 'Menyimpan...' }
    else if (isEditing) { saveLabel = 'Simpan Perubahan' }
    const hintLabel = avatarPreview ? 'mengubah' : 'menambahkan'

    return (
        <AdminLayout activePath="/admin/siswa">
            <header className="dashboard-header">
                <div>
                    <h1>Daftar Siswa</h1>
                    <p className="page-subtitle">{siswaList.length} siswa terdaftar</p>
                </div>
                <button className="btn-primary" onClick={openAdd}>
                    <UserPlus size={16} />
                    Tambah Siswa
                </button>
            </header>

            <div className="page-toolbar">
                <div className="search-wrapper">
                    <span className="search-icon"><Search size={15} /></span>
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Cari nama atau kelompok..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Cari siswa"
                    />
                    {search && (
                        <button className="search-clear" onClick={() => setSearch('')} title="Hapus pencarian">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <span className="count-badge">{filtered.length} dari {siswaList.length} siswa</span>
            </div>

            {fetchError && <p className="modal-error">{fetchError}</p>}
            {pageError && <p className="modal-error">{pageError}</p>}

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Avatar</th>
                            <th>Nama</th>
                            <th>Kelompok</th>
                            <th>Total Poin</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="empty-row">Memuat data...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} className="empty-row">Tidak ada siswa ditemukan.</td></tr>
                        ) : (
                            filtered.map((siswa, idx) => (
                                <tr key={siswa.id}>
                                    <td>{idx + 1}</td>
                                    <td>
                                        <AvatarImg avatar={siswa.avatar} name={siswa.name} />
                                    </td>
                                    <td>{siswa.name}</td>
                                    <td>{siswa.group}</td>
                                    <td>
                                        <span className="poin-badge">{siswa.totalEarnedScore ?? 0}</span>
                                    </td>
                                    <td>
                                        <div className="action-cell">
                                            <button className="btn-icon btn-icon-detail" onClick={() => setDetailSiswa(siswa)} title="Detail siswa">
                                                <Eye size={15} />
                                            </button>
                                            <button className="btn-icon btn-icon-edit" onClick={() => openEdit(siswa)} title="Edit siswa">
                                                <Pencil size={15} />
                                            </button>
                                            <button className="btn-icon btn-icon-delete" onClick={() => setDeleteId(siswa.id)} title="Hapus siswa">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Tambah / Edit */}
            {showModal && (
                <Modal
                    title={modalTitle}
                    onClose={closeModal}
                >
                    {error && <p className="modal-error">{error}</p>}

                    {/* Avatar upload */}
                    <div className="siswa-avatar-upload">
                        <button
                            type="button"
                            className="avatar-upload-trigger"
                            onClick={() => avatarInputRef.current?.click()}
                            title="Klik untuk ubah foto"
                        >
                            {avatarPreview
                                ? <AvatarImg avatar={avatarPreview} name={form.name || '?'} size="lg" />
                                : <div className="avatar-upload-empty">
                                    <Camera size={22} />
                                    <span>Upload Foto</span>
                                </div>
                            }
                            <div className="avatar-upload-overlay">
                                <Camera size={16} />
                            </div>
                        </button>
                        <p className="avatar-upload-hint">Klik untuk {hintLabel} foto profil</p>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Fields */}
                    <div className="siswa-form-fields">
                        <div className="form-group">
                            <label>
                                <User size={13} className="field-icon" />
                                Nama Siswa
                            </label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Masukkan nama lengkap siswa"
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label>
                                <Users size={13} className="field-icon" />
                                Kelompok
                            </label>
                            <input
                                name="group"
                                value={form.group}
                                onChange={handleChange}
                                placeholder="contoh: TK A"
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={closeModal} disabled={saving}>
                            Batal
                        </button>
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            {saveLabel}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal Detail Siswa */}
            {detailSiswa && (
                <Modal
                    title="Detail Siswa"
                    className="modal-detail"
                    onClose={() => setDetailSiswa(null)}
                >
                    <div className="detail-avatar-wrap">
                        <AvatarImg avatar={detailSiswa.avatar} name={detailSiswa.name} size="lg" />
                    </div>
                    <div className="detail-grid">
                        <span className="detail-label">Nama</span>
                        <span className="detail-value">{detailSiswa.name}</span>
                        <span className="detail-label">Kelompok</span>
                        <span className="detail-value">{detailSiswa.group}</span>
                        <span className="detail-label">Total Poin</span>
                        <span className="detail-value">
                            <span className="poin-badge">{detailSiswa.totalEarnedScore ?? 0}</span>
                        </span>
                    </div>
                    <div className="modal-actions">
                        <button className="btn-primary" onClick={() => setDetailSiswa(null)}>
                            Tutup
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal Konfirmasi Hapus */}
            {deleteId !== null && (
                <Modal
                    title="Hapus Siswa?"
                    className="modal-confirm"
                    onClose={() => { setDeleteId(null); setDeleteError('') }}
                >
                    <p>Data siswa ini akan dihapus secara permanen.</p>
                    {deleteError && <p className="modal-error">{deleteError}</p>}
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => { setDeleteId(null); setDeleteError('') }}>
                            Batal
                        </button>
                        <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                            {deleting ? 'Menghapus...' : 'Hapus'}
                        </button>
                    </div>
                </Modal>
            )}
        </AdminLayout>
    )
}

export default DaftarSiswaPage
