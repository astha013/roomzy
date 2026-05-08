require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RoomListing = require('../models/RoomListing');

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  'Noida', 'Gurugram', 'Navi Mumbai', 'Chandigarh', 'Kochi', 'Indore', 'Bhopal', 'Jaipur',
  'Lucknow', 'Nagpur', 'Surat', 'Vadodara', 'Coimbatore', 'Madurai', 'Thiruvananthapuram',
  'Mysore', 'Mangalore', 'Vijayawada', 'Visakhapatnam', 'Tirupati', 'Ranchi', 'Bhubaneswar',
  'Guwahati', 'Dehradun', 'Amritsar', 'Ludhiana', 'Jodhpur', 'Udaipur', 'Varanasi',
  'Agra', 'Nashik', 'Aurangabad', 'Rajkot', 'Raipur', 'Jabalpur', 'Gwalior', 'Patna',
  'Meerut', 'Pimpri-Chinchwad', 'Hubli', 'Belgaum',
];

const AREAS = {
  Mumbai:    ['Andheri', 'Bandra', 'Powai', 'Malad', 'Borivali', 'Dadar', 'Goregaon', 'Kurla'],
  Delhi:     ['Connaught Place', 'Lajpat Nagar', 'Rohini', 'Dwarka', 'Saket', 'Karol Bagh'],
  Bangalore: ['Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield', 'Electronic City', 'Marathahalli', 'BTM Layout'],
  Hyderabad: ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Hitech City', 'Kondapur', 'Madhapur'],
  Chennai:   ['T. Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'OMR', 'Porur', 'Tambaram'],
  Pune:      ['Koregaon Park', 'Kothrud', 'Hinjewadi', 'Baner', 'Viman Nagar', 'Aundh', 'Wakad'],
  Kolkata:   ['Salt Lake', 'Park Street', 'Ballygunge', 'New Town', 'Jadavpur'],
  Ahmedabad: ['Navrangpura', 'Satellite', 'Vastrapur', 'Bodakdev', 'Maninagar'],
  Noida:     ['Sector 62', 'Sector 18', 'Sector 137', 'Sector 50'],
  Gurugram:  ['DLF Phase 1', 'Sohna Road', 'Golf Course Road', 'Cyber City', 'MG Road'],
  Chandigarh:['Sector 17', 'Sector 22', 'Sector 35', 'Panchkula', 'Mohali'],
  Kochi:     ['Ernakulam', 'Kakkanad', 'Aluva', 'Infopark', 'Edapally'],
  Jaipur:    ['Malviya Nagar', 'Vaishali Nagar', 'C-Scheme', 'Mansarovar'],
};

const NAMES = [
  'Aarav','Aanya','Aditya','Aisha','Akash','Akanksha','Ananya','Arjun','Avni','Aryan',
  'Bhavesh','Bhavya','Chirag','Charu','Dia','Dhruv','Diya','Dev','Deepika','Divya',
  'Eshaan','Esha','Farhan','Fatima','Gaurav','Gauri','Harsh','Hema','Hitesh','Hina',
  'Ishaan','Ishita','Isha','Jatin','Juhi','Kabir','Kavya','Karan','Komal','Kiran',
  'Krishna','Kritika','Laksh','Lara','Manav','Mansi','Myra','Mohan','Meera','Madhur',
  'Nakul','Navya','Nikhil','Niyati','Neha','Om','Ojaswi','Payal','Pranav','Priya',
  'Pooja','Rahul','Riya','Rohan','Rohini','Sahil','Sanya','Siddharth','Sneha','Sonam',
  'Tarun','Tara','Uma','Vihaan','Vidhi','Vikram','Vivek','Vandana','Yash','Yashika',
  'Zaid','Zoya','Abhishek','Arun','Balram','Chetan','Dinesh','Ganesh','Hemant',
  'Jagdish','Kamlesh','Laxmi','Mahesh','Nandita','Omkar','Prakash','Rekha','Sunita',
  'Tushar','Vinay','Waseem','Anjali','Shreya','Tanvi','Ruchika','Simran','Gurpreet',
];

const LAST_NAMES = [
  'Sharma','Verma','Singh','Kumar','Patel','Shah','Mehta','Gupta','Joshi','Rao',
  'Nair','Iyer','Pillai','Reddy','Naidu','Agarwal','Banerjee','Das','Bose','Mishra',
  'Tiwari','Pandey','Srivastava','Dubey','Yadav','Chauhan','Desai','Jain','Kapoor',
  'Malhotra','Khanna','Bhatia','Chopra','Arora','Saxena','Mathur','Bhatt','Trivedi',
  'Gandhi','Parikh','Thakur','Kulkarni','Patil','Shinde','Jadhav','Chowdhury',
];

const SLEEP_TIMES  = ['early', 'late', 'flexible'];
const SMOKING      = ['yes', 'no', 'occasional'];
const DRINKING     = ['yes', 'no', 'occasional'];
const FOOD         = ['veg', 'non-veg', 'eggetarian'];
const PERSONALITIES= ['introvert', 'extrovert', 'ambivert'];
const RELIGIONS    = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other', 'None'];
const INTENTS      = ['have_room_need_roommate', 'looking_for_roommate'];
// ✅ Match the schema enum exactly
const ROOM_TYPES   = ['single', 'shared', 'studio', 'flat'];
const FURNISHED    = ['furnished', 'semi-furnished', 'unfurnished'];

const PROFESSIONS = [
  'Software Engineer','Product Manager','Data Analyst','MBA Student','UI/UX Designer',
  'Marketing Executive','Teacher','Doctor','CA','Freelancer','Content Writer',
  'Business Analyst','DevOps Engineer','HR Executive','Sales Manager',
];
const AI_SUMMARIES = [
  'Early bird who loves quiet evenings and home-cooked meals.',
  'Night owl, remote worker — keeps to themselves but always friendly.',
  'Social butterfly who loves weekend outings and potluck dinners.',
  'Studious and organised, prefers a calm, clutter-free space.',
  'Fitness enthusiast who wakes up early for morning runs.',
  'Foodie who enjoys cooking and sharing meals with roommates.',
  'Music lover who fully respects quiet hours.',
  'Minimalist lifestyle, very clean, loves reading and coffee.',
  'Avid traveller looking for a comfortable base between adventures.',
  'Works from home, values good Wi-Fi and a peaceful atmosphere.',
  'Warm and friendly, makes any place feel like home.',
  'Weekend hiker who loves nature and sustainable living.',
  'Binge-watches shows on weekends, very tidy otherwise.',
  'Early riser, gym person, into healthy eating.',
  'Chill vibe, respects privacy, always down to chat.',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randPhone() {
  const pre = ['9','8','7','6'];
  let p = pick(pre);
  for (let i = 0; i < 9; i++) p += Math.floor(Math.random() * 10);
  return p;
}
function getMoveInDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + rand(0, 2));
  d.setDate(rand(1, 28));
  return d;
}
function getArea(city) {
  return AREAS[city] ? pick(AREAS[city]) : `${city} Central`;
}

