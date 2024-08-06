const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const QRCode = require("qrcode");
const multer = require("multer");
const bucket = require("../firebaseconfig");
const mongoose = require("mongoose");

// Event creation endpoint
router.post("/create", async (req, res) => {
  const { name, date, createdBy } = req.body;
  try {
    const qrCodeUrl = await QRCode.toDataURL(`${name}-${date}-${createdBy}`);
    const newEvent = new Event({ name, date, qrCode: qrCodeUrl, createdBy });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Image upload endpoint
const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadImageToFirebase = async (file) => {
  const blob = bucket.file(file.originalname);
  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    blobStream.on("error", (err) => {
      reject(err);
    });

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};

router.post("/upload", upload.single("image"), async (req, res) => {
  const { eventId } = req.body;
  const image = req.file;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: "Invalid event ID" });
  }

  try {
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const imageUrl = await uploadImageToFirebase(image);

    event.images.push(imageUrl);
    await event.save();

    res.status(200).json({ message: "Image uploaded successfully", imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
