// IMPORTED MODULES

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

// MODELS

const User = require("../models/user");
const Patient = require("../models/patient");
const Admin = require("../models/admin.js");
const Doctor = require("../models/doctor.js");

// HELPER
const createToken = require("../helper/createToken.js");

// ROUTES

router.post("/sign-up", async (req, res) => {
  try {
    // CHECK IF THE USER EXIST
    const userInDatabase = await User.findOne({ email: req.body.email });

    // CHECKS IF THE USER EXIST AND IS A PATIENT
    let setAccount = false;

    if (userInDatabase) {
      if (userInDatabase.patientAct) {
        return res.status(400).json({ error: "Username already taken" });
      } else {
        setAccount = true;
        if (userInDatabase.adminAct) {
          const existingUser = await Admin.findById(userInDatabase.adminAct);
          if (
            existingUser.firstName !== req.body.firstName ||
            existingUser.lastName !== req.body.lastName ||
            existingUser.CPR !== req.body.CPR
          ) {
            req.body.firstName = existingUser.firstName;
            req.body.lastName = existingUser.lastName;
            req.body.CPR = existingUser.CPR;
          }
        } else if (userInDatabase.doctorAct) {
          const existingUser = await Doctor.findById(userInDatabase.docAct);
          if (
            existingUser.firstName !== req.body.firstName ||
            existingUser.lastName !== req.body.lastName ||
            existingUser.CPR !== req.body.CPR ||
            existingUser.gender !== req.body.gender
          ) {
            req.body.firstName = existingUser.firstName;
            req.body.lastName = existingUser.lastName;
            req.body.CPR = existingUser.CPR;
            req.body.gender = existingUser.gender;
          }
        }
      }
    }
    // USER PAYLOAD

    let payLoad = {
      email: req.body.email,
      hashedPassword: bcrypt.hashSync(
        req.body.password,
        parseInt(process.env.SALT_ROUNDS)
      ),
      docAct: setAccount ? userInDatabase.docAct : null,
      patientAct: null,
      adminAct: setAccount ? userInDatabase.adminAct : null,
    };

    // CREATE A DEFAULT USER WITH HASHED PASSWORD
    const patientUser = await Patient.create(
      ({ firstName, lastName, CPR, gender, DOB, contactNumber } = req.body)
    );
    payLoad.patientAct = patientUser._id;

    // CONDITIONALLY CREATES OR UPDATES USERS DATA
    let user;

    if (payLoad.docAct || payLoad.adminAct) {
      user = await User.findById(userInDatabase._id);
      updatedUser = await User.findByIdAndUpdate(
        userInDatabase._id,
        {
          patientAct: payLoad.patientAct,
        },
        { new: true }
      );
      console.log(updatedUser);
    } else {
      user = await User.create(payLoad);
    }
    const token = createToken(user);

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/sign-in", async (req, res) => {
  try {
    // FINDS THE USER IN THE DATABASE
    const userInDatabase = await User.findOne({ email: req.body.email });

    // CHECKS IF THE USER VALID
    if (
      userInDatabase &&
      bcrypt.compareSync(req.body.password, userInDatabase.hashedPassword)
    ) {
      // CHECKS THE USER TYPE AND ASSIGNS THEM A VALUE
      let user = {};

      if (userInDatabase.docAct) {
        user[5000] = userInDatabase.docAct;
      }
      if (userInDatabase.patientAct) {
        user[3000] = userInDatabase.patientAct;
      }
      if (userInDatabase.adminAct) {
        user[2000] = userInDatabase.adminAct;
      }
      // CREATES A TOKEN
      const token = createToken(user);

      res.status(200).json({ token });
    } else {
      res.status(401).json({ error: "Invalid username or password." });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
