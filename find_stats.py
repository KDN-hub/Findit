
print("Searching for 'stats' in main.py...")
try:
    with open(r"c:\Users\kamsi\OneDrive\Documents\finditproject\backend\main.py", "r", encoding="utf-8") as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            if "stats" in line.lower():
                print(f"Line {i+1}: {line.strip()}")
except Exception as e:
    print(f"Error: {e}")
