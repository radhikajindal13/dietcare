import mongoose from "mongoose";
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");
    }
    catch(err){
        console.error(err);
        process.exit(1);
    }  
    finally{
        console.log("Executed in finally")
    }
};

export default connectDB;