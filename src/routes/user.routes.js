import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannnelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
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

router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT,changeCurrentPassword);
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);
router.route("/update-coverImage").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/c/:username").get(verifyJWT,getUserChannnelProfile)
router.route("/watch-history").get(verifyJWT,getWatchHistory)

export default router;