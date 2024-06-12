import { Router } from "express";
import {upload} from '../middleware/muter.middleware.js'

import  registerUser  from "../controller/user.controller.js";

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

export default router 