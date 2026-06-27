const User = require("../models/user");

module.exports.renderSignupForm = (req, res) => {
    res.render("./users/signup.ejs");
};

module.exports.signup = async(req, res) => {
    try{
        let {username, email, password} = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err) =>{
        if(err){
            return next(err);
        }
        req.flash("success", "Welcome to DwellGrid");
        res.redirect("/listings");
    });
    
    } catch(e){
        req.flash("error", e.message);
        res.redirect("/signup");
    }
    
};

module.exports.renderLoginForm = (req,res) =>{
    res.render("./users/login.ejs");
};

module.exports.login = async (req, res, next) => {
    // Set a flash message and redirect the user after successful login.
    // Using only one response method avoids "ERR_HTTP_HEADERS_SENT".
    req.flash('success', 'Welcome back!');
    const redirectUrl = (req.locals && req.locals.RedirectUrl) ? req.locals.RedirectUrl : '/listings';
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res) => {
    req.logout((err) => {
        if(err){
            next(err);
        }
        req.flash("success", "you are logged out");
        res.redirect("/listings");
    })
};