let emailIdx = 1;
function makeUser(city, intent) {
  const idx = emailIdx++;
  const bMin = rand(5000, 20000);
  const bMax = bMin + rand(3000, 15000);
  return {
    name: `${pick(NAMES)} ${pick(LAST_NAMES)}`,
    email: `user${idx}@roomzy.test`,
    password: 'Test@1234',
    phoneNumber: randPhone(),
    gender: pick(['male', 'female', 'other']),
    intent: intent || pick(INTENTS),
    city,
    area: getArea(city),
    bio: `${pick(PROFESSIONS)} in ${city}. Looking for a comfortable, compatible living arrangement.`,
    aiSummary: pick(AI_SUMMARIES),
    isEmailVerified: true,
    phoneVerified: true,
    selfieVerified: Math.random() > 0.3,
    governmentIdVerified: Math.random() > 0.4,
    trustScore: rand(35, 95),
    preferences: {
      budgetMin: bMin,
      budgetMax: bMax,
      locationRadius: rand(5, 20),
      sleepTime: pick(SLEEP_TIMES),
      smoking: pick(SMOKING),
      drinking: pick(DRINKING),
      foodHabit: pick(FOOD),
      cleanliness: rand(2, 5),
      guestsAllowed: Math.random() > 0.4,
      workFromHome: Math.random() > 0.5,
      genderPreference: pick(['male', 'female', 'any', 'any', 'any']),
      language: pick(['Hindi','English','Marathi','Tamil','Telugu','Kannada','Bengali','Gujarati','Punjabi','Malayalam']),
      personality: pick(PERSONALITIES),
      noiseTolerance: rand(1, 5),
      acPreference: pick(['ac', 'non-ac', 'any']),
      pets: pick(['yes', 'no', 'no', 'allergic']),
      religion: pick(RELIGIONS),
      moveInDate: getMoveInDate(),
    },
    preferenceWeights: {
      budget: rand(2,5), location: rand(2,5), sleepTime: rand(1,5),
      cleanliness: rand(2,5), foodHabit: rand(2,5), genderPreference: rand(1,4),
      noiseTolerance: rand(1,4), personality: rand(1,4),
    },
    socialLinks: {},
  };
}

