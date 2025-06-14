const { default: mongoose } = require("mongoose");
const connectDatabase = async ()=>{
    try {
        const dbURl = "mongodb+srv://arvind_maurya:arvind_194@cluster0.qxv1nzm.mongodb.net/uuProject?retryWrites=true&w=majority"
        await mongoose.connect(dbURl)
        console.log('database connected');
    } catch (error) {
        console.log("somthing went wrong while connecting to database", error)
    }
}
module.exports = {connectDatabase}