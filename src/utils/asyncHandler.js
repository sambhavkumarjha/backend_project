// high order fuctions are the functions that can take and read another functions as parameters or arguments and also can return another functions as their return value;
const asyncHandler = (requestHandler)=> {
    (req,res,next)=>{
        Promises.resolve(requestHandler(req,res,next))
        .catch((err)=>next(err))
    }
} 

export {asyncHandler}

// const asyncHandler = ()=>{}
// const asyncHandler = (func)=>{}
// const asyncHandler = (func) => {()=>{}}
// const asyncHandler = (func) => ()=>{}
// const asyncHandler = (func) => async ()=>{}
// const asyncHandler = (func)=> async (req, res, next)=>{
//         try {
//             await func(req,res,next);
//         } catch (error) {
//             // 
//             res.status(error.code || 500).json({
//                 success:false,
//                 message:error.message
//             })
//         }
//     }
