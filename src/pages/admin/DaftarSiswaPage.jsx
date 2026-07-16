import { useState, useEffect, useCallback } from 'react'
import { Search, X, Eye, Pencil, Trash2, UserPlus, User, Users } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import AvatarImg from '../../components/common/AvatarImg'
import GeneratedAvatar from '../../components/common/GeneratedAvatar'
import Modal from '../../components/common/Modal'
import PoinIcon from '../../components/common/PoinIcon'
import '../../styles/common.css'
import '../../pages/admin/DashboardPage.css'
import './DaftarSiswaPage.css'
import { apiFetch, getErrorMessage, unwrapList } from '../../utils/apiFetch'
import {
    BOY_AVATAR,
    GIRL_AVATAR,
    getAvatarByGender,
    normalizeAvatarKey,
    parseAvatarKey,
} from '../../utils/avatarPresets'

const emptyForm = { name: '', group: '', gender: 'boy', avatarKey: BOY_AVATAR.id }

function DaftarSiswaPage() {
    const [siswaList, setSiswaList] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [search, setSearch] = useState('')
    const [form, setForm] = useState(emptyForm)
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
            setFetchError(getErrorMessage(err, 'Gagal memuat daftar murid. Silakan coba lagi.'))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchSiswa() }, [fetchSiswa])

    const filtered = siswaList.filter((s) =>
        (s.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (s.group ?? '').toLowerCase().includes(search.toLowerCase())
    )

    const openAdd = () => {
        setForm(emptyForm)
        setEditId(null)
        setError('')
        setShowModal(true)
    }

    const openEdit = (siswa) => {
        const parsed = parseAvatarKey(siswa.avatar)
        const gender = parsed?.gender ?? 'boy'
        const avatarKey = normalizeAvatarKey(siswa.avatar) ?? getAvatarByGender(gender).id

        setForm({
            name: siswa.name ?? '',
            group: siswa.group ?? '',
            gender,
            avatarKey,
        })
        setEditId(siswa.id)
        setError('')
        setShowModal(true)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleGenderChange = (gender) => {
        setForm((prev) => ({
            ...prev,
            gender,
            avatarKey: getAvatarByGender(gender).id,
        }))
    }

    const handleSave = async () => {
        const name = form.name.trim()
        const group = form.group.trim()
        if (!name || !group) {
            setError('Nama dan kelompok wajib diisi.')
            return
        }
        if (!form.avatarKey) {
            setError('Pilih avatar murid terlebih dahulu.')
            return
        }
        setSaving(true)
        setError('')
        try {
            const fd = new FormData()
            fd.append('name', name)
            fd.append('group', group)
            fd.append('avatarKey', form.avatarKey)

            if (editId) {
                await apiFetch(`/students/${editId}`, { method: 'PUT', body: fd })
            } else {
                await apiFetch('/students', { method: 'POST', body: fd })
            }
            setShowModal(false)
            fetchSiswa()
        } catch (err) {
            setError(getErrorMessage(err, 'Gagal menyimpan data murid. Silakan coba lagi.'))
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
    }

    const isEditing = editId !== null
    const modalTitle = isEditing ? 'Edit Data Murid' : 'Tambah Murid Baru'
    let saveLabel = 'Tambah Murid'
    if (saving) { saveLabel = 'Menyimpan...' }
    else if (isEditing) { saveLabel = 'Simpan Perubahan' }

    const avatarOptions = [BOY_AVATAR, GIRL_AVATAR]

    return (
        <AdminLayout activePath="/admin/siswa">
            <header className="dashboard-header">
                <div>
                    <h1>Daftar Murid</h1>
                    <p className="page-subtitle">{siswaList.length} murid terdaftar</p>
                </div>
                <button className="btn-primary" onClick={openAdd}>
                    <UserPlus size={16} />
                    Tambah Murid
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
                        aria-label="Cari murid"
                    />
                    {search && (
                        <button className="search-clear" onClick={() => setSearch('')} title="Hapus pencarian">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <span className="count-badge">{filtered.length} dari {siswaList.length} murid</span>
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
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="empty-row">Memuat data...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={5} className="empty-row">Tidak ada murid ditemukan.</td></tr>
                        ) : (
                            filtered.map((siswa, idx) => (
                                <tr key={siswa.id}>
                                    <td>{idx + 1}</td>
                                    <td>
                                        <AvatarImg avatar={siswa.avatar} name={siswa.name} size="md" />
                                    </td>
                                    <td>{siswa.name}</td>
                                    <td>{siswa.group}</td>
                                    <td>
                                        <div className="action-cell">
                                            <button className="btn-icon btn-icon-detail" onClick={() => setDetailSiswa(siswa)} title="Detail murid">
                                                <Eye size={15} />
                                            </button>
                                            <button className="btn-icon btn-icon-edit" onClick={() => openEdit(siswa)} title="Edit murid">
                                                <Pencil size={15} />
                                            </button>
                                            <button className="btn-icon btn-icon-delete" onClick={() => setDeleteId(siswa.id)} title="Hapus murid">
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

            {showModal && (
                <Modal
                    title={modalTitle}
                    onClose={closeModal}
                >
                    {error && <p className="modal-error">{error}</p>}

                    <div className="siswa-form-fields">
                        <div className="form-group">
                            <label>
                                <User size={13} className="field-icon" />
                                Nama Murid
                            </label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Masukkan nama lengkap murid"
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

                    <div className="siswa-avatar-picker">
                        <p className="avatar-picker-label">Pilih Avatar (Jenis Kelamin)</p>
                        <p className="avatar-upload-hint">Nama murid akan muncul di papan nama avatar</p>

                        <div className="avatar-options-grid avatar-options-grid--gender">
                            {avatarOptions.map((opt) => {
                                const gender = opt.id === GIRL_AVATAR.id ? 'girl' : 'boy'
                                const selected = form.gender === gender
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        className={`avatar-option-btn${selected ? ' is-selected' : ''}`}
                                        onClick={() => handleGenderChange(gender)}
                                        title={opt.label}
                                        aria-label={`Pilih avatar ${opt.label}`}
                                        aria-pressed={selected}
                                    >
                                        <GeneratedAvatar
                                            avatarKey={opt.id}
                                            name={form.name}
                                            size="lg"
                                            selected={selected}
                                        />
                                        <span className="avatar-option-label">{opt.label}</span>
                                    </button>
                                )
                            })}
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

            {detailSiswa && (
                <Modal
                    title="Detail Murid"
                    className="modal-detail"
                    onClose={() => setDetailSiswa(null)}
                >
                    <div className="detail-avatar-wrap">
                        <AvatarImg avatar={detailSiswa.avatar} name={detailSiswa.name} size="xl" />
                    </div>
                    <div className="detail-grid">
                        <span className="detail-label">Nama</span>
                        <span className="detail-value">{detailSiswa.name}</span>
                        <span className="detail-label">Kelompok</span>
                        <span className="detail-value">{detailSiswa.group}</span>
                        <span className="detail-label">Total Poin</span>
                        <span className="detail-value">
                            <span className="poin-badge">
                                <PoinIcon size={22} />
                                {detailSiswa.totalEarnedScore ?? 0}
                                <span className="poin-badge__unit">poin</span>
                            </span>
                        </span>
                    </div>
                    <div className="modal-actions">
                        <button className="btn-primary" onClick={() => setDetailSiswa(null)}>
                            Tutup
                        </button>
                    </div>
                </Modal>
            )}

            {deleteId !== null && (
                <Modal
                    title="Hapus Murid?"
                    className="modal-confirm"
                    onClose={() => { setDeleteId(null); setDeleteError('') }}
                >
                    <p>Data murid ini akan dihapus secara permanen.</p>
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
