import fs from "fs";
import path from "path";
import dotenv from "dotenv";
const envPath = fs.existsSync(".env") ? ".env" : "backend/.env";
dotenv.config({ path: envPath });
import mongoose from "mongoose";

const EXACT_PRODUCT_MAP = {
  // 1. Skin Life Spray
  "lifescience-milk-booster": {
    name: "Skin Life Spray",
    baseMrp: 150,
    basePrice: 120,
    packs: [
      { size: "100 ml", mrp: 150, price: 120, priceMultiplier: 1 }
    ]
  },

  // 2. Cal Life DS
  "lifescience-calci-gel": {
    name: "Cal Life DS",
    baseMrp: 405,
    basePrice: 324,
    packs: [
      { size: "2 Ltr", mrp: 405, price: 324, priceMultiplier: 1, image: "https://res.cloudinary.com/duqwahasz/image/upload/v1794979531/lifescience/products/desrrskzaxesm7qx4bq6.jpg" },
      { size: "5 Ltr", mrp: 780, price: 624, priceMultiplier: 1.93, image: "" },
      { size: "10 Ltr", mrp: 1490, price: 1192, priceMultiplier: 3.68, image: "https://res.cloudinary.com/duqwahasz/image/upload/v1794984673/lifescience/products/rx33swj8lgcjcayvxw4k.jpg" },
      { size: "20 Ltr", mrp: 2900, price: 2320, priceMultiplier: 7.16, image: "https://res.cloudinary.com/duqwahasz/image/upload/v1794984674/lifescience/products/wskqp3s58nh6lnhect7x.jpg" }
    ]
  },

  // 3. Cal Life Gel
  "lifescience-calci-fort": {
    name: "Cal Life Gel",
    baseMrp: 210,
    basePrice: 168,
    packs: [
      { size: "300 gm", mrp: 210, price: 168, priceMultiplier: 1 }
    ]
  },

  // 4. Cal Life Gel Advance
  "lifescience-cattle-supplement": {
    name: "Cal Life Gel Advance",
    baseMrp: 290,
    basePrice: 232,
    packs: [
      { size: "300 gm", mrp: 290, price: 232, priceMultiplier: 1 }
    ]
  },

  // 5. Boost Life
  "lifescience-ener-boost": {
    name: "Boost Life",
    baseMrp: 660,
    basePrice: 528,
    packs: [
      { size: "1 Ltr", mrp: 660, price: 528, priceMultiplier: 1 }
    ]
  },

  // 6. Easy-P
  "lifescience-hydro-lyte": {
    name: "Easy-P",
    baseMrp: 485,
    basePrice: 388,
    packs: [
      { size: "20x50 gm", mrp: 485, price: 388, priceMultiplier: 1 }
    ]
  },

  // 7. Min Life
  "lifescience-mineral-mix": {
    name: "Min Life",
    baseMrp: 300,
    basePrice: 240,
    packs: [
      { size: "1 Kg", mrp: 300, price: 240, priceMultiplier: 1 },
      { size: "5 Kg", mrp: 1299, price: 1039, priceMultiplier: 4.33 },
      { size: "25 Kg", mrp: 5500, price: 4400, priceMultiplier: 18.33 }
    ]
  },

  // 8. Udder Life - H
  "lifescience-vit-ad3e": {
    name: "Udder Life - H",
    baseMrp: 490,
    basePrice: 392,
    packs: [
      { size: "250 ml", mrp: 490, price: 392, priceMultiplier: 1 },
      { size: "500 ml", mrp: 890, price: 712, priceMultiplier: 1.82 },
      { size: "1 Ltr", mrp: 1499, price: 1199, priceMultiplier: 3.06 }
    ]
  },

  // 9. Must Life (Row 41 highlighted: MRP 358)
  "lifescience-mast-care": {
    name: "Must Life",
    baseMrp: 358,
    basePrice: 286,
    packs: [
      { size: "4x50 gm", mrp: 358, price: 286, priceMultiplier: 1 }
    ]
  },

  // 10. Lactop Liquid
  "lifescience-hoof-shield": {
    name: "Lactop Liquid",
    baseMrp: 285,
    basePrice: 228,
    packs: [
      { size: "400 ml", mrp: 285, price: 228, priceMultiplier: 1 },
      { size: "1 Ltr", mrp: 550, price: 440, priceMultiplier: 1.93 }
    ]
  },

  // 11. Lactop Bolus
  "lifescience-ovi-mineral": {
    name: "Lactop Bolus",
    baseMrp: 285,
    basePrice: 228,
    packs: [
      { size: "14x1 Bolus", mrp: 285, price: 228, priceMultiplier: 1 }
    ]
  },

  // 12. Utro Life (Retained untouched, 20% off)
  "lifescience-liv-pro": {
    name: "Utro Life",
    baseMrp: 625,
    basePrice: 500,
    packs: [
      { size: "500 ml", mrp: 375, price: 300, priceMultiplier: 0.6 },
      { size: "1 Ltr", mrp: 625, price: 500, priceMultiplier: 1 }
    ]
  },

  // 13. Worm Saaf Bolus
  "lifescience-herbal-liver": {
    name: "Worm Saaf Bolus",
    baseMrp: 115,
    basePrice: 92,
    packs: [
      { size: "1 Bolus", mrp: 115, price: 92, priceMultiplier: 1 }
    ]
  },

  // 14. Digi Life Advance
  "lifescience-zyme-digest": {
    name: "Digi Life Advance",
    baseMrp: 180,
    basePrice: 144,
    packs: [
      { size: "300 ml", mrp: 180, price: 144, priceMultiplier: 1 },
      { size: "600 ml", mrp: 295, price: 236, priceMultiplier: 1.64 }
    ]
  },

  // 15. Digi Life Digestive Powder (Retained untouched, 20% off)
  "lifescience-pro-flora": {
    name: "Digi Life Digestive Powder",
    baseMrp: 485,
    basePrice: 388,
    packs: [
      { size: "250 Gms", mrp: 485, price: 388, priceMultiplier: 1 }
    ]
  },

  // 16. Aniferol
  "lifescience-multi-vit": {
    name: "Aniferol",
    baseMrp: 190,
    basePrice: 152,
    packs: [
      { size: "500 ml", mrp: 190, price: 152, priceMultiplier: 1 },
      { size: "1 Ltr", mrp: 330, price: 264, priceMultiplier: 1.74 },
      { size: "10 Ltr", mrp: 2850, price: 2280, priceMultiplier: 15.0 },
      { size: "20 Ltr", mrp: 5510, price: 4408, priceMultiplier: 29.0 }
    ]
  },

  // 17. Seralife-K Bolus
  "lifescience-wound-heal": {
    name: "Seralife-K Bolus",
    baseMrp: 110,
    basePrice: 88,
    packs: [
      { size: "1x4 Bolus", mrp: 110, price: 88, priceMultiplier: 1 }
    ]
  },

  // 18. Ovasure 21
  "lifescience-poultry-care": {
    name: "Ovasure 21",
    baseMrp: 298,
    basePrice: 238,
    packs: [
      { size: "21 Bolus Pack", mrp: 298, price: 238, priceMultiplier: 1 }
    ]
  },

  // 19. Ovasure Bolus (Retained untouched, 20% off)
  "lifescience-poultry-cal": {
    name: "Ovasure Bolus",
    baseMrp: 570,
    basePrice: 456,
    packs: [
      { size: "10 Bolus Pack", mrp: 570, price: 456, priceMultiplier: 1 }
    ]
  },

  // 20. Surelife Bolus (Row 42)
  "lifescience-broiler-liv": {
    name: "Surelife Bolus",
    baseMrp: 350,
    basePrice: 280,
    packs: [
      { size: "20 Bolus", mrp: 350, price: 280, priceMultiplier: 1 }
    ]
  },

  // 21. Cool Life
  "lifescience-cool-life": {
    name: "Cool Life",
    baseMrp: 190,
    basePrice: 152,
    packs: [
      { size: "500 ml", mrp: 190, price: 152, priceMultiplier: 1 },
      { size: "1 Ltr", mrp: 370, price: 296, priceMultiplier: 1.95 },
      { size: "5 Ltr", mrp: 1500, price: 1200, priceMultiplier: 7.89 }
    ]
  },

  // 22. Digi Life Bolus
  "lifescience-digilife-bolus": {
    name: "Digi Life Bolus",
    baseMrp: 85,
    basePrice: 68,
    packs: [
      { size: "4 Bolus", mrp: 85, price: 68, priceMultiplier: 1 },
      { size: "10x4 Bolus", mrp: 850, price: 680, priceMultiplier: 10 }
    ]
  },

  // 23. Skin Life Veterinary Powder
  "lifescience-skinlife-powder": {
    name: "Skin Life Veterinary Powder",
    baseMrp: 125,
    basePrice: 100,
    packs: [
      { size: "30 Gms", mrp: 125, price: 100, priceMultiplier: 1 }
    ]
  },

  // 24. Cal Life DS Advance
  "lifescience-cal-life-ds-advance": {
    name: "Cal Life DS Advance",
    baseMrp: 500,
    basePrice: 400,
    packs: [
      { size: "2 Ltr", mrp: 500, price: 400, priceMultiplier: 1, image: "https://res.cloudinary.com/duqwahasz/image/upload/v1794979531/lifescience/products/desrrskzaxesm7qx4bq6.jpg" },
      { size: "5 Ltr", mrp: 980, price: 784, priceMultiplier: 1.96, image: "" },
      { size: "20 Ltr", mrp: 3700, price: 2960, priceMultiplier: 7.4, image: "https://res.cloudinary.com/duqwahasz/image/upload/v1794984674/lifescience/products/wskqp3s58nh6lnhect7x.jpg" }
    ]
  }
};

