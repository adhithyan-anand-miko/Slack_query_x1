import pandas as pd

# --- CONFIGURATION ---
# Set the path to your attendance Excel file here
file_path = "Daily Attendance Report (2).xls"
sheet_name = "DailyAttendance_DetailedReport"

# --- LOAD DATA ---
# Read the data, skipping metadata/header rows as needed
# (You may need to adjust header/skipping based on your file structure)
df = pd.read_excel(file_path, sheet_name=sheet_name, header=7)

# The first row contains the real headers, so set it as the header
df.columns = df.iloc[0]
df = df[1:].reset_index(drop=True)
df.columns = df.columns.astype(str).str.strip()

# Add Emp. Type from the original DataFrame if needed (see previous script for details)
# df["Emp. Type"] = ...

# --- EXTRACT DATE ---
# If the file contains a "Date" column, use it. If not, you may need to extract from metadata or filename.
# For demo, let's assume the file has a "Date" column or you can add it manually for each day's file.

# If you have a single file for the month, and each row is a day for an employee:
# (Otherwise, you may need to concatenate multiple daily files into one DataFrame)

# --- BUILD MATRIX ---
# For demo, let's assume you have columns: 'E. Code', 'Name', 'Date', 'Status'
# If not, you may need to adjust the column names and how you extract the date.

# Convert 'Date' to day of month (1-31)
df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
df['Day'] = df['Date'].dt.day

# Mark presence
df['Present'] = df['Status'].apply(lambda x: "Yes" if str(x).strip().lower() == "present" else "No")

# Pivot to get one row per employee, columns for each day
matrix = df.pivot_table(index=['E. Code', 'Name'], columns='Day', values='Present', aggfunc='first', fill_value="No")

# Sort columns so days are in order
matrix = matrix.reindex(sorted(matrix.columns), axis=1)

# Reset index to flatten
matrix = matrix.reset_index()

# Optionally, rename columns to be just day numbers
matrix.columns.name = None
matrix.columns = ['E. Code', 'Name'] + [str(col) for col in matrix.columns[2:]]

# Save to Excel
matrix.to_excel("Attendance_Matrix.xlsx", index=False)
print("Attendance matrix saved to Attendance_Matrix.xlsx")
