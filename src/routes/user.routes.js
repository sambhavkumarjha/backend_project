import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser)


//secured routes

router.route("/logout")
// is method ke pehle main kuch run karwana chahta hun
// yeh kuch nhi balki mere dwara he banaya gya ek middleware hoga 
// jo ki is method ke request mein ek user naam ki extra property add kar dega 
// jisko main phir logout kr dunga

.post(verifyJWT,logoutUser);
export default router;