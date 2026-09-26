// ShopVibe category seed data
// 30 broad e-commerce categories.
// Placeholder image/icon URLs can be replaced later from Admin -> Categories.

const categories = [
  {
    "name": "Clothing",
    "slug": "clothing",
    "description": "Fashion clothing for men, women and kids including everyday wear, workwear and seasonal styles.",
    "image": {
      "public_id": "seed/categories/clothing/image",
      "url": "https://placehold.co/1200x800/png?text=Clothing"
    },
    "icon": {
      "public_id": "seed/categories/clothing/icon",
      "url": "https://placehold.co/256x256/png?text=Clothing"
    },
    "active": true
  },
  {
    "name": "Shoes",
    "slug": "shoes",
    "description": "Footwear including sneakers, running shoes, casual shoes, formal shoes, sandals and boots.",
    "image": {
      "public_id": "seed/categories/shoes/image",
      "url": "https://placehold.co/1200x800/png?text=Shoes"
    },
    "icon": {
      "public_id": "seed/categories/shoes/icon",
      "url": "https://placehold.co/256x256/png?text=Shoes"
    },
    "active": true
  },
  {
    "name": "Electronics",
    "slug": "electronics",
    "description": "Consumer electronics including audio, accessories, smart devices and everyday gadgets.",
    "image": {
      "public_id": "seed/categories/electronics/image",
      "url": "https://placehold.co/1200x800/png?text=Electronics"
    },
    "icon": {
      "public_id": "seed/categories/electronics/icon",
      "url": "https://placehold.co/256x256/png?text=Electronics"
    },
    "active": true
  },
  {
    "name": "Mobiles & Tablets",
    "slug": "mobiles-tablets",
    "description": "Smartphones, tablets, mobile accessories, chargers, cases and related devices.",
    "image": {
      "public_id": "seed/categories/mobiles-tablets/image",
      "url": "https://placehold.co/1200x800/png?text=Mobiles+%26+Tablets"
    },
    "icon": {
      "public_id": "seed/categories/mobiles-tablets/icon",
      "url": "https://placehold.co/256x256/png?text=Mobiles+%26+Tablets"
    },
    "active": true
  },
  {
    "name": "Computers & Laptops",
    "slug": "computers-laptops",
    "description": "Laptops, desktops, monitors, computer accessories, storage and peripherals.",
    "image": {
      "public_id": "seed/categories/computers-laptops/image",
      "url": "https://placehold.co/1200x800/png?text=Computers+%26+Laptops"
    },
    "icon": {
      "public_id": "seed/categories/computers-laptops/icon",
      "url": "https://placehold.co/256x256/png?text=Computers+%26+Laptops"
    },
    "active": true
  },
  {
    "name": "TV & Home Entertainment",
    "slug": "tv-home-entertainment",
    "description": "Televisions, streaming devices, soundbars, media players and home entertainment products.",
    "image": {
      "public_id": "seed/categories/tv-home-entertainment/image",
      "url": "https://placehold.co/1200x800/png?text=TV+%26+Home+Entertainment"
    },
    "icon": {
      "public_id": "seed/categories/tv-home-entertainment/icon",
      "url": "https://placehold.co/256x256/png?text=TV+%26+Home+Entertainment"
    },
    "active": true
  },
  {
    "name": "Cameras & Photography",
    "slug": "cameras-photography",
    "description": "Cameras, lenses, tripods, lighting, memory cards and photography accessories.",
    "image": {
      "public_id": "seed/categories/cameras-photography/image",
      "url": "https://placehold.co/1200x800/png?text=Cameras+%26+Photography"
    },
    "icon": {
      "public_id": "seed/categories/cameras-photography/icon",
      "url": "https://placehold.co/256x256/png?text=Cameras+%26+Photography"
    },
    "active": true
  },
  {
    "name": "Gaming",
    "slug": "gaming",
    "description": "Gaming consoles, controllers, headsets, keyboards, mice and gaming accessories.",
    "image": {
      "public_id": "seed/categories/gaming/image",
      "url": "https://placehold.co/1200x800/png?text=Gaming"
    },
    "icon": {
      "public_id": "seed/categories/gaming/icon",
      "url": "https://placehold.co/256x256/png?text=Gaming"
    },
    "active": true
  },
  {
    "name": "Home & Kitchen",
    "slug": "home-kitchen",
    "description": "Kitchen tools, cookware, storage, home utility products and everyday household essentials.",
    "image": {
      "public_id": "seed/categories/home-kitchen/image",
      "url": "https://placehold.co/1200x800/png?text=Home+%26+Kitchen"
    },
    "icon": {
      "public_id": "seed/categories/home-kitchen/icon",
      "url": "https://placehold.co/256x256/png?text=Home+%26+Kitchen"
    },
    "active": true
  },
  {
    "name": "Furniture",
    "slug": "furniture",
    "description": "Furniture for living rooms, bedrooms, dining rooms, offices and storage spaces.",
    "image": {
      "public_id": "seed/categories/furniture/image",
      "url": "https://placehold.co/1200x800/png?text=Furniture"
    },
    "icon": {
      "public_id": "seed/categories/furniture/icon",
      "url": "https://placehold.co/256x256/png?text=Furniture"
    },
    "active": true
  },
  {
    "name": "Home Decor",
    "slug": "home-decor",
    "description": "Decorative items, lighting, wall decor, clocks, cushions and interior accessories.",
    "image": {
      "public_id": "seed/categories/home-decor/image",
      "url": "https://placehold.co/1200x800/png?text=Home+Decor"
    },
    "icon": {
      "public_id": "seed/categories/home-decor/icon",
      "url": "https://placehold.co/256x256/png?text=Home+Decor"
    },
    "active": true
  },
  {
    "name": "Appliances",
    "slug": "appliances",
    "description": "Large and small home appliances for cooking, cleaning, cooling and daily use.",
    "image": {
      "public_id": "seed/categories/appliances/image",
      "url": "https://placehold.co/1200x800/png?text=Appliances"
    },
    "icon": {
      "public_id": "seed/categories/appliances/icon",
      "url": "https://placehold.co/256x256/png?text=Appliances"
    },
    "active": true
  },
  {
    "name": "Beauty & Personal Care",
    "slug": "beauty-personal-care",
    "description": "Skincare, haircare, grooming, beauty tools, cosmetics and personal care essentials.",
    "image": {
      "public_id": "seed/categories/beauty-personal-care/image",
      "url": "https://placehold.co/1200x800/png?text=Beauty+%26+Personal+Care"
    },
    "icon": {
      "public_id": "seed/categories/beauty-personal-care/icon",
      "url": "https://placehold.co/256x256/png?text=Beauty+%26+Personal+Care"
    },
    "active": true
  },
  {
    "name": "Health & Wellness",
    "slug": "health-wellness",
    "description": "Wellness accessories, personal care devices, fitness support and everyday health products.",
    "image": {
      "public_id": "seed/categories/health-wellness/image",
      "url": "https://placehold.co/1200x800/png?text=Health+%26+Wellness"
    },
    "icon": {
      "public_id": "seed/categories/health-wellness/icon",
      "url": "https://placehold.co/256x256/png?text=Health+%26+Wellness"
    },
    "active": true
  },
  {
    "name": "Watches",
    "slug": "watch",
    "description": "Analog, digital, smart and fashion watches for everyday and occasion wear.",
    "image": {
      "public_id": "seed/categories/watch/image",
      "url": "https://placehold.co/1200x800/png?text=Watches"
    },
    "icon": {
      "public_id": "seed/categories/watch/icon",
      "url": "https://placehold.co/256x256/png?text=Watches"
    },
    "active": true
  },
  {
    "name": "Bags",
    "slug": "bag",
    "description": "Backpacks, handbags, laptop bags, travel bags, duffels and everyday carry products.",
    "image": {
      "public_id": "seed/categories/bag/image",
      "url": "https://placehold.co/1200x800/png?text=Bags"
    },
    "icon": {
      "public_id": "seed/categories/bag/icon",
      "url": "https://placehold.co/256x256/png?text=Bags"
    },
    "active": true
  },
  {
    "name": "Accessories",
    "slug": "accessories",
    "description": "Fashion and lifestyle accessories including wallets, belts, sunglasses, caps and bottles.",
    "image": {
      "public_id": "seed/categories/accessories/image",
      "url": "https://placehold.co/1200x800/png?text=Accessories"
    },
    "icon": {
      "public_id": "seed/categories/accessories/icon",
      "url": "https://placehold.co/256x256/png?text=Accessories"
    },
    "active": true
  },
  {
    "name": "Jewellery",
    "slug": "jewellery",
    "description": "Fashion jewellery including necklaces, rings, bracelets, earrings and accessories.",
    "image": {
      "public_id": "seed/categories/jewellery/image",
      "url": "https://placehold.co/1200x800/png?text=Jewellery"
    },
    "icon": {
      "public_id": "seed/categories/jewellery/icon",
      "url": "https://placehold.co/256x256/png?text=Jewellery"
    },
    "active": true
  },
  {
    "name": "Sports & Fitness",
    "slug": "sports-fitness",
    "description": "Sports gear, fitness accessories, workout equipment and outdoor activity products.",
    "image": {
      "public_id": "seed/categories/sports-fitness/image",
      "url": "https://placehold.co/1200x800/png?text=Sports+%26+Fitness"
    },
    "icon": {
      "public_id": "seed/categories/sports-fitness/icon",
      "url": "https://placehold.co/256x256/png?text=Sports+%26+Fitness"
    },
    "active": true
  },
  {
    "name": "Books & Stationery",
    "slug": "books-stationery",
    "description": "Books, notebooks, writing tools, office stationery and study essentials.",
    "image": {
      "public_id": "seed/categories/books-stationery/image",
      "url": "https://placehold.co/1200x800/png?text=Books+%26+Stationery"
    },
    "icon": {
      "public_id": "seed/categories/books-stationery/icon",
      "url": "https://placehold.co/256x256/png?text=Books+%26+Stationery"
    },
    "active": true
  },
  {
    "name": "Toys & Games",
    "slug": "toys-games",
    "description": "Toys, puzzles, board games, educational products and kids activity items.",
    "image": {
      "public_id": "seed/categories/toys-games/image",
      "url": "https://placehold.co/1200x800/png?text=Toys+%26+Games"
    },
    "icon": {
      "public_id": "seed/categories/toys-games/icon",
      "url": "https://placehold.co/256x256/png?text=Toys+%26+Games"
    },
    "active": true
  },
  {
    "name": "Baby & Kids",
    "slug": "baby-kids",
    "description": "Baby care, kids essentials, clothing accessories and everyday products for children.",
    "image": {
      "public_id": "seed/categories/baby-kids/image",
      "url": "https://placehold.co/1200x800/png?text=Baby+%26+Kids"
    },
    "icon": {
      "public_id": "seed/categories/baby-kids/icon",
      "url": "https://placehold.co/256x256/png?text=Baby+%26+Kids"
    },
    "active": true
  },
  {
    "name": "Grocery & Gourmet",
    "slug": "grocery-gourmet",
    "description": "Packaged foods, beverages, snacks, pantry staples and gourmet products.",
    "image": {
      "public_id": "seed/categories/grocery-gourmet/image",
      "url": "https://placehold.co/1200x800/png?text=Grocery+%26+Gourmet"
    },
    "icon": {
      "public_id": "seed/categories/grocery-gourmet/icon",
      "url": "https://placehold.co/256x256/png?text=Grocery+%26+Gourmet"
    },
    "active": true
  },
  {
    "name": "Pet Supplies",
    "slug": "pet-supplies",
    "description": "Food accessories, grooming items, toys, beds and everyday supplies for pets.",
    "image": {
      "public_id": "seed/categories/pet-supplies/image",
      "url": "https://placehold.co/1200x800/png?text=Pet+Supplies"
    },
    "icon": {
      "public_id": "seed/categories/pet-supplies/icon",
      "url": "https://placehold.co/256x256/png?text=Pet+Supplies"
    },
    "active": true
  },
  {
    "name": "Automotive",
    "slug": "automotive",
    "description": "Car and bike accessories, cleaning products, organizers and automotive essentials.",
    "image": {
      "public_id": "seed/categories/automotive/image",
      "url": "https://placehold.co/1200x800/png?text=Automotive"
    },
    "icon": {
      "public_id": "seed/categories/automotive/icon",
      "url": "https://placehold.co/256x256/png?text=Automotive"
    },
    "active": true
  },
  {
    "name": "Tools & Hardware",
    "slug": "tools-hardware",
    "description": "Hand tools, power-tool accessories, hardware, repair and maintenance products.",
    "image": {
      "public_id": "seed/categories/tools-hardware/image",
      "url": "https://placehold.co/1200x800/png?text=Tools+%26+Hardware"
    },
    "icon": {
      "public_id": "seed/categories/tools-hardware/icon",
      "url": "https://placehold.co/256x256/png?text=Tools+%26+Hardware"
    },
    "active": true
  },
  {
    "name": "Garden & Outdoor",
    "slug": "garden-outdoor",
    "description": "Gardening tools, planters, outdoor furniture, lighting and outdoor utility products.",
    "image": {
      "public_id": "seed/categories/garden-outdoor/image",
      "url": "https://placehold.co/1200x800/png?text=Garden+%26+Outdoor"
    },
    "icon": {
      "public_id": "seed/categories/garden-outdoor/icon",
      "url": "https://placehold.co/256x256/png?text=Garden+%26+Outdoor"
    },
    "active": true
  },
  {
    "name": "Office & Business",
    "slug": "office-business",
    "description": "Office supplies, desk accessories, organizers and business-use essentials.",
    "image": {
      "public_id": "seed/categories/office-business/image",
      "url": "https://placehold.co/1200x800/png?text=Office+%26+Business"
    },
    "icon": {
      "public_id": "seed/categories/office-business/icon",
      "url": "https://placehold.co/256x256/png?text=Office+%26+Business"
    },
    "active": true
  },
  {
    "name": "Travel & Luggage",
    "slug": "travel-luggage",
    "description": "Suitcases, travel organizers, travel accessories and luggage essentials.",
    "image": {
      "public_id": "seed/categories/travel-luggage/image",
      "url": "https://placehold.co/1200x800/png?text=Travel+%26+Luggage"
    },
    "icon": {
      "public_id": "seed/categories/travel-luggage/icon",
      "url": "https://placehold.co/256x256/png?text=Travel+%26+Luggage"
    },
    "active": true
  },
  {
    "name": "Gifts & Lifestyle",
    "slug": "gifts-lifestyle",
    "description": "Giftable products, lifestyle accessories, seasonal items and special-occasion picks.",
    "image": {
      "public_id": "seed/categories/gifts-lifestyle/image",
      "url": "https://placehold.co/1200x800/png?text=Gifts+%26+Lifestyle"
    },
    "icon": {
      "public_id": "seed/categories/gifts-lifestyle/icon",
      "url": "https://placehold.co/256x256/png?text=Gifts+%26+Lifestyle"
    },
    "active": true
  }
];

export default categories;