function makeRoomListing(ownerId, city, area) {
  const rent    = rand(5000, 40000);
  const rType   = pick(ROOM_TYPES);   // ✅ 'single'|'shared'|'studio'|'flat'
  const furnish = pick(FURNISHED);    // ✅ 'furnished'|'semi-furnished'|'unfurnished'

  const titles = {
    single: `Private Single Room in ${area}`,
    shared: `Shared Room Available in ${area}`,
    studio: `Studio Apartment in ${area}`,
    flat:   `${rand(1,3)}BHK Flat in ${area}`,
  };

  return {
    owner: ownerId,
    title: titles[rType],
    description: `Well-maintained ${rType} available in ${area}, ${city}. Ideal for working professionals or students. Close to public transport.`,
    city,
    area,
    address: `Plot ${rand(1, 999)}, ${area}, ${city}`,
    rent,
    deposit: rent * rand(1, 3),
    roomType: rType,
    availableFrom: getMoveInDate(),
    genderPreference: pick(['male', 'female', 'any']),
    facilities: {
      wifi:        Math.random() > 0.25,
      ac:          Math.random() > 0.45,
      parking:     Math.random() > 0.55,
      laundry:     Math.random() > 0.4,
      kitchen:     Math.random() > 0.3,
      gym:         Math.random() > 0.75,
      security:    Math.random() > 0.45,
      powerBackup: Math.random() > 0.5,
      waterSupply: true,
      furnished:   furnish,  // ✅ string enum, not boolean
    },
    images: [],
    isActive: true,
    isFlagged: false,
  };
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear old test data
    const removed = await User.deleteMany({ email: /@roomzy\.test$/ });
    console.log(`🗑️  Cleared ${removed.deletedCount} old test users`);
    await RoomListing.deleteMany({ title: /in .* Central$|Room Available in|Flat in|Studio Apartment in|Single Room in|Shared Room/ });

    const users = [];

    // Metro cities: 8 pairs each = 64 users
    const metros = ['Mumbai','Delhi','Bangalore','Hyderabad','Chennai','Pune','Kolkata','Ahmedabad'];
    for (const city of metros) {
      for (let i = 0; i < 4; i++) {
        users.push(makeUser(city, 'have_room_need_roommate'));
        users.push(makeUser(city, 'looking_for_roommate'));
      }
    }

    // Tech hubs: 4 per city = 24 users
    const techHubs = ['Noida','Gurugram','Navi Mumbai','Chandigarh','Kochi','Indore'];
    for (const city of techHubs) {
      for (let i = 0; i < 2; i++) {
        users.push(makeUser(city, 'have_room_need_roommate'));
        users.push(makeUser(city, 'looking_for_roommate'));
      }
    }

    // Tier-2/3 cities: 2 per city
    const tier2 = [
      'Jaipur','Lucknow','Nagpur','Bhopal','Visakhapatnam','Patna','Vadodara',
      'Ludhiana','Agra','Nashik','Rajkot','Varanasi','Aurangabad','Coimbatore',
      'Madurai','Thiruvananthapuram','Mysore','Mangalore','Vijayawada','Tirupati',
      'Ranchi','Bhubaneswar','Guwahati','Dehradun','Amritsar','Jodhpur','Udaipur',
      'Jabalpur','Raipur','Gwalior','Surat',
    ];
    for (const city of tier2) {
      users.push(makeUser(city, 'have_room_need_roommate'));
      users.push(makeUser(city, 'looking_for_roommate'));
    }

    // Top up to exactly 150
    while (users.length < 150) users.push(makeUser(pick(metros)));
    const slice = users.slice(0, 150);

    // insertMany() bypasses mongoose pre('save') hooks, so passwords would be
    // stored as plain text. Pre-hash once here before inserting.
    const hashedPassword = await bcrypt.hash('Test@1234', 10);
    slice.forEach(u => { u.password = hashedPassword; });

    const inserted = await User.insertMany(slice);
    console.log(`✅ Inserted ${inserted.length} users`);

    // Room listings for 'have_room' users
    const owners = inserted.filter(u => u.intent === 'have_room_need_roommate').slice(0, 70);
    const listings = owners.map(u => makeRoomListing(u._id, u.city, u.area || getArea(u.city)));
    await RoomListing.insertMany(listings);
    console.log(`✅ Inserted ${listings.length} room listings`);

    // City breakdown
    const dist = {};
    inserted.forEach(u => { dist[u.city] = (dist[u.city] || 0) + 1; });
    console.log('\n📊 Users per city:');
    Object.entries(dist).sort((a,b) => b[1]-a[1]).forEach(([c,n]) => console.log(`   ${c}: ${n}`));

    await mongoose.connection.close();
    console.log('\n🎉 Done! Login with: user1@roomzy.test / Test@1234');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seed();