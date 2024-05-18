const mongoose= require('mongoose');
const camp = require('../models/campground');
const axios=require('axios');
const cities = require('./cities');
const {descriptors,places} = require('./seedHelpers');


mongoose.connect('mongodb://127.0.0.1:27017/YelpApp');
const db = mongoose.connection;
//on is used for recurring events, like handling errors that might happen multiple times,
db.on("error",console.error.bind(console,"connection error:"));
//once is used for one-time events, like performing an action when the database connection is opened for the first time.
db.once("open",()=>{
  console.log("Database connected");
});
 
const fetchImageUrl = async () => {
  try {
    const res = await axios.get('https://pixabay.com/api/', {
      params: {
        key:'43947195-d1aa5bb3a40046bdbff9e2e6f', // Replace with your Unsplash access key
        category: 'food', // This can be adjusted to fit the theme of your camps
        per_page:50
      }
    });
    const hits = res.data.hits;
    if (hits.length > 0) {
      const randomIndex = Math.floor(Math.random() * hits.length);
      return hits[randomIndex].webformatURL;
    } else {
      console.error("No images found in the specified category.");
      return 'https://via.placeholder.com/300'; // Fallback placeholder image
    }
  } catch (error) {
    console.error("Error fetching image from Pixabay:", error);
    return 'https://via.placeholder.com/300'; // Fallback placeholder image
  }
};



const seedRandom = (array)=>array[Math.floor(Math.random()*array.length)];
const Data = async()=>{
  try{
    await camp.deleteMany({});
    for (let i = 0; i < 50; i++) {
      const randomCity = Math.floor(Math.random() * 1000);
      const price = Math.floor(Math.random() * 40) + 10;
      const imageUrl= await fetchImageUrl();
    
      
      const newCamp = new camp({
        location: `${cities[randomCity].city},${cities[randomCity].state}`,
        title: `${seedRandom(descriptors)} ${seedRandom(places)}`,
        image: imageUrl, // Use the fetched image URL
        description: 'This is a sample description for the campground.',
        price
      });
      console.log(newCamp);
      
     await newCamp.save();
     
  }
  console.log('data successfully seeded');
  }
  catch (err) {
    console.error("Error seeding data:", err);
  }
  
};
Data();