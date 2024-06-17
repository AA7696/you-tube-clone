import { Router } from "express";
import {upload} from '../middleware/muter.middleware.js'
import  {changeCurrentPassword, getCurrentUser, getUserProfile, getWatchHistory, loggedOut, loginUser, refreshAccessToken, registerUser, updateAccountDetails, updateAvatar, updateCoverImage}  from "../controller/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

router.post('/register',
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1,
        }
    ]),
     registerUser )

router.post('/login', loginUser)

// secure routes 

router.post('/logout',verifyJWT, loggedOut) 

router.post('/refresf-token', refreshAccessToken)

router.post('/change-password', verifyJWT, changeCurrentPassword)

router.get('/current-user', verifyJWT, getCurrentUser)

router.patch('/update-user', verifyJWT, updateAccountDetails)

router.patch('/avatar', verifyJWT, upload.single("avatar"), updateAvatar)

router.patch('/cover-image', upload.single("coverImage"), updateCoverImage)

router.get('/c/:username', verifyJWT, getUserProfile)

router.get('/history', verifyJWT, getWatchHistory)

export default router 