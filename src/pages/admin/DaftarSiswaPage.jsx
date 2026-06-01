import { useState, useEffect, useCallback } from 'react'
import { Search, X, Eye, Pencil, Trash2, UserPlus } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import AvatarImg from '../../components/common/AvatarImg'
import Modal from '../../components/common/Modal'
import '../../styles/common.css'
import '../../pages/admin/DashboardPage.css'
import './DaftarSiswaPage.css'
import { apiFetch } from '../../utils/apiFetch'

const emptyForm = { name: '', group: '', totalPoints: '' }

const RANK_LABELS = {
    BEGINNER: 'Pemula',
    INTERMEDIATE: 'Menengah',
    ADVANCED: 'Mahir',
    EXPERT: 'Ahli',
}


function DaftarSiswaPage() {
    const [siswaList, setSiswaList] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [search, setSearch] = useState('')
    const [form, setForm] = useState(emptyForm)
    const [avatarFile, setAvatarFile] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)
    const [editId, setEditId] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [detailSiswa, setDetailSiswa] = useState(null)
    const [deleteId, setDeleteId] = useState(null)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    const fetchSiswa = useCallback(async () => {
        setLoading(true)
        setFetchError('')
        try {
            const data = await apiFetch('/students')
            setSiswaList(Array.isArray(data) ? data : (data.data ?? []))
        } catch (err) {
            setFetchError(err.message)
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
        setAvatarFile(null)
        setAvatarPreview(null)
        setEditId(null)
        setError('')
        setShowModal(true)
    }

    const openEdit = (siswa) => {
        setForm({
            name: siswa.name ?? '',
            group: siswa.group ?? '',
            totalPoints: siswa.totalPoints ?? '',
        })
        setAvatarFile(null)
        setAvatarPreview(siswa.avatar ? `${BASE_URL}/uploads/${siswa.avatar}` : null)
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
        setAvatarFile(file)
        setAvatarPreview(URL.createObjectURL(file))
    }

    const handleSave = async () => {
        if (!form.name.trim() || !form.group.trim()) {
            setError('Nama dan kelompok wajib diisi.')
            return
        }
        setSaving(true)
        setError('')
        try {
            const fd = new FormData()
            fd.append('name', form.name)
            fd.append('group', form.group)
            fd.append('totalPoints', form.totalPoints)
            if (avatarFile) fd.append('avatar', avatarFile)

            if (editId !== null) {
                await apiFetch(`/students/${editId}`, { method: 'PUT', body: fd })
            } else {
                await apiFetch('/students', { method: 'POST', body: fd })
            }
            setShowModal(false)
            fetchSiswa()
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        try {
            await apiFetch(`/students/${deleteId}`, { method: 'DELETE' })
            setDeleteId(null)
            fetchSiswa()
        } catch (err) {
            setError(err.message)
            setDeleteId(null)
        }
    }

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
                    title={editId !== null ? 'Edit Siswa' : 'Tambah Siswa'}
                    onClose={() => setShowModal(false)}
                >
                    {error && <p className="modal-error">{error}</p>}

                    <div className="form-group">
                        <label>Nama</label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="contoh: Tesa"
                        />
                    </div>
                    <div className="form-group">
                        <label>Kelompok</label>
                        <input
                            name="group"
                            value={form.group}
                            onChange={handleChange}
                            placeholder="contoh: TK A"
                        />
                    </div>
                    <div className="form-group">
                        <label>Total Poin</label>
                        <input
                            name="totalPoints"
                            type="number"
                            value={form.totalPoints}
                            onChange={handleChange}
                            placeholder="contoh: 100"
                        />
                    </div>
                    <div className="form-group">
                        <label>Avatar</label>
                        {avatarPreview && (
                            <AvatarImg
                                avatar={avatarPreview}
                                name={form.name || '?'}
                                size="md"
                            />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="input-file"
                        />
                    </div>

                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>
                            Batal
                        </button>
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Menyimpan...' : 'Simpan'}
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
                    onClose={() => setDeleteId(null)}
                >
                    <p>Data siswa ini akan dihapus secara permanen.</p>
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

export default DaftarSiswaPage
