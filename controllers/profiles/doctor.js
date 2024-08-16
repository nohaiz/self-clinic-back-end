// IMPORTED MODULES
const express = require("express");
const router = express.Router();
const User = require("../../models/user");

//MODELS
const Doctor = require("../../models/doctor");

// VIEW ALL DOCTORS

router.post("/:userId/doctors", async (req, res) => {
  try {
    if (!req.user.type[2000]) {
      return res.status(403).json({ error: " Something wen't wrong" });
    }

    const newDoctor = new Doctor(req.body);
    await newDoctor.save();

    res.json({ message: "Doctor created", doctor: newDoctor });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/:userId/doctors", async (req, res) => {
  if (req.user.type[2000]) {
    try {
      const doctors = await Doctor.find({});

      res.json(doctors);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: "Oops, something went wrong" });
  }
});

// VIEW DOCTOR
router.get("/:userId/doctors/:id", async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    res.json(doctor);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// UPDATE DOCTOR
router.put("/:userId/doctors/:id", async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ message: "Doctor Updated" }, doctor);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// DELETE DOCTOR
router.delete("/:userId/doctors/:id", async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    const user = await User.findByIdAndDelete(req.params.userId);
    res.json({ message: "Doctor Deleted" }, doctor);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

module.exports = router;
