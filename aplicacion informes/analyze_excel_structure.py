import pandas as pd
import os

file_path = r"c:\Users\alehe\OneDrive\Documentos\aplicacion informes\INFORME CONTRA INCENDIOS MODELO EN BLANCO.xlsx"

try:
    xl = pd.ExcelFile(file_path)
    print(f"Sheet names: {xl.sheet_names}")
    
    for sheet in xl.sheet_names:
        print(f"\n--- Sheet: {sheet} ---")
        try:
            df = pd.read_excel(file_path, sheet_name=sheet, nrows=10) # Read first 10 rows to get an idea
            print("Columns:", df.columns.tolist())
            print("First few rows:")
            print(df.head())
        except Exception as e:
            print(f"Error reading sheet {sheet}: {e}")
            
except Exception as e:
    print(f"Error opening file: {e}")
