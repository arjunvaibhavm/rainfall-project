import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

DATA_FILE = 'rain_forecasting.csv'
CHART_FILE = 'plan_a_visualization.png'

print(f"Loading '{DATA_FILE}' to create visualization...")

try:
    df = pd.read_csv(DATA_FILE)
except FileNotFoundError:
    print(f"Error: '{DATA_FILE}' not found.")
    print("Please make sure it's in the same folder as this script.")
    exit()

# Set the style
sns.set_style("whitegrid")

# Create a "countplot" to see the balance of our target variable
plt.figure(figsize=(8, 6))
ax = sns.countplot(x='RainTomorrow', data=df, palette='Blues')

ax.set_title('Target Variable: RainTomorrow (Yes/No)', fontsize=16)
ax.set_xlabel('Did it rain tomorrow?', fontsize=12)
ax.set_ylabel('Number of Days', fontsize=12)

# Add labels to the bars
for p in ax.patches:
    ax.annotate(f'{int(p.get_height())}', (p.get_x() + p.get_width() / 2., p.get_height()),
                ha='center', va='center', xytext=(0, 9), textcoords='offset points', fontsize=11)

# Save the plot
plt.savefig(CHART_FILE)

print(f"Successfully saved chart to '{CHART_FILE}'")
print("This chart shows our dataset is 'imbalanced' (it has more 'No' days than 'Yes' days).")