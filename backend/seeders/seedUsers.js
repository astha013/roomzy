require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const CITIES = ['Pune', 'Mumbai', 'Bangalore', 'Delhi'];
const GENDERS = ['male', 'female', 'other'];
const INTENTS = ['have_room_need_roommate', 'looking_for_roommate'];
const NAMES = [
  'Aarav', 'Aanya', 'Aditya', 'Aisha', 'Akash', 'Ananya', 'Arjun', 'Avni',
  'Bhavesh', 'Bhavya', 'Chirag', 'Dia', 'Dhruv', 'Diya', 'Eshaan', 'Ella',
  'Farhan', 'Fatima', 'Gaurav', 'Gauri', 'Harsh', 'Hema', 'Ishaan', 'Ishita',
  'Kabir', 'Kavya', 'Krishna', 'Kritika', 'Laksh', 'Lara', 'Manav', 'Myra',
  'Nakul', 'Navya', 'Nikhil', 'Niyati', 'Om', 'Ojaswi', 'Pranav', 'Pari',
  'Rahul', 'Riya', 'Rohan', 'Riya', 'Sahil', 'Sanya', 'Siddharth', 'Sneha',
  'Tarun', 'Tara', 'Uma', 'Uthra', 'Vihaan', 'Vidhi', 'Vikram', 'Vriti',
  'Yash', 'Yashika', 'Zaid', 'Zoya'
];
const SLEEP_TIMES = ['early', 'late', 'flexible'];
const SMOKING_OPTIONS = ['yes', 'no', 'occasional'];
const DRINKING_OPTIONS = ['yes', 'no', 'occasional'];
const FOOD_HABITS = ['veg', 'non-veg', 'eggetarian'];
const PERSONALITIES = ['introvert', 'extrovert', 'ambivert'];
const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other', 'None'];

const PUNE_SLEEP_TIMES = ['early', 'late'];
const PUNE_FOOD_HABITS = ['veg', 'non-veg'];
const PUNE_CLEANLINESS = [3, 4, 5];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPhone() {
  const prefixes = ['9', '8', '7', '6'];
  let phone = prefixes[Math.floor(Math.random() * prefixes.length)];
  for (let i = 0; i < 9; i++) {
    phone += Math.floor(Math.random() * 10);
  }
  return phone;
}

function getMoveInDate() {
  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
  const day = getRandomInt(1, daysInMonth);
  return new Date(targetMonth.getFullYear(), targetMonth.getMonth(), day);
}

function generatePuneUser(index, intent) {
  return {
    name: `${getRandomItem(NAMES)} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
    email: `pune_user${index}@test.com`,
    password: 'password123',
    phoneNumber: getRandomPhone(),
    gender: getRandomItem(GENDERS),
    intent,
    city: 'Pune',
    isEmailVerified: true,
    phoneVerified: true,
    selfieVerified: true,
    governmentIdVerified: true,
    trustScore: getRandomInt(35, 80),
    preferences: {
      budgetMin: getRandomInt(8000, 12000),
      budgetMax: getRandomInt(12000, 15000),
      sleepTime: getRandomItem(PUNE_SLEEP_TIMES),
      smoking: 'no',
      drinking: 'no',
      foodHabit: getRandomItem(PUNE_FOOD_HABITS),
      cleanliness: getRandomItem(PUNE_CLEANLINESS),
      guestsAllowed: true,
      workFromHome: Math.random() > 0.5,
      personality: getRandomItem(PERSONALITIES),
      noiseTolerance: getRandomInt(2, 4),
      pets: 'no',
      religion: getRandomItem(RELIGIONS),
      moveInDate: getMoveInDate()
    },
    preferenceWeights: {
      budget: getRandomInt(3, 5),
      location: getRandomInt(3, 5),
      sleepTime: getRandomInt(3, 5),
      cleanliness: getRandomInt(3, 5),
      foodHabit: getRandomInt(3, 5),
      genderPreference: getRandomInt(2, 4),
      noiseTolerance: getRandomInt(2, 4),
      personality: getRandomInt(2, 4)
    },
    socialLinks: {}
  };
}

function generateRandomUser(index) {
  return {
    name: `${getRandomItem(NAMES)} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
    email: `user${index}@test.com`,
    password: 'password123',
    phoneNumber: getRandomPhone(),
    gender: getRandomItem(GENDERS),
    intent: getRandomItem(INTENTS),
    city: getRandomItem(CITIES),
    isEmailVerified: true,
    phoneVerified: true,
    selfieVerified: Math.random() > 0.5,
    governmentIdVerified: Math.random() > 0.5,
    trustScore: getRandomInt(20, 80),
    preferences: {
      budgetMin: getRandomInt(4000, 15000),
      budgetMax: getRandomInt(15000, 30000),
      sleepTime: getRandomItem(SLEEP_TIMES),
      smoking: getRandomItem(SMOKING_OPTIONS),
      drinking: getRandomItem(DRINKING_OPTIONS),
      foodHabit: getRandomItem(FOOD_HABITS),
      cleanliness: getRandomInt(1, 5),
      guestsAllowed: Math.random() > 0.5,
      workFromHome: Math.random() > 0.5,
      personality: getRandomItem(PERSONALITIES),
      noiseTolerance: getRandomInt(1, 5),
      pets: getRandomItem(['yes', 'no', 'allergic']),
      religion: getRandomItem(RELIGIONS)
    },
    preferenceWeights: {
      budget: getRandomInt(0, 5),
      location: getRandomInt(0, 5),
      sleepTime: getRandomInt(0, 5),
      cleanliness: getRandomInt(0, 5),
      foodHabit: getRandomInt(0, 5),
      genderPreference: getRandomInt(0, 5),
      noiseTolerance: getRandomInt(0, 5),
      personality: getRandomInt(0, 5)
    },
    socialLinks: {}
  };
}

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = [];

    for (let i = 1; i <= 40; i++) {
      users.push(generatePuneUser(i, 'have_room_need_roommate'));
    }

    for (let i = 41; i <= 80; i++) {
      users.push(generatePuneUser(i, 'looking_for_roommate'));
    }

    for (let i = 81; i <= 200; i++) {
      users.push(generateRandomUser(i));
    }

    await User.insertMany(users);
    console.log('200 dummy users inserted');

    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();