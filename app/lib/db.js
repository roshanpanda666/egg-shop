import dotenv from 'dotenv';

// Force reload and override

dotenv.config({ override: true });


export const { USERNAME, PASSWORD } = process.env

export const connectdb=`mongodb+srv://${USERNAME}:${PASSWORD}@eggshop0.xhexnj1.mongodb.net/eggdb?appName=eggshop0`


console.log(USERNAME);
console.log(PASSWORD);

