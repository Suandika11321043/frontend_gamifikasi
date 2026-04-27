import { useState } from 'react'
import Sidebar from '../../components/Sidebar'
import '../../pages/admin/DashboardPage.css'
import './LevelPage.css'

const initialLevels = [
    { id: 1, nama: 'Pemula', minPoin: 0, maxPoin: 100, badge: '🌱' },
    { id: 2, nama: 'Menengah', minPoin: 101, maxPoin: 300, badge: '🔥' },
    { id: 3, nama: 'Mahir', minPoin: 301, maxPoin: 600, badge: '⚡' },
    { id: 4, nama: 'Ahli', minPoin: 601, maxPoin: 1000, badge: '🏆' },
]

const emptyForm = { nama: '', minPoin: '', maxPoin: '', badge: '' }

function LevelPage() {
    const [levels, setLevels] = useState(initialLevels)
    const [form, setForm] = useState(emptyForm)
    const [editId, setEditId] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [deleteId, setDeleteId] = useState(null)
    const [error, setError] = useState('')

    const openAdd = () => {
        setForm(emptyForm)
        setEditId(null)
        setError('')
        setShowModal(true)
    }

    const openEdit = (level) => {
        setForm({ nama: level.nama, minPoin: level.minPoin, maxPoin: level.maxPoin, badge: level.badge })
        setEditId(level.id)
        setError('')
        setShowModal(true)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSave = () => {
        if (!form.nama || form.minPoin === '' || form.maxPoin === '') {
            setError('Nama, min poin, dan max poin wajib diisi.')
            return
        }
        if (Number(form.minPoin) > Number(form.maxPoin)) {
            setError('Min poin tidak boleh lebih besar dari max poin.')
            return
        }

        if (editId !== null) {
            setLevels((prev) =>
                prev.map((l) =>
                    l.id === editId
                        ? { ...l, ...form, minPoin: Number(form.minPoin), maxPoin: Number(form.maxPoin) }
                        : l
                )
            )
        } else {
            const newId = levels.length ? Math.max(...levels.map((l) => l.id)) + 1 : 1
            setLevels((prev) => [
                ...prev,
                { id: newId, ...form, minPoin: Number(form.minPoin), maxPoin: Number(form.maxPoin) },
            ])
        }
        setShowModal(false)
    }

    const confirmDelete = (id) => setDeleteId(id)

    const handleDelete = () => {
        setLevels((prev) => prev.filter((l) => l.id !== deleteId))
        setDeleteId(null)
    }

    return (
        <div className="dashboard-wrapper">
            <Sidebar activePath="/admin/level" />

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <h1>Manajemen Level</h1>
                    <button className="btn-primary" onClick={openAdd}>+ Tambah Level</button>
                </header>

                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Badge</th>
                                <th>Nama Level</th>
                                <th>Min Poin</th>
                                <th>Max Poin</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {levels.length === 0 ? (
                                <tr><td colSpan={6} className="empty-row">Belum ada level.</td></tr>
                            ) : (
                                levels.map((level, idx) => (
                                    <tr key={level.id}>
                                        <td>{idx + 1}</td>
                                        <td className="badge-cell">{level.badge}</td>
                                        <td>{level.nama}</td>
                                        <td>{level.minPoin}</td>
                                        <td>{level.maxPoin}</td>
                                        <td className="action-cell">
                                            <button className="btn-edit" onClick={() => openEdit(level)}>Edit</button>
                                            <button className="btn-delete" onClick={() => confirmDelete(level.id)}>Hapus</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Modal Tambah / Edit */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h2>{editId !== null ? 'Edit Level' : 'Tambah Level'}</h2>

                        {error && <p className="modal-error">{error}</p>}

                        <div className="form-group">
                            <label>Nama Level</label>
                            <input name="nama" value={form.nama} onChange={handleChange} placeholder="contoh: Pemula" />
                        </div>
                        <div className="form-group">
                            <label>Badge (emoji)</label>
                            <input name="badge" value={form.badge} onChange={handleChange} placeholder="contoh: 🌱" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Min Poin</label>
                                <input name="minPoin" type="number" value={form.minPoin} onChange={handleChange} placeholder="0" />
                            </div>
                            <div className="form-group">
                                <label>Max Poin</label>
                                <input name="maxPoin" type="number" value={form.maxPoin} onChange={handleChange} placeholder="100" />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                            <button className="btn-primary" onClick={handleSave}>Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus */}
            {deleteId !== null && (
                <div className="modal-overlay" onClick={() => setDeleteId(null)}>
                    <div className="modal-card modal-confirm" onClick={(e) => e.stopPropagation()}>
                        <h2>Hapus Level?</h2>
                        <p>Data level ini akan dihapus secara permanen.</p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setDeleteId(null)}>Batal</button>
                            <button className="btn-danger" onClick={handleDelete}>Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LevelPage