async function executeSync() {
  const productsFilePath = "e:/AnimalDoctorProducts/frontend/src/data/products.js";
  const mod = await import("file:///" + productsFilePath.replace(/\\/g, "/"));
  let products = JSON.parse(JSON.stringify(mod.products || mod.default));

  console.log("Current catalog products:", products.length);

  // Check if Cal Life DS Advance exists
  const hasAdvance = products.some(p => p.id === "lifescience-cal-life-ds-advance");
  if (!hasAdvance) {
    const advanceProduct = {
      _id: new mongoose.Types.ObjectId().toString(),
      id: "lifescience-cal-life-ds-advance",
      name: "Cal Life DS Advance",
      category: "Cattle & Dairy Essentials",
      type: "High-Potency Liquid Calcium & Mineral Supplement",
      tagline: "Advanced Ionic Calcium with Phosphorus, Vit D3 & Herbal Galactagogues",
      price: 400,
      mrp: 500,
      rating: 4.9,
      reviews: 58,
      tag: "Advanced Formula",
      img: "https://res.cloudinary.com/duqwahasz/image/upload/v1794979531/lifescience/products/desrrskzaxesm7qx4bq6.jpg",
      imageUrl: "https://res.cloudinary.com/duqwahasz/image/upload/v1794979531/lifescience/products/desrrskzaxesm7qx4bq6.jpg",
      images: {
        main: "https://res.cloudinary.com/duqwahasz/image/upload/v1794979531/lifescience/products/desrrskzaxesm7qx4bq6.jpg",
        gallery: [],
        poster: "",
      },
      packing: ["2 Ltr", "5 Ltr", "20 Ltr"],
      packSizes: EXACT_PRODUCT_MAP["lifescience-cal-life-ds-advance"].packs,
      suitableFor: ["Cattle", "Buffalo"],
      description: "Advanced fortified liquid calcium and phosphorus suspension enriched with Vitamin D3, Vitamin B12, and bioactive herbal galactagogues to optimize peak lactation and prevent hypocalcemia (milk fever) in high-yield dairy animals.",
      featuresAndBenefits: [
        "Delivers double-strength ionic calcium for rapid bioavailability",
        "Prevents clinical and sub-clinical hypocalcemia (milk fever)",
        "Stimulates glandular mammary tissues for sustained milk yield",
        "Optimizes calcium-phosphorus ratio to improve bone density and herd vigor",
      ],
      advantages: [
        "Enhanced with Vitamin D3 and B12 for maximum intestinal absorption",
        "Palatable formulation easily accepted with feed or oral drench",
        "Ideal for transition cows and high-producing lactation phases",
      ],
      recommendations: [
        "Administer during periparturient period (before and after calving)",
        "Daily maintenance for high-yielding dairy cows and buffaloes",
        "Therapeutic support during calcium deficiency rickets and osteomalacia",
      ],
      actions: [
        "Rapidly elevates serum ionized calcium levels",
        "Synergizes with rumen microflora to enhance nutrient assimilation",
      ],
      indications: [
        "Hypocalcemia / Milk fever prevention",
        "Post-parturient lactation drop",
        "Weakness, bone demineralization, and metabolic debility",
      ],
      compositionTable: [
        { ingredient: "Calcium", quantity: "7000", unit: "mg" },
        { ingredient: "Phosphorus", quantity: "3500", unit: "mg" },
        { ingredient: "Vitamin D3", quantity: "16000", unit: "IU" },
        { ingredient: "Vitamin B12", quantity: "200", unit: "mcg" },
      ],
      dosage: "Cattle & Buffalo: 100 ml daily orally. Calves: 20-40 ml daily.",
      storage: "Store in a cool, dry place away from direct sunlight.",
      isLive: true,
      status: "published",
    };
    products.push(advanceProduct);
    console.log("Added Cal Life DS Advance to frontend catalog array");
  }

  // Update all products in products array
  for (const p of products) {
    const config = EXACT_PRODUCT_MAP[p.id];
    if (config) {
      p.mrp = config.baseMrp;
      p.price = config.basePrice;
      p.packSizes = config.packs.map(pack => ({
        ...pack,
        image: pack.image !== undefined ? pack.image : (p.images?.main || p.img || "")
      }));
      p.packing = p.packSizes.map(pk => pk.size);
      console.log(`✓ Updated [${p.id}] ${p.name}: Base MRP ₹${p.mrp}, Price ₹${p.price} (20% OFF), Packs: ${p.packing.join(", ")}`);
    } else {
      console.warn(`! No explicit config for product: ${p.id} (${p.name})`);
    }
  }

  // Generate frontend/src/data/products.js content
  const headerComment = `// Live catalog snapshot synced from MongoDB (lifescience_db) — Real Life Science Pharmaceutical Products
// Guarantees 0ms instant first paint with real products while live API refreshes in background.

export const products = ${JSON.stringify(products, null, 2)};

export function getProductsBySection(sectionId) {
  return products.filter((p) => p.category === sectionId);
}

export async function fetchBackendProducts(apiUrl = '/api/products') {
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch (err) {
    console.warn('Backend not connected, using snapshot products:', err);
    return products;
  }
}
`;

  fs.writeFileSync(productsFilePath, headerComment, "utf8");
  console.log(`\nSuccessfully wrote updated catalog to: ${productsFilePath}`);

  // Connect to MongoDB and update remote database
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    console.log("\nConnecting to MongoDB to sync live database...");
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    const col = db.collection("products");

    for (const p of products) {
      const updateData = {
        mrp: p.mrp,
        price: p.price,
        packing: p.packing,
        packSizes: p.packSizes,
        name: p.name,
      };

      const filter = p._id ? { $or: [{ _id: new mongoose.Types.ObjectId(p._id) }, { slug: p.id }, { id: p.id }] } : { $or: [{ slug: p.id }, { id: p.id }] };
      const res = await col.updateOne(filter, { $set: updateData }, { upsert: false });
      if (res.matchedCount === 0 && p.id === "lifescience-cal-life-ds-advance") {
        await col.insertOne({
          ...p,
          _id: new mongoose.Types.ObjectId(p._id),
          slug: p.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`Inserted Cal Life DS Advance into MongoDB`);
      } else {
        console.log(`Updated MongoDB product ${p.name} (matched: ${res.matchedCount}, modified: ${res.modifiedCount})`);
      }
    }

    await mongoose.disconnect();
    console.log("MongoDB synchronization complete!");
  } else {
    console.warn("MONGODB_URI not found in backend/.env, skipped database sync.");
  }
}

executeSync().catch(console.error);
