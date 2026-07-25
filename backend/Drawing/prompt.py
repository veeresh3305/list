import json

def generate_drawing_prompts():
    # Helper function to generate clean vector/line-art Unsplash image URLs
    def get_lineart_url(photo_id):
        return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w=800&q=80"

    # 50 Beginner-Friendly Line Art & Simple Drawing Prompts
    prompts = [
        # --- VEHICLES & TRANSPORT (Simple Outlines) ---
        {"id": 1, "title": "Simple Sedans Side View", "category": "Vehicles", "difficulty": "Beginner", "reference_url": get_lineart_url("1568605117036-5fe5e7bab0b7")},
        {"id": 2, "title": "Vintage Beetle Car Outline", "category": "Vehicles", "difficulty": "Beginner", "reference_url": get_lineart_url("1533473359331-0135ef1b58bf")},
        {"id": 3, "title": "Classic Pickup Truck", "category": "Vehicles", "difficulty": "Beginner", "reference_url": get_lineart_url("1552519507-da3b142c6e3d")},
        {"id": 4, "title": "Simple Bicycle Outline", "category": "Vehicles", "difficulty": "Beginner", "reference_url": get_lineart_url("1485965120184-e220f721d03e")},
        {"id": 5, "title": "Minimalist Scooter", "category": "Vehicles", "difficulty": "Beginner", "reference_url": get_lineart_url("1558981806-ec527fa84c39")},
        {"id": 6, "title": "Basic Airplane Contour", "category": "Vehicles", "difficulty": "Beginner", "reference_url": get_lineart_url("1540959733332-eab4deabeeaf")},
        {"id": 7, "title": "Simple Sailboat", "category": "Vehicles", "difficulty": "Beginner", "reference_url": get_lineart_url("1500530855697-b586d89ba3ee")},
        {"id": 8, "title": "Cartoon Bus Silhouette", "category": "Vehicles", "difficulty": "Beginner", "reference_url": get_lineart_url("1570125909262-eb7e381413ef")},
        {"id": 9, "title": "Retro Camper Van", "category": "Vehicles", "difficulty": "Intermediate", "reference_url": get_lineart_url("1527786356703-4b100091cd2c")},
        {"id": 10, "title": "Basic Steam Train Engine", "category": "Vehicles", "difficulty": "Intermediate", "reference_url": get_lineart_url("1474487548417-781cb71495f3")},

        # --- ANIMALS & CHARACTERS (Easy Shapes) ---
        {"id": 11, "title": "Minimalist Cat Line Art", "category": "Animals", "difficulty": "Beginner", "reference_url": get_lineart_url("1514888286974-6c03e2ca1dba")},
        {"id": 12, "title": "Simple Dog Doodle", "category": "Animals", "difficulty": "Beginner", "reference_url": get_lineart_url("1543466835-00a7907e9de1")},
        {"id": 13, "title": "Basic Bird Profile Outline", "category": "Animals", "difficulty": "Beginner", "reference_url": get_lineart_url("1444464666168-49d633b86797")},
        {"id": 14, "title": "Fish Simple Silhouette", "category": "Animals", "difficulty": "Beginner", "reference_url": get_lineart_url("1522069169874-c58ec4b76be5")},
        {"id": 15, "title": "Cute Cartoon Bunny", "category": "Animals", "difficulty": "Beginner", "reference_url": get_lineart_url("1585110396000-c9ffd4e4b308")},
        {"id": 16, "title": "Simple Elephant Outline", "category": "Animals", "difficulty": "Beginner", "reference_url": get_lineart_url("1557050543-4d5f4e07ef46")},
        {"id": 17, "title": "Minimalist Turtle Shape", "category": "Animals", "difficulty": "Beginner", "reference_url": get_lineart_url("1437622368342-7a3d73a34c8f")},
        {"id": 18, "title": "Simple Butterfly Contour", "category": "Animals", "difficulty": "Beginner", "reference_url": get_lineart_url("1526336024174-e58f5cdd8e13")},
        {"id": 19, "title": "Teddy Bear Line Art", "category": "Animals", "difficulty": "Beginner", "reference_url": get_lineart_url("1558060370-d644479cb6f7")},
        {"id": 20, "title": "Simple Penguin Outline", "category": "Animals", "difficulty": "Beginner", "reference_url": get_lineart_url("1598439210625-5067c578f3f6")},

        # --- FLOWERS & PLANTS (Continuous Lines) ---
        {"id": 21, "title": "Single Line Rose", "category": "Plants", "difficulty": "Beginner", "reference_url": get_lineart_url("1518709268805-4e9042af9f23")},
        {"id": 22, "title": "Simple Sunflower Line Art", "category": "Plants", "difficulty": "Beginner", "reference_url": get_lineart_url("1597848212624-a19eb35e2651")},
        {"id": 23, "title": "Minimalist Monstera Leaf", "category": "Plants", "difficulty": "Beginner", "reference_url": get_lineart_url("1614594975525-e45190c55d0b")},
        {"id": 24, "title": "Potted Cactus Line Drawing", "category": "Plants", "difficulty": "Beginner", "reference_url": get_lineart_url("1459411552884-841db9b3cc2a")},
        {"id": 25, "title": "Simple Tulip Outline", "category": "Plants", "difficulty": "Beginner", "reference_url": get_lineart_url("1520763185298-1b434c919102")},
        {"id": 26, "title": "Pine Tree Silhouette", "category": "Plants", "difficulty": "Beginner", "reference_url": get_lineart_url("1542273917363-3b1817f69a2d")},
        {"id": 27, "title": "Palm Tree Simple Vector", "category": "Plants", "difficulty": "Beginner", "reference_url": get_lineart_url("1507525428034-b723cf961d3e")},
        {"id": 28, "title": "Mushroom Line Art", "category": "Plants", "difficulty": "Beginner", "reference_url": get_lineart_url("1504386106331-3e4e71712b38")},
        {"id": 29, "title": "Simple Daisy Pattern", "category": "Plants", "difficulty": "Beginner", "reference_url": get_lineart_url("1606041008023-472dfb5e530f")},
        {"id": 30, "title": "Potted Succulent Shape", "category": "Plants", "difficulty": "Beginner", "reference_url": get_lineart_url("1448301612041-0731f86d8a7d")},

        # --- BUILDINGS & OBJECTS (Geometrical Shapes) ---
        {"id": 31, "title": "Simple House Line Drawing", "category": "Buildings", "difficulty": "Beginner", "reference_url": get_lineart_url("1513694203232-719a280e022f")},
        {"id": 32, "title": "Minimalist Lighthouse", "category": "Buildings", "difficulty": "Beginner", "reference_url": get_lineart_url("1507272931001-fc06c17e4f43")},
        {"id": 33, "title": "Simple Windmill Shape", "category": "Buildings", "difficulty": "Beginner", "reference_url": get_lineart_url("1509316975850-ff9c5deb0cd9")},
        {"id": 34, "title": "Coffee Mug Doodle", "category": "Objects", "difficulty": "Beginner", "reference_url": get_lineart_url("1514432324607-a09d9b4aefdd")},
        {"id": 35, "title": "Lightbulb Simple Line Art", "category": "Objects", "difficulty": "Beginner", "reference_url": get_lineart_url("1493612276216-ee3925520721")},
        {"id": 36, "title": "Simple Key Outline", "category": "Objects", "difficulty": "Beginner", "reference_url": get_lineart_url("1582139329536-e7284fece509")},
        {"id": 37, "title": "Minimalist Clock Face", "category": "Objects", "difficulty": "Beginner", "reference_url": get_lineart_url("1509042239860-f550ce710b93")},
        {"id": 38, "title": "Unfolded Umbrella Line Art", "category": "Objects", "difficulty": "Beginner", "reference_url": get_lineart_url("1517457373958-b7bdd4587205")},
        {"id": 39, "title": "Open Book Outline", "category": "Objects", "difficulty": "Beginner", "reference_url": get_lineart_url("1512820790803-83ca734da794")},
        {"id": 40, "title": "Simple Pair of Glasses", "category": "Objects", "difficulty": "Beginner", "reference_url": get_lineart_url("1577803645773-f96470509666")},

        # --- FOOD & ICONIC SHAPES ---
        {"id": 41, "title": "Simple Pizza Slice", "category": "Food", "difficulty": "Beginner", "reference_url": get_lineart_url("1513104890138-7c749659a591")},
        {"id": 42, "title": "Cartoon Ice Cream Cone", "category": "Food", "difficulty": "Beginner", "reference_url": get_lineart_url("1501443762994-82bd5dace89a")},
        {"id": 43, "title": "Simple Apple Outline", "category": "Food", "difficulty": "Beginner", "reference_url": get_lineart_url("1560806887-1e4cd0b6cbd6")},
        {"id": 44, "title": "Minimalist Cupcake", "category": "Food", "difficulty": "Beginner", "reference_url": get_lineart_url("1578985545062-69928b1d9587")},
        {"id": 45, "title": "Sliced Watermelon Shape", "category": "Food", "difficulty": "Beginner", "reference_url": get_lineart_url("1589984662646-e7b2e4962f18")},
        {"id": 46, "title": "Simple Crescent Moon & Stars", "category": "Symbols", "difficulty": "Beginner", "reference_url": get_lineart_url("1532693322450-2cb5c511067d")},
        {"id": 47, "title": "Mountain Minimalist Triangles", "category": "Symbols", "difficulty": "Beginner", "reference_url": get_lineart_url("1464822759023-fed622ff2c3b")},
        {"id": 48, "title": "Simple Crown Icon", "category": "Symbols", "difficulty": "Beginner", "reference_url": get_lineart_url("1520038410233-7141be7e6f97")},
        {"id": 49, "title": "Basic Heart Shape Art", "category": "Symbols", "difficulty": "Beginner", "reference_url": get_lineart_url("1518199266791-5375a83190b7")},
        {"id": 50, "title": "Minimalist Sun Burst", "category": "Symbols", "difficulty": "Beginner", "reference_url": get_lineart_url("1500382017468-9049fed747ef")}
    ]

    # Export to JSON
    output_filename = "drawing_prompts.json"
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(prompts, f, indent=4, ensure_ascii=False)

    print(f"Generated {len(prompts)} easy line-art prompts in '{output_filename}'.")

if __name__ == "__main__":
    generate_drawing_prompts()