require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));

// Mongoose Schema
const ProjectSchema = new mongoose.Schema({
    title: String,
    category: String,
    description: String,
    image: String, // Cloudinary URL
    videoUrl: String, // Cloudinary URL or YouTube Link
    publicIdImage: String, // For deletion
    publicIdVideo: String, // For deletion
    order: { type: Number, default: 0 }
}, { timestamps: true });

const Project = mongoose.model('Project', ProjectSchema);

// Middleware
app.use(cors());
app.use(express.static('./')); // Serve static files
app.use(express.json());

// Memory Storage for Multer (Upload to RAM first, then stream to Cloudinary)
const upload = multer({ storage: multer.memoryStorage() });

// --- HELPERS ---
const uploadFromBuffer = (buffer) => {
    return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto", folder: "frame_weavers" },
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

// --- ROUTES ---

// 1. GET ALL (Sorted by Order)
app.get('/api/portfolio', async (req, res) => {
    try {
        const items = await Project.find().sort({ order: 1, createdAt: -1 });
        res.json(items);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. CREATE (Upload to Cloudinary -> Save to Mongo)
app.post('/api/portfolio', upload.fields([{ name: 'thumbnail' }, { name: 'videoFile' }]), async (req, res) => {
    try {
        const { title, category, description, videoUrl } = req.body;
        let imageUrl = '';
        let imagePublicId = '';
        let videoFinalUrl = videoUrl || '';
        let videoPublicId = '';

        // Upload Image
        if (req.files['thumbnail']) {
            const result = await uploadFromBuffer(req.files['thumbnail'][0].buffer);
            imageUrl = result.secure_url;
            imagePublicId = result.public_id;
        }

        // Upload Video (if provided)
        if (req.files['videoFile']) {
            const result = await uploadFromBuffer(req.files['videoFile'][0].buffer);
            videoFinalUrl = result.secure_url;
            videoPublicId = result.public_id;
        }

        // Create DB Entry
        const newProject = new Project({
            title,
            category,
            description,
            image: imageUrl,
            publicIdImage: imagePublicId,
            videoUrl: videoFinalUrl,
            publicIdVideo: videoPublicId,
            order: Date.now() // Simple default ordering
        });

        await newProject.save();
        res.json({ success: true, item: newProject });

    } catch (e) {
        console.error("Upload Error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// 3. DELETE
app.delete('/api/portfolio/:id', async (req, res) => {
    try {
        // Find existing to get public_ids
        // Note: The frontend sends 'index', but for Mongo we need ID. 
        // We will adapt the frontend to send ID, or we fetch all and pick by index (less safe but preserves older frontend logic if needed).
        // BETTER: Assume frontend sends ID or we lookup. 
        // TEMPORARY PROXY: If ID looks like an index (small number), fetch all and pick. If it's a string, use it.

        let project = null;
        if (req.params.id.length < 10) {
            // It's an index
            const all = await Project.find().sort({ order: 1, createdAt: -1 });
            project = all[parseInt(req.params.id)];
        } else {
            // It's an ID
            project = await Project.findById(req.params.id);
        }

        if (!project) return res.json({ success: false, message: "Not found" });

        // Delete from Cloudinary
        if (project.publicIdImage) await cloudinary.uploader.destroy(project.publicIdImage);
        if (project.publicIdVideo) await cloudinary.uploader.destroy(project.publicIdVideo, { resource_type: 'video' });

        // Delete from DB
        await Project.deleteOne({ _id: project._id });

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false });
    }
});

// 4. REORDER
app.post('/api/portfolio/reorder', async (req, res) => {
    try {
        const { index, direction } = req.body;
        const items = await Project.find().sort({ order: 1, createdAt: -1 });

        if (index < 0 || index >= items.length) return res.json({ success: false });

        const currentItem = items[index];
        let swapItem = null;

        if (direction === 'up' && index > 0) {
            swapItem = items[index - 1];
        } else if (direction === 'down' && index < items.length - 1) {
            swapItem = items[index + 1];
        }

        if (swapItem) {
            // Swap their order values
            const tempOrder = currentItem.order;
            currentItem.order = swapItem.order;
            swapItem.order = tempOrder;

            // If orders are identical (legacy data), fix them
            if (currentItem.order === swapItem.order) {
                currentItem.order = Date.now();
                swapItem.order = currentItem.order - 1;
            }

            await currentItem.save();
            await swapItem.save();
        }

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
