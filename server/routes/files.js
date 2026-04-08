import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { source } = req.query;

    let query = req.supabase
      .from('file_storage')
      .select('*')
      .order('created_at', { ascending: false });

    if (source) {
      query = query.eq('source', source);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { data, error } = await req.supabase
      .from('file_storage')
      .insert({
        user_id: req.user.id,
        filename: req.file.originalname,
        file_path: req.file.path,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        metadata: {
          encoding: req.file.encoding,
        },
        source: 'upload',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

router.get('/:id/download', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('file_storage')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!fs.existsSync(data.file_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.download(data.file_path, data.filename);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { data, error: selectError } = await req.supabase
      .from('file_storage')
      .select('file_path')
      .eq('id', req.params.id)
      .maybeSingle();

    if (selectError) throw selectError;

    if (data && fs.existsSync(data.file_path)) {
      fs.unlinkSync(data.file_path);
    }

    const { error } = await req.supabase
      .from('file_storage')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
