
import * as config from "../config.js";
import { SendEmail } from "../utils/SendEmail.js"
import jwt, { decode } from "jsonwebtoken"
import { hashPassword, comparePassword } from '../helpers/auth.js'
import User from "../models/user.js";
import { nanoid } from "nanoid";
import validator from "email-validator";
import bcrypt from "bcrypt";


export const weclome = (req, res)=>{
    res.json({
        data: "hello from nodejs Real estate api  "
    })
}
    const style1=`
        background: #eee;
        padding: 20px;
        width: 600px;
        height:500px;
        display:flex
        justify-content: center;
        align-items:center;
        text-align:center;

    `

export const preRegister=async (req, res)=>{

    try{
        //  console.log(req.body)
        const {email, password}= req.body;

        // VALIDATION 
        if(!validator.validate( email) ){
            return res.json({ error: " A validate email is Required ! "})
        }
        if(!password ){
            return res.json({ error: " Password is Required ! "})
        }
        if(password && password?.length< 6 ){
            return res.json({ error: " Password should be at least characters ! "})
        }
        const user = await User.findOne({ email });
        if(user){
            return res.json({ error:"Email is taken before !" })
        }

        // create token
        const token = jwt.sign({email,password }, config.JWT_SECRET , {
            expiresIn:"1h",
        } )
        function getCurrentDayHourMinute() {
            const currentDate = new Date();
            const hours = currentDate.getHours(); 
            const minutes = currentDate.getMinutes();
            return {
                
                hours: hours,
                minutes: minutes
            };
        }

         const message = 
             `  <div style="${style1}" >
                    <h2>Welcome to Realiste app</h2>
                    <p style="color:" >Please check the link below to activate Your Account (valid 1 heur )..</p>
                    <a style='font-size:"28px"' href="${config.CLIENT_URL}/auth/account-activate/${token}" >Activate My Account</a>
                    <p>&copy; ${getCurrentDayHourMinute().hours  }: ${getCurrentDayHourMinute().minutes} </p>
                  
                </div>
            `
        
                ;

            await SendEmail( {
                email: req.body.email, 
                subject:'Register in Marketplace app..!',
                message,
                } );

            return res.json({ ok:true, message: "check your email" });
      

    } catch(err){
        console.log(err)
        return res.json({ error:"Something went wrong try again .." })
    }

}   

 export const register=async (req, res)=>{

        try{

            // console.log(req.body);
            const { email,password } = jwt.verify(req.body.token , config.JWT_SECRET);
            // console.log(decoded);
            const hasedPassword= await hashPassword(password);

            const user= await new User({
                username: nanoid(6),
                email,
                password:hasedPassword,

            });
            user.save();
            
            // Generate Token
            const token = jwt.sign({ _id : user._id } ,config.JWT_SECRET, {
                expiresIn: "1h"
            } );
            const refreshToken= jwt.sign({_id: user._id} , config.JWT_SECRET, {
                expiresIn : "7d"
            });

            //user.password= undefined;
            //  user.resetCode = undefined

            return res.json( {
                token , 
                refreshToken, 
                user: {
                    // Copiez tous les champs de l'objet user, sauf le champ password
                    ...user._doc,
                    password: undefined // Supprime le champ password
                }
            })

        } catch(err){
            console.log(err)
        }

 }

export const login=async(req , res)=>{

    try{
        // code ici
        const { email, password }= req.body;
        
        if(!validator.validate( email) ){
            return res.json({ error: " A validate email is Required ! "})
        }
        // 1 find user by email
        const user= await User.findOne({email});
        //2 compare passwod 

        if(!user || !(await comparePassword(password, user.password)) ){
            return res.json({error:"email or password is incorrecte"});
        }
        //3 create jwt token
        const token = jwt.sign({ _id : user._id } ,config.JWT_SECRET, {
            expiresIn: "7d"
        } );
        const refreshToken= jwt.sign({_id: user._id} , config.JWT_SECRET, {
            expiresIn : "30d"
        });
        // 4 send the response
        return res.json( {
            token , 
            refreshToken, 
            user: {
                ...user._doc,
                password: undefined , 
                resetCode:undefined,
            }
        })

    } catch(err){
        console.log(err)
        return res.json({ error: "Something went wrong .Try again"});
    }

}

