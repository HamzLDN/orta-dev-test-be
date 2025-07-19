import express from "express";
import mongoose from "mongoose";
import Shift from "../models/shiftsModel.js";
import requireAuth from "../middleware/requireAuth.js";
import Location from "../models/locationModel.js";
import User from "../models/userModel.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Shifts
 *   description: Retrieve and manage user shifts
 */

/**
 * @swagger
 * /shifts:
 *   get:
 *     summary: Retrieve all shifts for a given user
 *     tags: [Shifts]
 * 
 *     security:
 * 
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ObjectId of the user whose shifts to fetch
 *     responses:
 *       200:
 *         description: A list of shifts, populated with user and location
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: 60f7a3e5b4dcb826d8fe1234
 *                   title:
 *                     type: string
 *                     example: Short Day
 *                   role:
 *                     type: string
 *                     example: Support Worker
 *                   typeOfShift:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: [ "Weekdays" ]
 *                   user:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 6876ecb642df0376491dd254
 *                       name:
 *                          
 *                         type: string
 *                         example: John Doe
 *                       email:
 *                         type: string
 *                         format: email
 *                         example: john@example.com
 *                   location:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 6876ec09d260b087559e5fff
 *                       name:
 *                         type: string
 *                         example: Clippers House, Clippers Quay
 *                       postCode:
 *                         type: string
 *                         example: M50 3XP
 *                       distance:
 *                         type: number
 *                         example: 0
 *                       constituency:
 *                         type: string
 *                         example: Salford and Eccles
 *                       adminDistrict:
 *                         type: string
 *                         example: Salford
 *                       cordinates:
 *                         type: object
 *                         properties:
 *                           longitude:
 *                             type: number
 *                             example: -2.286226
 *                           latitude:
 *                             type: number
 *                             example: 53.466921
 *                           useRotaCloud:
 *                             type: boolean
 *                             example: true
 *                   startTime:
 *                     type: string
 *                     example: "13:00"
 *                   finishTime:
 *                     type: string
 *                     example: "18:00"
 *                   numOfShiftsPerDay:
 *                     type: number
 *                     example: 1
 *                   date:
 *                     type: string
 *                     format: date
 *                     example: "2025-06-17"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: Bad request – userId missing or invalid
 *       403:
 *         description: Forbidden – userId does not match authenticated user
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /shifts:
 *   post:
 *     summary: Create a new shift for the authenticated user
 *     tags: [Shifts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               date:
 *                 type: string
 *               startTime:
 *                 type: string
 *               finishTime:
 *                 type: string
 *               location:
 *                 type: string
 *               user:
 *                 type: string
 *     responses:
 *       201:
 *         description: Shift created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */


function isValidTime(time) {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time); //regular exppresison to check if time is in HH:mm format
} 

async function checks(res, startTime, finishTime, numOfShiftsPerDay) {
  if (!isValidTime(startTime) || !isValidTime(finishTime)) {
    return res.status(400).json({ message: "startTime and finishTime must be in HH:mm format." });
  }

  const parsedNum = Number(numOfShiftsPerDay);
  if (isNaN(parsedNum)) return res.status(400).json({ message: "numOfShiftsPerDay must be a number." });
  

  if (!mongoose.Types.ObjectId.isValid(userId))  return res.status(400).json({ message: "Invalid user ID." });

  const userDoc = await User.findById(userId);
  if (!userDoc) return res.status(404).json({ message: "User not found." });
  // Validates location id
  let locationDoc;
  if (mongoose.Types.ObjectId.isValid(location)) locationDoc = await Location.findById(location);

  if (!locationDoc) return res.status(404).json({ message: "Location not found." });
}

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
      !date ||
      !numOfShiftsPerDay
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }
    
    checks(res, startTime, finishTime, numOfShiftsPerDay)

    // Create the shift
    const newShift = new Shift({
      title,
      role,
      typeOfShift,
      startTime,
      finishTime,
      numOfShiftsPerDay: parsedNum,
      location: locationDoc._id,
      user: userId,
      date,
    });

    const savedShift = await newShift.save();
    const populatedShift = await Shift.findById(savedShift._id).populate("user").populate("location");
    res.status(201).json(populatedShift);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error." });
  }
});

//Auth disabled for get because theres no authentication on swagger

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
        .json({ message: "Forbidden: cannot fetch other users' shifts" });
    }

    const shifts = await Shift.find({ user: userId })
      .populate("user", "name email")
      .populate("location")
      .sort({ date: 1 });

    res.json(shifts);
  } catch (err) {
    console.error("Error fetching shifts:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
