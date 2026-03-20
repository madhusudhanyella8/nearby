import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://madhusudhanyella8_db_user:E6KbeBlWA21avzv6@cluster0.hxqbiig.mongodb.net/vipani?retryWrites=true&w=majority";

// --- Schemas (inline to avoid path alias issues in scripts) ---

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  icon: { type: String, default: "🏪" },
});

const PermissionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    navLink: {
      label: { type: String, required: true },
      href: { type: String, required: true },
    },
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
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
    photos: {
      type: [{ url: String, publicId: String }],
      default: [],
    },
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
const Permission = mongoose.model("Permission", PermissionSchema);
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

const systemPermissions = [
  {
    key: "admin_panel",
    name: "Admin Panel",
    description: "Access to admin dashboard, user management, and business management",
    navLink: { label: "Admin Panel", href: "/admin" },
    isSystem: true,
    isActive: true,
  },
  {
    key: "agent_panel",
    name: "Agent Panel",
    description: "Access to field agent dashboard, business registration, and request management",
    navLink: { label: "Agent Panel", href: "/agent" },
    isSystem: true,
    isActive: true,
  },
  {
    key: "business_panel",
    name: "Business Panel",
    description: "Access to business management and request tracking",
    navLink: { label: "Business Panel", href: "/business-panel" },
    isSystem: true,
    isActive: true,
  },
];

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected!");

  // Drop stale indexes that may exist from old schema
  const db = mongoose.connection.db!;
  try {
    await db.collection("users").dropIndex("email_1");
    console.log("Dropped stale email_1 index.");
  } catch {
    // Index doesn't exist — fine
  }
  try {
    await db.collection("users").dropIndex("password_1");
  } catch {
    // Index doesn't exist — fine
  }

  // Clear existing data
  await Category.deleteMany({});
  await Permission.deleteMany({});
  await User.deleteMany({});
  await Business.deleteMany({});
  await Favorite.deleteMany({});
  await Request.deleteMany({});
  console.log("Cleared existing data.");

  // Seed categories
  const cats = await Category.insertMany(categories);
  console.log(`Seeded ${cats.length} categories.`);

  // Seed permissions
  const perms = await Permission.insertMany(systemPermissions);
  const permMap = Object.fromEntries(perms.map((p) => [p.key, p._id]));
  console.log(`Seeded ${perms.length} system permissions.`);

  // Create admin
  const admin = await User.create({
    name: "VIPANI Admin",
    phone: "9999900000",
    permissions: [permMap["admin_panel"]],
  });

  // Create field agent (created by admin)
  const agent = await User.create({
    name: "Field Agent Ravi",
    phone: "9999900001",
    permissions: [permMap["agent_panel"]],
    createdBy: admin._id,
  });

  // Create business owner (created by agent)
  const owner = await User.create({
    name: "Demo Business Owner",
    phone: "9999900002",
    permissions: [permMap["business_panel"]],
    createdBy: agent._id,
  });

  // Create end user
  await User.create({
    name: "Demo User",
    phone: "9999900003",
    permissions: [],
  });

  console.log("Seeded 4 demo users (login via OTP):");
  console.log("  Admin:          9999900000");
  console.log("  Field Agent:    9999900001");
  console.log("  Business Owner: 9999900002");
  console.log("  End User:       9999900003");

  // Seed sample businesses in Bangalore
  const catMap = Object.fromEntries(cats.map((c) => [c.slug, c._id]));

  const businesses = [
    {
      name: "Sri Lakshmi Gold Palace",
      description: "Premium gold and diamond jewelry. Trusted since 1990. BIS hallmarked gold ornaments.",
      category: catMap["jewelry"],
      phone: "9876543210",
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
      phone: "9876543211",
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
      phone: "9876543212",
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
      phone: "9876543213",
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
      phone: "9876543214",
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
      phone: "9876543215",
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
      phone: "9876543216",
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
      phone: "9876543217",
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