export const forgotPassword=async(req, res)=>{

    try {

         const { email }= req.body;
         // validate
         if(!validator.validate( email) ){
            return res.json({ error: " A validate email is Required ! "})
        }
        const user= await User.findOne({ email });
        if(!user){
            return res.json({ errr:"Could not find user with this email !" })
        } else{
            const resetCode= nanoid();
            user.resetCode = resetCode;
            user.save();

            const token = jwt.sign({ resetCode} , config.JWT_SECRET , {
                expiresIn:"10m"
            })

            const message = 
            `  <div style="background:#ddd; padding:30px;text-align:center;border-radius:20px" >
                   <h2>Welcome to Realiste app</h2>
                   <h3 style="color:red" >Please check the link to Access a Your Account (valid 10 minute )..</h3>
                   <a style='font-size:25px' href="${config.CLIENT_URL}/auth/access-account/${token}" >Access a your Account</a>
                 
               </div>
           `
       
               ;

           await SendEmail( {
               email: req.body.email, 
               subject:' Access a Your Account.!',
               message,
               } );
               return res.json({ ok:true, message: "check your email" });
        }

    } catch(err){
        console.log(err)
    }

}

export const accessAccount= async(req, res)=>{

    try {
         
        const { resetCode}= jwt.verify(req.body.resetCode , config.JWT_SECRET);
        
        const user= await User.findOneAndUpdate( {resetCode}, { resetCode:"" } )

        // create jwt token
           const token = jwt.sign({ _id : user._id } ,config.JWT_SECRET, {
            expiresIn: "1h"
        } );
        const refreshToken= jwt.sign({_id: user._id} , config.JWT_SECRET, {
            expiresIn : "7d"
        });

         //  send the response
         return res.json( {
            token , 
            refreshToken, 
            user: {
                ...user._doc,
                password: undefined , 
                resetCode:undefined,
                }
            })

    }catch(err){
        console.log(err)
    }

}

export const refreshToken=async( req, res )=>{
    try{

        const {_id}= jwt.verify(req.headers.refresh_token, config.JWT_SECRET);
        const user= await User.findById(_id);

        // GENERATE TOKen 
        const token = jwt.sign({ _id : user._id } ,config.JWT_SECRET, {
            expiresIn: "1h"
        } );
        const refreshToken= jwt.sign({_id: user._id} , config.JWT_SECRET, {
            expiresIn : "7d"
        });
        // 4 send the response
        return res.json( {
            token , 
            refreshToken, 
            user: { 
                ...user._doc,
                password: undefined , 
                resetCode:undefined,
            }
        })

    }catch(err){
        console.log(err)
        res.status(403).json({error:"Refresh token failed"})
    }

}

export const getCurrentUser = async(req ,res)=>{
    try {       

        const user= await User.findById(req.user._id);
         //  send the response
         return res.json( {
            user: { 
                ...user._doc,
                password: undefined , 
                resetCode:undefined,
            }
        })

    }catch(err){
        console.log(err)
        return res.status(403).json({error:"Unauhorized"});
    }

}

export const publicProfile= async(req ,res)=>{
    try{
            
        const user = await User.findOne({ username:req.params.username });
        return res.json( {
            user: { 
                ...user._doc,
                password: undefined , 
                resetCode:undefined,
            }
        })
    }catch(err){
        console.log(err)
        return res.json({error:"User Not found"});
    }
}

export const updatePassword=async(req, res)=>{
    try{
        const {password }= req.body;
        if(!password){
            return res.json({error:"Password is Required"});
        }
        if(password && password?.length <6 ){
            return res.json({error:"Password should be min 6 characters"});
        }

        const user = await User.findByIdAndUpdate(req.user._id, {
            password: await hashPassword(password),
        } )

        res.json({message:"password update successfuly"});

    } catch(err){
        console.log(err)
    }
}

export const updateProfile= async(req, res)=>{

    try{
        const user= await User.findByIdAndUpdate(req.user._id , req.body ,{ new:true});

        return res.json( {
            user: { 
                ...user._doc,
                password: undefined , 
                resetCode:undefined,
            }
        })
    }catch(err){
        console.log(err)
        if(err.codeName ==="DuplicateKey"){
            return res.json({error:"username or email is already taken "})
        }else{
            return res.status(403).json({error:"Unauhorized"});
        }
    }

}


// https://www.youtube.com/watch?v=lKE-cy9zoXw&pp=ygVe2YPZitmB2YrYqSDYpdix2LPYp9mEINin2YTYqNix2YrYryDYp9mE2KXZhNmD2KrYsdmI2YbZiiDYqNin2LPYqtiu2K_Yp9mFIEFXUyBTRVMgbm9kZWpzICByYWJpYw%3D%3D