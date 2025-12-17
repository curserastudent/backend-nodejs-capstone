const express = require('express');
const router = express.Router();

const connectToDatabase = require('../models/db');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const { body, validationResult } = require('express-validator');

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("users");

        const { email, password, firstName, lastName } = req.body;
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existingEmail = await collection.findOne({ email });
        if (existingEmail) {
            logger.error('Email id already exists');
            return res.status(400).json({ error: 'Email id already exists' });
        }

        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(password, salt);

        const newUser = await collection.insertOne({
            email,
            firstName,
            lastName,
            password: hash,
            createdAt: new Date(),
        });

        const payload = {
            user: {
                id: newUser.insertedId,
            },
        };
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        logger.info('User registered successfully');

        res.json({ authtoken, email });
    } catch (e) {
         logger.error(e.message);
         return res.status(500).send('Internal server error');
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const db = await connectToDatabase();
        const collection = db.collection("users");

        const theUser = await collection.findOne({ email });
        if (!theUser) {
            logger.error('User not found');
            return res.status(404).json({ error: 'User not found' });
        }

        const result = await bcryptjs.compare(password, theUser.password);
        if (!result) {
            logger.error('Passwords do not match');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }

        const payload = {
            user: {
                id: theUser._id.toString(),
            },
        };

        const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        res.json({
            authtoken,
            userName: theUser.firstName,
            userEmail: theUser.email,
        });
    } catch (e) {
         return res.status(500).send('Internal server error');

    }
});

router.put('/update', async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Validation errors in update request', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const email = req.headers.email;
        if (!email) {
            logger.error('Email not found in the request headers');
            return res.status(400).json({ error: "Email not found in the request headers" });
        }
      
        const db = await connectToDatabase();
        const collection = db.collection('users');
  
        const existingUser = await collection.findOne({ email: email });

        if (!existingUser) {
            logger.error('User not found');
            return res.status(404).json({ error: "User not found"});
        }

        const { firstName } = req.body;
        existingUser.firstName = firstName;
        existingUser.updatedAt = new Date();

        const updatedUser = await collection.findOneAndUpdate(
            { email },
            { $set: existingUser },
            { returnDocument: 'after' }
        );
          
        if (!updatedUser) {
        logger.error('User update failed');
        return res.status(500).json({ error: 'User update failed' });
        }
          
        const payload = {
            user: {
                id: existingUser._id.toString(),
            },
        };

        const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        logger.info('User updated successfully');
        res.json({ authtoken });
    } catch (error) {
        logger.error(error);
        return res.status(500).send("Internal Server Error");
    }
});  

module.exports = router;
