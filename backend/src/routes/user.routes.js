import { Router } from "express";
import {upload} from '../middleware/muter.middleware.js'
import  {loggedOut, loginUser, refreshAccessToken, registerUser}  from "../controller/user.controller.js";
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

export default router 