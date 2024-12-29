#!/bin/bash

# Define the folder to search and the output file
TARGET_FOLDER="./" # Replace with your desired folder path
OUTPUT_FILE="js_css_files_with_content.txt"

# Check if the output file already exists, if so, remove it
if [ -f "$OUTPUT_FILE" ]; then
    rm "$OUTPUT_FILE"
fi

# Check if the target folder exists
if [ ! -d "$TARGET_FOLDER" ]; then
    echo "The folder '$TARGET_FOLDER' does not exist."
    exit 1
fi

# Search for .js and .css files in the target folder and process them
find "$TARGET_FOLDER" -type f \( -name "*.js" -o -name "*.css" \) | while read -r file; do
    echo "=========================" >> "$OUTPUT_FILE"
    echo "File: $file" >> "$OUTPUT_FILE"
    echo "=========================" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo -e "\n\n" >> "$OUTPUT_FILE"
done

echo "JavaScript and CSS file contents have been saved in $OUTPUT_FILE"
