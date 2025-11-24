# 🏀 TP2-NbetA-130275+130288

NbetA is an interactive web app that brings NBA data to life through dynamic charts, advanced stats, and player/team insights. Explore player performance trends, team comparisons, and season analytics - all in one sleek, easy-to-use dashboard.

- Link to first data: https://www.kaggle.com/datasets/wyattowalsh/basketball
- Link to second data: https://www.kaggle.com/datasets/eoinamoore/historical-nba-data-and-player-box-scores/data
- Link to some team logos: https://www.kaggle.com/datasets/ncmoliver/nba-logos-img-dataset


## Links to the presentation and video demonstration
- Final presentation: https://www.dropbox.com/scl/fi/km2h96nsojitr5dix38ck/TP2-final_presentation-130275-130288.pptx?rlkey=771ki9cz5b3lvp0sj2iqfsysn&st=5q9n22qr&dl=0
- Video demonstration: https://www.dropbox.com/scl/fi/5ewxptrvmxdh60wrzw4mr/TP2-video_demo-130275-130288.mp4?rlkey=60eqw3nkgoq99pp5gikttl1yd&st=fh2dk0r6&dl=0

## Running the application
To run **NbetA**, start both the **backend** and **frontend** as described below.

### Backend:
1. Create a .env file with the content provided in the env.txt inside the TP2-NbetA-130275+130288.zip on moodle. Position of the **.env** should look like this:
   - backend
      - app
      - **.env**
2. In the first POWERSHELL terminal, position yourself in the /backend folder:
  ```bash
   cd backend
```
3. Lastly, run this command to start the backend:
  ```bash
   uvicorn app.main:app --reload
```

### Frontend:
1. In the second POWERSHELL terminal, position yourself in the /frontend folder:
     ```bash
   cd frontend
```

2. Run this command to install all the packages:
     ```bash
   npm install --legacy-peer-deps
```
3. Lastly, run this command to start the frontend:
     ```bash
   npm run dev
```
