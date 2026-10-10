require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./supabase');

const app = express();
app.use(cors());
app.use(express.json());

const TABLE = 'loans';
const STATUS_VALID = ['Dipinjam', 'Dikembalikan', 'Terlambat'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const today = () => new Date().toISOString().slice(0, 10);
const isValidDate = (v) => typeof v === 'string' && DATE_RE.test(v) && !Number.isNaN(Date.parse(v));

// Validasi body. partial=true untuk update (field boleh sebagian)
function validate(body, partial = false) {
  const errors = [];
  const required = ['nama_anggota', 'judul_buku', 'tanggal_pinjam', 'tanggal_jatuh_tempo'];

  if (!partial) {
    required.forEach((f) => {
      if (body[f] === undefined || body[f] === null || body[f] === '') errors.push(`${f} wajib diisi`);
    });
  }
  ['nama_anggota', 'judul_buku'].forEach((f) => {
    if (body[f] !== undefined && (typeof body[f] !== 'string' || !body[f].trim())) errors.push(`${f} harus berupa teks tidak kosong`);
  });
  ['tanggal_pinjam', 'tanggal_jatuh_tempo', 'tanggal_kembali'].forEach((f) => {
    if (body[f] !== undefined && body[f] !== null && !isValidDate(body[f])) errors.push(`${f} harus berformat YYYY-MM-DD`);
  });
  if (body.status !== undefined && !STATUS_VALID.includes(body.status)) {
    errors.push(`status harus salah satu dari: ${STATUS_VALID.join(', ')}`);
  }
  return errors;
}

// Ambil hanya field yang diizinkan
function pick(body) {
  const allowed = ['nama_anggota', 'judul_buku', 'tanggal_pinjam', 'tanggal_jatuh_tempo', 'tanggal_kembali', 'status'];
  const out = {};
  allowed.forEach((f) => {
    if (body[f] !== undefined) out[f] = typeof body[f] === 'string' ? body[f].trim() : body[f];
  });
  return out;
}

const fail = (res, error, code = 500) =>
  res.status(code).json({ success: false, message: error.message || error });

// ---------- Root ----------
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Peminjaman Buku Perpustakaan berjalan',
    endpoints: [
      'GET    /loans?status=&nama_anggota=&judul_buku=&sort=&order=',
      'GET    /loans/:id',
      'POST   /loans',
      'PUT    /loans/:id',
      'DELETE /loans/:id',
    ],
  });
});

// ---------- READ (list + filter) ----------
app.get('/loans', async (req, res) => {
  try {
    const { status, nama_anggota, judul_buku, sort = 'id', order = 'asc' } = req.query;

    if (status && !STATUS_VALID.includes(status)) {
      return fail(res, `status harus salah satu dari: ${STATUS_VALID.join(', ')}`, 400);
    }
    const sortable = ['id', 'tanggal_pinjam', 'tanggal_jatuh_tempo', 'nama_anggota', 'judul_buku'];
    if (!sortable.includes(sort)) return fail(res, `sort harus salah satu dari: ${sortable.join(', ')}`, 400);

    // Tandai otomatis pinjaman yang lewat jatuh tempo sebagai "Terlambat"
    await supabase.from(TABLE).update({ status: 'Terlambat' }).eq('status', 'Dipinjam').lt('tanggal_jatuh_tempo', today());

    let query = supabase.from(TABLE).select('*');
    if (status) query = query.eq('status', status);
    if (nama_anggota) query = query.ilike('nama_anggota', `%${nama_anggota}%`);
    if (judul_buku) query = query.ilike('judul_buku', `%${judul_buku}%`);
    query = query.order(sort, { ascending: order !== 'desc' });

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, count: data.length, data });
  } catch (e) {
    fail(res, e);
  }
});

// ---------- READ (detail) ----------
app.get('/loans/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) return fail(res, 'Data peminjaman tidak ditemukan', 404);
    res.json({ success: true, data });
  } catch (e) {
    fail(res, e);
  }
});

// ---------- CREATE ----------
app.post('/loans', async (req, res) => {
  try {
    const errors = validate(req.body || {});
    if (errors.length) return res.status(400).json({ success: false, message: 'Validasi gagal', errors });

    const payload = pick(req.body);
    payload.status = payload.status || 'Dipinjam';

    const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, message: 'Peminjaman berhasil dicatat', data });
  } catch (e) {
    fail(res, e);
  }
});

// ---------- UPDATE ----------
app.put('/loans/:id', async (req, res) => {
  try {
    const errors = validate(req.body || {}, true);
    if (errors.length) return res.status(400).json({ success: false, message: 'Validasi gagal', errors });

    const payload = pick(req.body);
    if (Object.keys(payload).length === 0) return fail(res, 'Tidak ada field yang diupdate', 400);

    // Jika dikembalikan dan tanggal_kembali belum diisi, isi otomatis dengan hari ini
    if (payload.status === 'Dikembalikan' && !payload.tanggal_kembali) payload.tanggal_kembali = today();

    const { data, error } = await supabase.from(TABLE).update(payload).eq('id', req.params.id).select().maybeSingle();
    if (error) throw error;
    if (!data) return fail(res, 'Data peminjaman tidak ditemukan', 404);
    res.json({ success: true, message: 'Data peminjaman berhasil diperbarui', data });
  } catch (e) {
    fail(res, e);
  }
});

// ---------- DELETE ----------
app.delete('/loans/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from(TABLE).delete().eq('id', req.params.id).select().maybeSingle();
    if (error) throw error;
    if (!data) return fail(res, 'Data peminjaman tidak ditemukan', 404);
    res.json({ success: true, message: 'Data peminjaman berhasil dihapus', data });
  } catch (e) {
    fail(res, e);
  }
});

// 404 & error handler
app.use((req, res) => fail(res, 'Endpoint tidak ditemukan', 404));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return fail(res, 'JSON tidak valid', 400);
  fail(res, err);
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
}

module.exports = app;
