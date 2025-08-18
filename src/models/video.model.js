import mongoose , {Schema} from "mongoose";
// updating watchlist of user can be a very complex process for which we would take the help of
// mongoose-aggregate-paginate-v2

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
    {
        videoFile:{
            type:String,//cloudinary url
            required:true
        },
        thumbnail:{
            type:String,//cloudinary url
            required:true
        },
        title:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        duration:{
            type:Number, //cloudinary will send the description
            required:true
        },
        views:{
            type:Number,
            default:0
        },
        isPublished:{
            type:Boolean,
            default:true
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    }
,{timestamps:true})
// to write aggregation queries
videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video",videoSchema);