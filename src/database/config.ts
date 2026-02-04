// global imports
import mongoose from 'mongoose'; 
 
mongoose.set("bufferCommands", false);
mongoose.set("debug", true);
const dbConnect= ()=>{

    const DB = {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME
    };
    
    mongoose.connect(`${DB.host}`, {
        dbName: `${DB.database}`
    }).then(() => {
        console.log(`DB::DB (mongoDB) connection is successful`);
    }).catch((err) => {
        console.log(err);
        console.log('Error occurred while connecting to DB (MongoDB) !!!');
    });

} 

export default dbConnect;