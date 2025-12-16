const crypto = require("crypto");
const { exec } = require("child_process");

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log(process.env.ADMIN_EMAIL, "Log: Checking environment variables");

    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Email, password, and role are required." });
    }

    // Super Admin login check
    if (role === "superAdmin") {
      if (
        email === process.env.SUPER_ADMIN_EMAIL &&
        password === process.env.SUPER_ADMIN_PASSWORD
      ) {
        return res
          .status(200)
          .json({ message: "Logged in as Super Admin", role: "superAdmin" });
      } else {
        return res
          .status(403)
          .json({ message: "Invalid credentials for Super Admin" });
      }
    }

    // Admin login check
    if (role === "admin") {
      if (
        email === process.env.ADMIN_EMAIL &&
        password === process.env.ADMIN_PASSWORD
      ) {
        return res
          .status(200)
          .json({ message: "Logged in as Admin", role: "admin" });
      } else {
        return res
          .status(403)
          .json({ message: "Invalid credentials for Admin" });
      }
    }

    // If the role is neither "superAdmin" nor "admin"
    return res.status(403).json({ message: "Invalid role specified." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.deployefrontend = async (req, res) => {
  try {
    // 1. Signature verify

    const secret = "My$uperS3cretKey123!"; // GitHub webhook secret
    const signature = req.headers["x-hub-signature-256"];

    const digest =
      "sha256=" +
      crypto.createHmac("sha256", secret).update(req.rawBody).digest("hex");

    if (signature !== digest) {

      console.log("Invalid signature-----------:", signature, digest);

      return res.status(403).json({ message: "Invalid signature" });
    }

    // 2. Deploy command
    const deployCommand = `
      cd /var/www/html/base2brand &&
      git reset --hard &&
      git pull origin main &&
      npm run build &&
      pm2 restart base2brand
    `;

    // 3. Execute command
    exec(deployCommand, (error, stdout, stderr) => {
      if (error) {
        console.error("Deployment Error:", stderr || error.message);
        return res.status(500).json({
          message: "Deployment failed",
          error: stderr || error.message,
        });
      }

      console.log("Deployment Output:----------", stdout);
      return res.status(200).json({ message: "Frontend deployed successfully!" });
    });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.deployeBackend = async (req, res) => {
  try {
    // 1️⃣ Verify GitHub webhook signature
    const secret = "My$uperS3cretKey1234#@!"; // GitHub webhook secret
    const signature = req.headers["x-hub-signature-256"];

    const digest =
      "sha256=" +
      crypto.createHmac("sha256", secret).update(req.rawBody).digest("hex");

    if (signature !== digest) {
      console.log("Invalid signature:", signature, digest);
      return res.status(403).json({ message: "Invalid signature" });
    }

    console.log("✅ Signature verified. Starting backend deployment...");

    // 2️⃣ Deployment command
    const deployCommand = `
      cd /var/www/html/base2brandBackend &&
      git reset --hard &&
      git pull origin main &&
      pm2 restart server.js
    `;

    // 3️⃣ Execute deployment
    exec(deployCommand, (error, stdout, stderr) => {
      if (error) {
        console.error("Deployment Error:", stderr || error.message);
        return res.status(500).json({
          message: "Backend deployment failed",
          error: stderr || error.message,
        });
      }

      console.log("Deployment Output:\n", stdout);
      return res.status(200).json({ message: "Backend deployed successfully!" });
    });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
