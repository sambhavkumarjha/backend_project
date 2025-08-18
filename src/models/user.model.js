import mongoose , {Schema} from "mongoose";
import jwt  from "jsonwebtoken";
import bcrypt from "bcrypt";


const userSchema = new Schema(
    {
        username:{
            type: String,
            required:true,
            lowercase:true,
            unique:true,
            trim:true,
            index:true// to make the field searching 
        },
        email:{
            type: String,
            required:true,
            lowercase:true,
            unique:true,
            trim:true, 
        },
         Fullname:{
            type:String,
            required:true,
            trim:true, 
            index:true
        },
        avatar:{
            type:String ,//cloudinary service will be used where the uploaded video will be represented with a url
            required:true
        },
        coverImage:{
            type:String
        },
        watchHistory:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:"String",
            required:[true,"Password is required"],
        },
        refreshToken:{
            type:String,
        }
    }
,{timestamps:true})

//basically we want couple of processess to run before saving the data which includes conversion of password typed by the user into its hash code by using bcrypt 
// for that we have used pre method of schema which act as an middleware , thus it requires a flag named next to make ensure the upcoming processes present in the middlewares and other part that the previous process is completed or not
// we can also see that there is a use of traditional function keyboard not an arrow function to give a callback because we want the actual reference of the schema to perform several functions which was not possible using an arrow function

userSchema.pre("save", async function (next){
    if(this.isModified("password"))
    {
        this.password = bcrypt.hash(this.password , 10)
        next();
    }
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generaterAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            Fullname: this.Fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generaterRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY 
        }
    )
}
//jwt is a bearer token which the one who bears the key can only open the door
export const User = mongoose.model("User",userSchema);