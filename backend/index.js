const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("./models/User");
const Site = require("./models/site");
const ActivityUser = require("./models/activitySchema");
const Suggestion = require("./models/childSuggestion");
const cors = require("cors");
const app = express();
const crypto = require("crypto");
const sendEmail = require("./services/emailServices");
const moment = require("moment");

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "chrome-extension://mlllacghckcehmkdamaoklbilmpkfmfp",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

mongoose
  .connect(
    // "mongodb+srv://ankit:ankit497@cluster0.0jb5c.mongodb.net/parentControll",
    "mongodb+srv://ankit:ankit497@cluster0.rqgnc.mongodb.net/parentControll",
    // "mongodb+srv://yash1503:yash1503@cluster0.0urevo0.mongodb.net/parentcontrol",
    // "mongodb+srv://jayjethwa333:fP5B5xBDjfTKZUyS@cluster0.vjwtu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user object
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    // Send email notification
    const subject = "Welcome to Parental Control Dashboard";
    const message = `Hello, \n\nYour account has been successfully registered with email: ${email}. \n\nThank you for signing up!`;
    await sendEmail(email, subject, message);

    res.status(201).json({ message: "User Registered" });
  } catch (error) {
    console.error("Error during registration: ", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password, location } = req.body; // Retrieve location from the request body
  let websites = [];
  try {
    const user = await User.findOne({ email: new RegExp(`^${email}$`, "i") });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    user.lastLoginLocation = location;
    user.lastLoginDate = new Date();
    await user.save();

    res.cookie("session", email, { httpOnly: true });
    const subject = "Login Alert";
    const message = `Hello, \n\nYour account has been logged in from ${location} on ${user.lastLoginDate}. If this was not you, please secure your account.`;
    await sendEmail(email, subject, message);

    if (user.role === "child") {
      websites = await Site.find({ child_id: user._id }).select(
        "-__v -created_at"
      );
    }

    res.status(200).json({
      message: "Login successful",
      email: user.email,
      role: user.role,
      id: user._id,
      lastLoginLocation: user.lastLoginLocation,
      lastLoginDate: user.lastLoginDate,
      websites,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/parent/add-child", async (req, res) => {
  const { parentEmail, childEmail, childPassword, childName } = req.body;

  if (!parentEmail || !childEmail || !childPassword || !childName) {
    return res.status(400).json({
      message:
        "Parent email, child email,child name and child password are required",
    });
  }

  try {
    const parentUser = await User.findOne({
      email: parentEmail,
      role: "parent",
    });
    if (!parentUser) {
      return res
        .status(403)
        .json({ message: "Unauthorized or invalid parent user" });
    }

    const existingChild = await User.findOne({ email: childEmail });
    if (existingChild) {
      return res
        .status(400)
        .json({ message: "Child with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(childPassword, 10);
    const newChild = new User({
      email: childEmail,
      password: hashedPassword,
      role: "child",
      parent_id: parentUser._id,
      name: childName,
    });

    await newChild.save();
    const subject = "Welcome to Parental Control Dashboard";
    const message = ` <h3>Welcome ${childName}!</h3>
        <p>Your account has been successfully created by your parent.</p>
        <p>Here are your login details:</p>
        <ul>
          <li><strong>Email:</strong> ${childEmail}</li>
          <li><strong>Password:</strong> The one you set during registration.</li>
        </ul>
        <p>Please do not share your password with anyone.</p>
        <p>Enjoy your safe browsing experience!</p>
        <br />
        <p>Best regards,<br />Parental Control Dashboard Team</p>`;
    await sendEmail(childEmail, subject, message);
    res.status(201).json({ message: "Child account created successfully" });
  } catch (error) {
    console.error("Error adding child:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/block-site", async (req, res) => {
  const { child_id, site_url, parent_id } = req.body;

  if (!child_id || !site_url) {
    return res
      .status(400)
      .json({ message: "Child ID and site URL are required." });
  }

  try {
    const child = await User.findOne({
      _id: child_id,
      parent_id: parent_id,
      role: "child",
    });
    if (!child) {
      return res.status(404).json({
        message: "Child not found or not associated with this parent.",
      });
    }

    const blockedSite = new Site({
      child_id,
      site_url,
      added_by: parent_id,
    });

    await blockedSite.save();
    res
      .status(201)
      .json({ message: "Site blocked successfully for the child." });
  } catch (error) {
    console.error("Error blocking site:", error);
    res
      .status(500)
      .json({ message: "Failed to block site. Please try again." });
  }
});
app.post("/api/parent/children-blocked-sites", async (req, res) => {
  const parent_id = req.body.userId; // Assume userId is added by auth middleware
  console.log(req.body);
  try {
    const childrenWithBlockedSites = await User.aggregate([
      {
        $match: {
          parent_id: new mongoose.Types.ObjectId(parent_id),
          role: "child",
        },
      },
      {
        $lookup: {
          from: "sites",
          localField: "_id",
          foreignField: "child_id",
          as: "blocked_sites",
        },
      },
      {
        $project: {
          email: 1,
          name: 1,
          lastLoginLocation: 1,
          lastLoginDate: 1,
          weeklyLimit: 1,
          dailyLimit: 1,
          cityName: 1,
          activeHours: 1,
          blocked_sites: { _id: 1, site_url: 1, reason: 1, created_at: 1 },
        },
      },
    ]);

    if (childrenWithBlockedSites.length === 0) {
      return res.status(200).json({
        message: "No children or blocked sites found for this parent.",
      });
    }

    res.status(200).json({ children: childrenWithBlockedSites });
  } catch (error) {
    console.error("Error fetching children and blocked sites:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch data. Please try again." });
  }
});

app.delete("/api/parent/delete-child/:childId", async (req, res) => {
  console.log(req.params);
  const { childId } = req.params;

  try {
    const child = await User.findOne({ _id: childId, role: "child" });
    if (!child) {
      return res.status(404).json({
        message: "Child not found or not associated with this parent.",
      });
    }

    await Site.deleteMany({ child_id: child._id });

    await User.deleteOne({ _id: child._id });

    res.status(200).json({
      message: "Child and associated blocked sites deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting child:", error);
    res
      .status(500)
      .json({ message: "Failed to delete child. Please try again." });
  }
});

app.delete("/api/parent/delete-blocked-site/:siteId", async (req, res) => {
  const parent_id = req.userId;
  const { siteId } = req.params;

  try {
    const blockedSite = await Site.findOne({ _id: siteId });
    if (!blockedSite) {
      return res.status(404).json({
        message: "Blocked site not found or not associated with this parent.",
      });
    }

    await Site.deleteOne({ _id: siteId });

    res.status(200).json({ message: "Blocked site deleted successfully." });
  } catch (error) {
    console.error("Error deleting blocked site:", error);
    res
      .status(500)
      .json({ message: "Failed to delete blocked site. Please try again." });
  }
});

app.post("/api/parent/set-time-limit", async (req, res) => {
  const { childId, dailyLimit, weeklyLimit } = req.body;

  try {
    await User.updateOne(
      { _id: childId, role: "child" },
      {
        $set: {
          dailyLimit,
          weeklyLimit,
        },
      }
    );
    res.status(200).json({ message: "Time limits updated successfully" });
  } catch (error) {
    console.error("Error setting time limit:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/child/content-suggestions", async (req, res) => {
  const { childId } = req.body;

  if (!childId) {
    return res.status(400).json({ error: "Child ID is required" });
  }

  try {
    const suggestions = await Suggestion.find({ child_id: childId });

    res.json({ suggestions: suggestions || [] });
  } catch (error) {
    console.error("Error fetching content suggestions:", error);
    res.status(500).json({ error: "Failed to fetch content suggestions" });
  }
});

app.post("/api/parent/add-suggestion", async (req, res) => {
  const { parentId, childId, title, description, link, category } = req.body;

  // Validate input
  if (!parentId || !childId || !title || !description || !link) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Ensure the parent is authorized to add a suggestion for the child
    const parent = await User.findOne({ _id: parentId, role: "parent" });
    if (!parent) {
      return res.status(403).json({ message: "Unauthorized parent" });
    }

    const child = await User.findOne({
      _id: childId,
      parent_id: parent._id,
      role: "child",
    });
    if (!child) {
      return res.status(404).json({
        message: "Child not found or not associated with this parent",
      });
    }

    const newSuggestion = new Suggestion({
      child_id: childId,
      title,
      description,
      link,
      category,
    });

    await newSuggestion.save();
    res.status(201).json({ message: "Suggestion added successfully" });
  } catch (error) {
    console.error("Error adding suggestion:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: new RegExp(`^${email}$`, "i") });

  if (!user) return res.status(404).json({ message: "User not found" });

  const token = crypto.randomBytes(32).toString("hex");
  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 3600000; 
  await user.save();

  const resetLink = `http://localhost:3000/reset-password/${token}`;
  const subject = "Password Reset Request";
  const message = `<p>You requested a password reset. Click <a href="${resetLink}">here</a> to reset your password.</p>`;

  await sendEmail(email, subject, message);

  res.status(200).json({ message: "Password reset link sent to your email" });
});

app.post("/api/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({ message: "Invalid or expired token" });

  user.password = await bcrypt.hash(password, 10);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  res.status(200).json({ message: "Password reset successfully" });
});
app.post("/api/child/update-usage", async (req, res) => {
  const { childId, activeTime } = req.body;
  if (!childId || activeTime === undefined) {
    return res.status(400).json({ error: "Invalid data" });
  }

  try {
    const user = await User.findById(childId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.usage.today = activeTime;
    await user.save();

    res.status(200).json({ message: "Active time updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/blocked-sites/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const blockedSites = await Site.find({ child_id: id }).select("site_url");

    if (blockedSites.length === 0) {
      return res
        .status(200)
        .json({ message: "No blocked sites found for this user." });
    }

    res.status(200).json({
      message: "Blocked sites retrieved successfully",
      blockedSites,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/activity", async (req, res) => {
  const { userId, url, timeSpent } = req.body;

  const activity = new ActivityUser({
    userId,
    url,
    timeSpent,
    timestamp: new Date(),
  });

  try {
    await activity.save();
    res.status(200).json({ message: "Activity saved" });
  } catch (error) {
    console.error("Error saving activity:", error);
    res.status(500).send("Error saving activity");
  }
});

// Backend example using Node.js and Express
app.get("/api/user-activity/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const activities = await ActivityUser.find({ userId }).sort({
      timestamp: 1,
    }); // Sort by time
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});
app.get("/api/getChildLimits/:userId", async (req, res) => {
  const child_id = req.params.userId;

  try {
    const child = await User.findById(child_id);

    if (!child) {
      return res.status(200).json({ message: "Child not found." });
    }

    if (child.role !== "child") {
      return res.status(200).json({ message: "User is not a child." });
    }

    const blockedSites = await Site.find({ child_id }).select(
      "site_url reason"
    );

    const response = {
      dailyLimit: child.dailyLimit,
      weeklyLimit: child.weeklyLimit,
      usage: child.usage,
      activeHours: child.activeHours,
      blockedSites: blockedSites.map((site) => ({
        url: site.site_url,
        reason: site.reason,
      })),
    };

    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred.", error });
  }
});
app.post("/api/update-usage",async(req,res)=>{
  const { userId, increment } = req.body; // `increment` in minutes

  if (!userId || !increment) {
    return res.status(400).json({ message: "User ID and increment are required" });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = moment();
    const lastReset = moment(user.usage.lastReset);

    if (!lastReset.isSame(now, "day")) {
      user.usage.today = 0; 
    }

    if (!lastReset.isSame(now, "week")) {
      user.usage.week = 0; 
    }

    user.usage.today += increment;
    user.usage.week += increment;
    user.usage.lastReset = now;

    await user.save();

    return res.status(200).json({ message: "Usage updated successfully", usage: user.usage });
  } catch (error) {
    console.error("Error updating usage:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
})

app.post("/api/update-last-reset", async (req, res) => {
  const { userId, resetDate } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    user.usage.today = 0;
    user.usage.lastReset = resetDate;
    await user.save();

    res.status(200).json({ message: "Last reset updated successfully." });
  } catch (error) {
    console.error("Error updating last reset:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Start server
app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
