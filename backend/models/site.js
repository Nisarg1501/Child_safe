const mongoose = require("mongoose");


const siteSchema = new mongoose.Schema({
    child_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    }, 
    
    site_url: { 
        type: String, 
        required: true 
    }, 
    
    added_by: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    }, 
    
    reason: { 
        type: String 
    }, 
    
    created_at: { 
        type: Date, 
        default: Date.now 
    }, 
});

module.exports = mongoose.model("Site", siteSchema);
