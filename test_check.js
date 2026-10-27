const fs = require('fs');
const code = fs.readFileSync('C:/Users/LiSB/.gemini/antigravity/scratch/dev-task-hub/src/components/TaskBoard.vue', 'utf8');
const lines = code.split('\n');
for (let i = 2245; i < 2285; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
