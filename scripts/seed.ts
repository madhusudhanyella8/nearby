import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/nearby";

// --- Schemas (inline to avoid path alias issues in scripts) ---

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  icon: { type: String, default: "🏪" },
});

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, default: "" },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "agent", "business_owner", "user"],
      default: "user",
    },
    mustChangePassword: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const BusinessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true, lowercase: true },
    area: { type: String, required: true, lowercase: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BusinessSchema.index({ location: "2dsphere" });
BusinessSchema.index({ name: "text", description: "text" });

const FavoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
  },
  { timestamps: true }
);

const RequestSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["new_business", "role_upgrade"], required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    businessDetails: {
      name: String, description: String, category: String,
      phone: String, address: String, city: String, area: String,
      latitude: Number, longitude: Number,
    },
    upgradeReason: String,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewNote: String,
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", CategorySchema);
const User = mongoose.model("User", UserSchema);
const Business = mongoose.model("Business", BusinessSchema);
const Favorite = mongoose.model("Favorite", FavoriteSchema);
const Request = mongoose.model("Request", RequestSchema);

// --- Seed Data ---

const categories = [
  { name: "Restaurants", slug: "restaurants", icon: "🍽️" },
  { name: "Grocery", slug: "grocery", icon: "🛒" },
  { name: "Electronics", slug: "electronics", icon: "📱" },
  { name: "Medical", slug: "medical", icon: "🏥" },
  { name: "Clothing", slug: "clothing", icon: "👕" },
  { name: "Jewelry", slug: "jewelry", icon: "💎" },
];

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected!");

  // Clear existing data
  await Category.deleteMany({});
  await User.deleteMany({});
  await Business.deleteMany({});
  await Favorite.deleteMany({});
  await Request.deleteMany({});
  console.log("Cleared existing data.");

  // Seed categories
  const cats = await Category.insertMany(categories);
  console.log(`Seeded ${cats.length} categories.`);

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create admin
  const admin = await User.create({
    name: "VIPANI Admin",
    email: "admin@vipani.com",
    password: hashedPassword,
    role: "admin",
  });

  // Create field agent (created by admin)
  const agent = await User.create({
    name: "Field Agent Ravi",
    email: "agent@vipani.com",
    phone: "+91 99999 00001",
    password: hashedPassword,
    role: "agent",
    createdBy: admin._id,
  });

  // Create business owner (created by agent, password already changed for demo)
  const owner = await User.create({
    name: "Demo Business Owner",
    email: "owner@demo.com",
    password: hashedPassword,
    role: "business_owner",
    mustChangePassword: false, // false for demo convenience
    createdBy: agent._id,
  });

  // Create end user
  await User.create({
    name: "Demo User",
    email: "user@demo.com",
    password: hashedPassword,
    role: "user",
  });

  console.log("Seeded 4 demo users:");
  console.log("  Admin:          admin@vipani.com / password123");
  console.log("  Field Agent:    agent@vipani.com / password123");
  console.log("  Business Owner: owner@demo.com / password123");
  console.log("  End User:       user@demo.com / password123");

  // Seed sample businesses in Bangalore
  const catMap = Object.fromEntries(cats.map((c) => [c.slug, c._id]));

  const businesses = [
    {
      name: "Sri Lakshmi Gold Palace",
      description: "Premium gold and diamond jewelry. Trusted since 1990. BIS hallmarked gold ornaments.",
      category: catMap["jewelry"],
      phone: "+91 98765 43210",
      address: "45, Commercial Street",
      city: "bangalore",
      area: "shivajinagar",
      location: { type: "Point", coordinates: [77.6070, 12.9816] },
      rating: 4.5,
      reviewCount: 120,
    },
    {
      name: "Kaveri Gold House",
      description: "Wide collection of gold, silver, and platinum jewelry for all occasions.",
      category: catMap["jewelry"],
      phone: "+91 98765 43211",
      address: "12, Chickpet Main Road",
      city: "bangalore",
      area: "chickpet",
      location: { type: "Point", coordinates: [77.5773, 12.9687] },
      rating: 4.2,
      reviewCount: 85,
    },
    {
      name: "Bangalore Fresh Mart",
      description: "Fresh vegetables, fruits, and daily essentials. Free delivery above Rs 500.",
      category: catMap["grocery"],
      phone: "+91 98765 43212",
      address: "78, 80 Feet Road",
      city: "bangalore",
      area: "koramangala",
      location: { type: "Point", coordinates: [77.6245, 12.9352] },
      rating: 4.0,
      reviewCount: 200,
    },
    {
      name: "Spice Garden Restaurant",
      description: "Authentic South Indian cuisine. Famous for our dosas and biryanis.",
      category: catMap["restaurants"],
      phone: "+91 98765 43213",
      address: "23, 100 Feet Road",
      city: "bangalore",
      area: "indiranagar",
      location: { type: "Point", coordinates: [77.6408, 12.9784] },
      rating: 4.3,
      reviewCount: 350,
    },
    {
      name: "MedPlus Pharmacy",
      description: "24/7 pharmacy with all prescription and OTC medicines. Free health check-ups on weekends.",
      category: catMap["medical"],
      phone: "+91 98765 43214",
      address: "5, MG Road",
      city: "bangalore",
      area: "mg road",
      location: { type: "Point", coordinates: [77.6065, 12.9757] },
      rating: 4.1,
      reviewCount: 90,
    },
    {
      name: "Tech World Electronics",
      description: "Latest smartphones, laptops, and accessories. Authorized service center.",
      category: catMap["electronics"],
      phone: "+91 98765 43215",
      address: "156, SP Road",
      city: "bangalore",
      area: "sp road",
      location: { type: "Point", coordinates: [77.5825, 12.9830] },
      rating: 3.8,
      reviewCount: 150,
    },
    {
      name: "Fashion Hub",
      description: "Trendy clothing for men, women, and kids. Affordable prices, latest styles.",
      category: catMap["clothing"],
      phone: "+91 98765 43216",
      address: "89, Brigade Road",
      city: "bangalore",
      area: "brigade road",
      location: { type: "Point", coordinates: [77.6066, 12.9716] },
      rating: 3.9,
      reviewCount: 75,
    },
    {
      name: "Green Basket Organics",
      description: "100% organic groceries. Farm-fresh produce delivered daily.",
      category: catMap["grocery"],
      phone: "+91 98765 43217",
      address: "34, HSR Layout",
      city: "bangalore",
      area: "hsr layout",
      location: { type: "Point", coordinates: [77.6500, 12.9116] },
      rating: 4.6,
      reviewCount: 60,
    },
  ];

  const created = await Business.insertMany(
    businesses.map((b) => ({ ...b, owner: owner._id }))
  );
  console.log(`Seeded ${created.length} sample businesses in Bangalore.`);

  await mongoose.disconnect();
  console.log("\nDone! Run the app with 'npm run dev'");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
