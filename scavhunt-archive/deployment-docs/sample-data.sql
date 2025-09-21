-- Sample Data for Scavenger Hunt Application
-- Run this after the main schema to populate with your specific stations

-- Clear existing data (optional - only if you want to start fresh)
-- DELETE FROM team_visits;
-- DELETE FROM stations;

-- Full station set with complete team routes
-- Replace video URLs with your actual Google Drive links

INSERT INTO stations (id, name, routes) VALUES 

-- Starting station - all teams begin here
('GameOpen', 'Game Opening Station', '{
  "TEAM_1": {
    "nextStation": "SuperKeizer",
    "password": "1111",
    "nextClue": "Head to the mighty emperor''s domain where legends are born.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  },
  "TEAM_2": {
    "nextStation": "Pizza",
    "password": "2222", 
    "nextClue": "Seek sustenance where cheese meets dough in perfect harmony.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  },
  "TEAM_3": {
    "nextStation": "Park4",
    "password": "3333",
    "nextClue": "Find the fourth sanctuary of green where children play.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  },
  "TEAM_4": {
    "nextStation": "Puzzle",
    "password": "4444",
    "nextClue": "Where minds bend and twist to solve the unsolvable.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  },
  "TEAM_5": {
    "nextStation": "SchoolGate",
    "password": "5555",
    "nextClue": "At the entrance to knowledge, where young minds gather.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  }
}'),

-- Individual stations with their specific team routes
('SuperKeizer', 'Emperor''s Domain', '{
  "TEAM_1": {
    "nextStation": "Puzzle",
    "password": "1111",
    "nextClue": "Your next challenge awaits where riddles and mysteries unfold.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  },
  "TEAM_2": {
    "nextStation": "SchoolGate", 
    "password": "2222",
    "nextClue": "Proceed to the gates of learning and wisdom.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  },
  "TEAM_3": {
    "nextStation": "End",
    "password": "3333",
    "nextClue": "Your final destination awaits - the mission concludes here!",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  },
  "TEAM_4": {
    "nextStation": "Park1",
    "password": "4444",
    "nextClue": "Find the first green sanctuary in the urban landscape.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  },
  "TEAM_5": {
    "nextStation": "Park4",
    "password": "5555",
    "nextClue": "Seek the fourth park where nature meets civilization.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  }
}'),

('Puzzle', 'Mystery Solver''s Den', '{
  "TEAM_1": {
    "nextStation": "synagogue",
    "password": "1111",
    "nextClue": "Seek the sacred place where ancient prayers still echo.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  },
  "TEAM_3": {
    "nextStation": "synagogue",
    "password": "3333",
    "nextClue": "Find the house of worship where community gathers.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  },
  "TEAM_4": {
    "nextStation": "synagogue",
    "password": "4444",
    "nextClue": "Journey to the sacred halls of faith and tradition.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  },
  "TEAM_5": {
    "nextStation": "synagogue",
    "password": "5555",
    "nextClue": "Visit the spiritual center of the community.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  }
}'),

('synagogue', 'Sacred Halls', '{
  "TEAM_1": {
    "nextStation": "Pizza",
    "password": "1111",
    "nextClue": "Time for sustenance where Italy meets tradition.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  },
  "TEAM_2": {
    "nextStation": "End",
    "password": "2222",
    "nextClue": "Your journey concludes here - mission accomplished!",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  },
  "TEAM_3": {
    "nextStation": "SchoolGate",
    "password": "3333", 
    "nextClue": "Head to where knowledge begins its journey.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  },
  "TEAM_4": {
    "nextStation": "SchoolGate",
    "password": "4444",
    "nextClue": "Find the portal to learning and growth.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  },
  "TEAM_5": {
    "nextStation": "SuperKeizer",
    "password": "5555",
    "nextClue": "Return to the emperor''s mighty domain.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  }
}'),

-- Continue with all other stations...
('Pizza', 'Italian Delights', '{
  "TEAM_1": {
    "nextStation": "Park2",
    "password": "1111",
    "nextClue": "Find the second oasis of green in this concrete jungle.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  },
  "TEAM_2": {
    "nextStation": "Park2",
    "password": "2222",
    "nextClue": "Continue to the second park where peace dwells.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  },
  "TEAM_4": {
    "nextStation": "DefuseBomb",
    "password": "4444",
    "nextClue": "Your most dangerous mission awaits - defuse the situation.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_VIDEO_ID_HERE/view"
  }
}'),

-- Ending station - all teams finish here
('End', 'Mission Complete', '{
  "TEAM_1": {
    "nextStation": "END",
    "password": "1111",
    "nextClue": "Congratulations Agent! Your mission is complete. You have successfully navigated through all challenges and proven your worth as a master spy.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_FINAL_VIDEO_ID/view"
  },
  "TEAM_2": {
    "nextStation": "END", 
    "password": "2222",
    "nextClue": "Mission accomplished, Agent! You have demonstrated exceptional skills and completed your assignment with distinction.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_FINAL_VIDEO_ID/view"
  },
  "TEAM_3": {
    "nextStation": "END",
    "password": "3333",
    "nextClue": "Victory is yours, Agent! Your perseverance and intelligence have led you to successful mission completion.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_FINAL_VIDEO_ID/view"
  },
  "TEAM_4": {
    "nextStation": "END",
    "password": "4444",
    "nextClue": "Outstanding work, Agent! You have overcome every obstacle and reached the end of your covert operation.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_FINAL_VIDEO_ID/view"
  },
  "TEAM_5": {
    "nextStation": "END",
    "password": "5555",
    "nextClue": "Excellent execution, Agent! Your mission is complete and you have earned your place among the elite operatives.",
    "videoUrl": "https://drive.google.com/file/d/YOUR_FINAL_VIDEO_ID/view"
  }
}');

-- Add remaining stations (customize these based on your physical locations)
INSERT INTO stations (id, name, routes) VALUES 
('SchoolGate', 'Gates of Knowledge', '{}'),
('Amos', 'Prophet''s Street', '{}'),
('Cypher', 'Code Breaking Center', '{}'),
('HolyBagel', 'Sacred Bread House', '{}'),
('DefuseBomb', 'Danger Zone', '{}'),
('Park1', 'First Green Sanctuary', '{}'),
('Park2', 'Second Nature Spot', '{}'),
('Park3', 'Third Peaceful Grove', '{}'),
('Park4', 'Fourth Urban Oasis', '{}'),
('BookCypher', 'Literary Secrets', '{}'),
('GanWizo', 'Garden of Mysteries', '{}');

-- Note: The above stations have empty routes ({}) - you need to fill these in
-- based on your specific team sequences. Use the admin panel to configure
-- the complete routes for each team through these stations.

-- Create some sample team visit data for testing (optional)
INSERT INTO team_visits (team_password, station_id, success, timestamp) VALUES
('1111', 'GameOpen', true, NOW() - INTERVAL '2 hours'),
('1111', 'SuperKeizer', true, NOW() - INTERVAL '1 hour 45 minutes'),
('2222', 'GameOpen', true, NOW() - INTERVAL '2 hours 10 minutes'),
('2222', 'Pizza', true, NOW() - INTERVAL '1 hour 50 minutes'),
('3333', 'GameOpen', true, NOW() - INTERVAL '2 hours 5 minutes');

-- Verify the data was inserted
SELECT 'Sample data inserted successfully! You can now configure the remaining station routes.' as status;
SELECT 'Stations created: ' || COUNT(*) as station_count FROM stations;
SELECT 'Sample visits logged: ' || COUNT(*) as visit_count FROM team_visits;