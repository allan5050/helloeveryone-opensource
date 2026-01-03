-- Demo User Seed Data for Data Science Conference Presentation
-- Creates 25 diverse users with varied interests, professions, and characteristics
-- Designed to showcase multi-dimensional matching algorithms

-- Clear existing demo data (optional - be careful with this in production!)
-- DELETE FROM profiles WHERE display_name LIKE 'Demo:%';

-- Insert demo users with diverse characteristics
INSERT INTO profiles (
  user_id,
  display_name,
  full_name,
  bio,
  age,
  location,
  interests,
  looking_for,
  availability,
  privacy_settings,
  role,
  is_active,
  is_profile_complete,
  photo_url,
  preferred_age_min,
  preferred_age_max
) VALUES
-- Tech & Data Science Cluster
(
  gen_random_uuid(),
  'Demo: Jane Doe',
  'Jane Doe',
  'Data scientist passionate about machine learning and ethical AI. Love hiking with my golden retriever Max and exploring sci-fi novels. Big Star Trek fan!',
  32,
  '94107', -- San Francisco
  ARRAY['data-science', 'machine-learning', 'hiking', 'dogs', 'star-trek', 'reading', 'coffee'],
  ARRAY['friendship', 'professional-networking'],
  ARRAY['weekends', 'evenings'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
  28,
  40
),
(
  gen_random_uuid(),
  'Demo: Alex Chen',
  'Alex Chen',
  'ML engineer at a healthcare startup. Enjoy board games, cooking Asian fusion, and Star Trek marathons. Have two cats!',
  29,
  '94107', -- San Francisco
  ARRAY['machine-learning', 'healthcare-tech', 'board-games', 'cooking', 'star-trek', 'cats'],
  ARRAY['friendship', 'professional-networking'],
  ARRAY['weekends'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
  25,
  35
),
(
  gen_random_uuid(),
  'Demo: Sarah Johnson',
  'Sarah Johnson',
  'Senior data analyst in fintech. Dog mom to two rescues. Love trail running and true crime podcasts.',
  35,
  '94110', -- San Francisco
  ARRAY['data-analytics', 'fintech', 'dogs', 'running', 'podcasts', 'hiking'],
  ARRAY['friendship', 'activity-partner'],
  ARRAY['mornings', 'weekends'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
  30,
  42
),
(
  gen_random_uuid(),
  'Demo: Marcus Williams',
  'Marcus Williams',
  'AI researcher focused on NLP. Jazz enthusiast, amateur chef, and proud dad of twin toddlers.',
  38,
  '94102', -- San Francisco
  ARRAY['artificial-intelligence', 'nlp', 'jazz', 'cooking', 'parenting', 'music'],
  ARRAY['friendship', 'professional-networking'],
  ARRAY['evenings'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
  32,
  45
),
(
  gen_random_uuid(),
  'Demo: Emily Zhang',
  'Emily Zhang',
  'Data engineer building ETL pipelines. Sci-fi book club organizer, coffee snob, and urban gardener.',
  30,
  '94103', -- San Francisco
  ARRAY['data-engineering', 'science-fiction', 'reading', 'coffee', 'gardening', 'star-wars'],
  ARRAY['friendship', 'book-club'],
  ARRAY['evenings', 'weekends'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
  26,
  36
),

-- Creative & Design Cluster
(
  gen_random_uuid(),
  'Demo: Tom Anderson',
  'Tom Anderson',
  'UX designer in ad-tech. Weekend photographer, craft beer enthusiast, and dog park regular with my beagle.',
  34,
  '94107', -- San Francisco
  ARRAY['ux-design', 'ad-tech', 'photography', 'craft-beer', 'dogs', 'art'],
  ARRAY['friendship', 'activity-partner'],
  ARRAY['weekends', 'evenings'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=tom',
  28,
  40
),
(
  gen_random_uuid(),
  'Demo: Lisa Park',
  'Lisa Park',
  'Graphic designer and illustrator. Love yoga, farmers markets, and hosting dinner parties. Cat mom to three!',
  31,
  '94110', -- San Francisco
  ARRAY['graphic-design', 'illustration', 'yoga', 'cooking', 'cats', 'art', 'mindfulness'],
  ARRAY['friendship', 'activity-partner'],
  ARRAY['mornings', 'weekends'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
  27,
  38
),

-- Healthcare & Science Cluster
(
  gen_random_uuid(),
  'Demo: Dr. Rachel Green',
  'Dr. Rachel Green',
  'Medical researcher in biotech. Marathon runner, science podcast host, and mother of two teenagers.',
  42,
  '94102', -- San Francisco
  ARRAY['medical-research', 'biotech', 'running', 'podcasts', 'science', 'parenting'],
  ARRAY['friendship', 'professional-networking'],
  ARRAY['mornings'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=rachel',
  35,
  48
),
(
  gen_random_uuid(),
  'Demo: James Miller',
  'James Miller',
  'Clinical data analyst in healthcare. Rock climbing enthusiast, home brewer, and Star Wars fan.',
  28,
  '94103', -- San Francisco
  ARRAY['healthcare-tech', 'data-analysis', 'rock-climbing', 'brewing', 'star-wars'],
  ARRAY['friendship', 'activity-partner'],
  ARRAY['evenings', 'weekends'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
  24,
  34
),

-- Business & Marketing Cluster
(
  gen_random_uuid(),
  'Demo: Michael Brown',
  'Michael Brown',
  'Marketing director in ad-tech. Golf player, wine enthusiast, and father of a 5-year-old.',
  39,
  '94108', -- San Francisco
  ARRAY['marketing', 'ad-tech', 'golf', 'wine', 'parenting', 'business'],
  ARRAY['friendship', 'professional-networking'],
  ARRAY['weekends'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
  33,
  45
),
(
  gen_random_uuid(),
  'Demo: Jennifer Davis',
  'Jennifer Davis',
  'Product manager in fintech. Yoga instructor, foodie, and dog walker volunteer.',
  33,
  '94110', -- San Francisco
  ARRAY['product-management', 'fintech', 'yoga', 'food', 'dogs', 'volunteering'],
  ARRAY['friendship', 'activity-partner'],
  ARRAY['mornings', 'evenings'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=jennifer',
  28,
  40
),

-- Diverse Interests Group
(
  gen_random_uuid(),
  'Demo: David Kim',
  'David Kim',
  'Software engineer who loves basketball, BBQ, and building robots with my kids on weekends.',
  36,
  '94107', -- San Francisco
  ARRAY['software-engineering', 'basketball', 'bbq', 'robotics', 'parenting', 'sports'],
  ARRAY['friendship', 'activity-partner'],
  ARRAY['weekends'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
  30,
  42
),
(
  gen_random_uuid(),
  'Demo: Amanda White',
  'Amanda White',
  'Teacher turned EdTech consultant. Book club regular, amateur baker, and proud plant parent.',
  37,
  '94102', -- San Francisco
  ARRAY['education', 'edtech', 'reading', 'baking', 'gardening', 'books'],
  ARRAY['friendship', 'book-club'],
  ARRAY['evenings', 'weekends'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=amanda',
  32,
  44
),
(
  gen_random_uuid(),
  'Demo: Robert Taylor',
  'Robert Taylor',
  'Financial analyst who enjoys cycling, craft cocktails, and hosting board game nights.',
  41,
  '94108', -- San Francisco
  ARRAY['finance', 'cycling', 'cocktails', 'board-games', 'entertaining'],
  ARRAY['friendship', 'activity-partner'],
  ARRAY['evenings', 'weekends'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=robert',
  35,
  47
),
(
  gen_random_uuid(),
  'Demo: Maria Garcia',
  'Maria Garcia',
  'Startup founder in healthtech. Salsa dancer, travel blogger, and coffee addict.',
  34,
  '94103', -- San Francisco
  ARRAY['entrepreneurship', 'healthtech', 'dancing', 'travel', 'coffee', 'blogging'],
  ARRAY['friendship', 'professional-networking'],
  ARRAY['evenings'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
  29,
  40
),
(
  gen_random_uuid(),
  'Demo: Chris Thompson',
  'Chris Thompson',
  'DevOps engineer and home automation enthusiast. Enjoy brewing coffee, hiking, and retro gaming.',
  27,
  '94110', -- San Francisco
  ARRAY['devops', 'home-automation', 'coffee', 'hiking', 'gaming', 'technology'],
  ARRAY['friendship', 'activity-partner'],
  ARRAY['weekends', 'evenings'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=chris',
  23,
  33
),
(
  gen_random_uuid(),
  'Demo: Patricia Lee',
  'Patricia Lee',
  'Content strategist in tech. Meditation practitioner, indie music fan, and urban sketcher.',
  35,
  '94102', -- San Francisco
  ARRAY['content-strategy', 'meditation', 'music', 'art', 'sketching', 'mindfulness'],
  ARRAY['friendship', 'activity-partner'],
  ARRAY['mornings', 'weekends'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=patricia',
  30,
  42
),
(
  gen_random_uuid(),
  'Demo: Kevin Martinez',
  'Kevin Martinez',
  'Security engineer and privacy advocate. Into competitive chess, sci-fi novels, and BBQ competitions.',
  40,
  '94107', -- San Francisco
  ARRAY['cybersecurity', 'privacy', 'chess', 'science-fiction', 'bbq', 'competition'],
  ARRAY['friendship', 'activity-partner'],
  ARRAY['weekends'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=kevin',
  34,
  46
),
(
  gen_random_uuid(),
  'Demo: Nancy Wilson',
  'Nancy Wilson',
  'HR tech specialist. Pilates instructor, wine club member, and golden retriever mom.',
  38,
  '94108', -- San Francisco
  ARRAY['hr-tech', 'pilates', 'wine', 'dogs', 'fitness', 'wellness'],
  ARRAY['friendship', 'activity-partner'],
  ARRAY['mornings', 'evenings'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=nancy',
  33,
  44
),
(
  gen_random_uuid(),
  'Demo: Steven Clark',
  'Steven Clark',
  'Blockchain developer and crypto enthusiast. Mountain biker, podcast host, and amateur astronomer.',
  31,
  '94103', -- San Francisco
  ARRAY['blockchain', 'cryptocurrency', 'mountain-biking', 'podcasts', 'astronomy', 'technology'],
  ARRAY['friendship', 'professional-networking'],
  ARRAY['evenings', 'weekends'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=steven',
  27,
  37
),
(
  gen_random_uuid(),
  'Demo: Laura Rodriguez',
  'Laura Rodriguez',
  'Social media manager and digital nomad. Yoga teacher, vegan cook, and sustainability advocate.',
  29,
  '94110', -- San Francisco
  ARRAY['social-media', 'digital-marketing', 'yoga', 'vegan-cooking', 'sustainability', 'travel'],
  ARRAY['friendship', 'activity-partner'],
  ARRAY['flexible'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=laura',
  25,
  35
),
(
  gen_random_uuid(),
  'Demo: Daniel Harris',
  'Daniel Harris',
  'QA engineer and testing automation expert. Board game designer, craft beer brewer, and corgi dad.',
  33,
  '94102', -- San Francisco
  ARRAY['qa-testing', 'automation', 'board-games', 'brewing', 'dogs', 'game-design'],
  ARRAY['friendship', 'activity-partner'],
  ARRAY['evenings', 'weekends'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=daniel',
  28,
  39
),
(
  gen_random_uuid(),
  'Demo: Michelle Lewis',
  'Michelle Lewis',
  'Business analyst in healthcare. Triathlete, nutrition coach, and mother of three.',
  43,
  '94108', -- San Francisco
  ARRAY['business-analysis', 'healthcare', 'triathlon', 'nutrition', 'parenting', 'fitness'],
  ARRAY['friendship', 'activity-partner'],
  ARRAY['mornings'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=michelle',
  37,
  49
),
(
  gen_random_uuid(),
  'Demo: Paul Walker',
  'Paul Walker',
  'Cloud architect and infrastructure guru. Car enthusiast, DIY home improver, and weekend chef.',
  45,
  '94107', -- San Francisco
  ARRAY['cloud-computing', 'infrastructure', 'cars', 'diy', 'cooking', 'technology'],
  ARRAY['friendship', 'activity-partner'],
  ARRAY['weekends'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=paul',
  38,
  52
),
(
  gen_random_uuid(),
  'Demo: Sandra Young',
  'Sandra Young',
  'Legal tech consultant. Classical music lover, museum volunteer, and Siamese cat owner.',
  44,
  '94103', -- San Francisco
  ARRAY['legal-tech', 'classical-music', 'museums', 'cats', 'culture', 'volunteering'],
  ARRAY['friendship', 'cultural-activities'],
  ARRAY['weekends', 'evenings'],
  '{"show_age": true, "show_location": true}'::jsonb,
  'user',
  true,
  true,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=sandra',
  38,
  50
);

-- Note: Bio embeddings will need to be generated separately using the OpenAI API
-- This can be done via the matching API endpoints after users are created