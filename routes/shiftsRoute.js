/**
 * @swagger
 * tags:
 *   name: Shifts
 *   description: Retrieve and manage user shifts
 */


import express from "express";
import mongoose from "mongoose";
import Shift from "../models/shiftsModel.js";
import requireAuth from "../middleware/requireAuth.js";
import Location from "../models/locationModel.js";
import User from "../models/userModel.js";

const router = express.Router();

function isValidTime(time) {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time); //regular exppresison to check if time is in HH:mm format
}


async function checks(res, userId, startTime, finishTime, numOfShiftsPerDay) {
  if (!isValidTime(startTime) || !isValidTime(finishTime)) {
    return res.status(400).json({ message: "startTime and finishTime must be in HH:mm format." });
  }

  const parsedNum = Number(numOfShiftsPerDay);
  if (isNaN(parsedNum)) {
    return res.status(400).json({ message: "numOfShiftsPerDay must be a number." });
  }
  

  if (!mongoose.Types.ObjectId.isValid(userId)) {
     return res.status(400).json({ message: "Invalid user ID." });
  }

  const userDoc = await User.findById(userId);
  if (!userDoc) {
      return res.status(404).json({ message: "User not found." });
    }

  return { parsedNum };
}

router.put("/:id", requireAuth, async (req, res) => {
  const shiftId = req.params.id;
  const userId = req.user?.id || req.user?._id;
  console.log(shiftId)

  try {
    if (!mongoose.Types.ObjectId.isValid(shiftId)) {
      return res.status(400).json({ message: "Invalid shift ID" });
    }

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    if (shift.user.toString() !== userId) {
      return res.status(403).json({ message: "Cannot update other users shifts" });
    }

    const { title, role, typeOfShift, startTime, finishTime, numOfShiftsPerDay, location, date } = req.body;

    if (
      !title ||
      !role ||
      !startTime ||
      !finishTime ||
      !location ||
      !date ||
      !numOfShiftsPerDay
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }
    console.log(req.body)
    const values = await checks(res, userId, startTime, finishTime, numOfShiftsPerDay, location.name);

    // Update the shift
    shift.title = title;
    shift.role = role;
    shift.typeOfShift = typeOfShift;
    shift.startTime = startTime;
    shift.finishTime = finishTime;
    shift.numOfShiftsPerDay = values.parsedNum;
    shift.date = date;

    const newLocation = await Location.create({
      name: location.name,
      postCode: location.postCode,
      distance: location.distance,
      constituency: location.constituency,
      adminDistrict: location.adminDistrict,
      cordinates: {
        longitude: location.cordinates.longitude,
        latitude: location.cordinates.latitude,
        useRotaCloud: location.cordinates.useRotaCloud,
      }
    });
    
    shift.location = newLocation._id;
    const updatedShift = await shift.save();
    await Shift.findById(updatedShift._id).populate("user").populate("location");
    res.status(200).json({ message: "Shift updated!"});
  } catch (err) {
    console.error("Error updating shift:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  const shiftId = req.params.id;
  const userId = req.user?.id || req.user?._id;

  try {
    if (!mongoose.Types.ObjectId.isValid(shiftId)) {
      return res.status(400).json({ message: "Invalid shift ID" });
    }

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    if (shift.user.toString() !== userId) {
      return res.status(403).json({ message: "Cannot access other users shift" });
    }

    await Shift.findByIdAndDelete(shiftId);
    res.status(200).json({ message: "Shift deleted successfully" });
  } catch (err) {
    console.error("Error deleting shift:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const {
    title,
    role,
    typeOfShift,
    startTime,
    finishTime,
    numOfShiftsPerDay,
    location,
    date
  } = req.body;


  const userId = req.user?.id || req.user?._id;
  try {
    if (
      !title ||
      !role ||
      !startTime ||
      !finishTime ||
      !location ||
      !location.name ||
      !date ||
      !numOfShiftsPerDay
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // Validates that everything is in the correct
    const values = await checks(
      res,
      userId,
      startTime,
      finishTime,
      numOfShiftsPerDay,
      location.name
    );
    let locationDoc = await Location.findOne({ postCode: location.postCode });

    if (!locationDoc) {
      locationDoc = new Location({
        name: location.name,
        postCode: location.postCode,
        constituency: location.constituency,
        adminDistrict: location.adminDistrict,
        distance: location.distance,
        cordinates: {
          longitude: location.cordinates.longitude,
          latitude: location.cordinates.latitude,
          useRotaCloud: location.cordinates.useRotaCloud,
        }
      });
      await locationDoc.save();
    }
    const newShift = new Shift({
      title,
      role,
      typeOfShift,
      startTime,
      finishTime,
      numOfShiftsPerDay: values.parsedNum,
      location: locationDoc._id,
      user: userId,
      date,
    });
    

    await newShift.save();
    return res.status(201).json({message: "Shift created successfully"});
  } catch (err) {
    console.error("Error creating shift:", err);
    return res.status(500).json({ message: "Server Error" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const { userId } = req.query;
    const tokenUserId = req.user.id || req.user._id;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "userId query parameter is required" });
    }

    if (userId !== tokenUserId) {
      return res
        .status(403)
        .json({ message: 'Forbidden: cannot fetch other users shifts' });
    }

    const shifts = await Shift.find({ user: userId })
      .populate("user", "name email")
      .populate("location")
      .sort({ date: -1 });

    res.json(shifts);
  } catch (err) {
    console.error("Error fetching shifts:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
