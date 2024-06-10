import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'


    // Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: CLOUDINARY_API_KEY, 
    api_secret: CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});


const uploadOnCloudinary = async (loaclfile) =>{
    try {
        if(!loaclfile) return null

       const response =  await cloudinary.uploader.upload(loaclfile, {
            resource_type: "auto"
        })

        console.log("success");

        return response;


        
    } catch (error) {
        fs.unlinkSync(loaclfile)// remove the local save temp files as upload got failed 
        return null
    }
}

export {uploadOnCloudinary}