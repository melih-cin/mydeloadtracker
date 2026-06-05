-- Round out the exercise library toward StrengthLevel's catalog (~65 more
-- movements across all muscle groups: more presses/rows/curls, Olympic lifts,
-- unilateral work, core, and strongman). All global (user_id = null), non-major.
--
-- Self-sufficient + idempotent: ensures the equipment column and the partial
-- unique index exist first, so it can run after 0001-0003 even if 0004/0005
-- haven't been applied, and is safe to re-run.

alter table public.exercises
  add column if not exists equipment text;

create unique index if not exists exercises_global_name_uidx
  on public.exercises (name)
  where user_id is null;

insert into public.exercises (user_id, name, muscle_group, movement_pattern, equipment, is_major)
values
  -- Chest
  (null, 'Cable Crossover',            'Chest',      'Horizontal Push', 'cable',      false),
  (null, 'Incline Machine Press',      'Chest',      'Horizontal Push', 'machine',    false),
  (null, 'Decline Dumbbell Press',     'Chest',      'Horizontal Push', 'dumbbell',   false),
  (null, 'Spoto Press',                'Chest',      'Horizontal Push', 'barbell',    false),
  (null, 'Dumbbell Pullover',          'Chest',      'Horizontal Push', 'dumbbell',   false),
  (null, 'Plyo Push-Up',               'Chest',      'Horizontal Push', 'bodyweight', false),

  -- Back
  (null, 'Yates Row',                  'Back',       'Horizontal Pull', 'barbell',    false),
  (null, 'Machine Row',                'Back',       'Horizontal Pull', 'machine',    false),
  (null, 'Wide-Grip Pulldown',         'Back',       'Vertical Pull',   'cable',      false),
  (null, 'Neutral-Grip Pulldown',      'Back',       'Vertical Pull',   'cable',      false),
  (null, 'One-Arm Lat Pulldown',       'Back',       'Vertical Pull',   'cable',      false),
  (null, 'Trap Bar Row',               'Back',       'Horizontal Pull', 'barbell',    false),
  (null, 'Back Extension',             'Back',       'Hinge',           'bodyweight', false),
  (null, '45-Degree Hyperextension',   'Back',       'Hinge',           'machine',    false),
  (null, 'Sumo Deadlift',              'Back',       'Hinge',           'barbell',    false),
  (null, 'Jefferson Deadlift',         'Back',       'Hinge',           'barbell',    false),
  (null, 'Atlas Stone',                'Back',       'Hinge',           'other',      false),

  -- Shoulders
  (null, 'Front Raise',                'Shoulders',  'Flexion',         'dumbbell',   false),
  (null, 'Cable Front Raise',          'Shoulders',  'Flexion',         'cable',      false),
  (null, 'Plate Front Raise',          'Shoulders',  'Flexion',         'other',      false),
  (null, 'Machine Lateral Raise',      'Shoulders',  'Abduction',       'machine',    false),
  (null, 'Behind-the-Neck Press',      'Shoulders',  'Vertical Push',   'barbell',    false),
  (null, 'Viking Press',               'Shoulders',  'Vertical Push',   'machine',    false),
  (null, 'Log Press',                  'Shoulders',  'Vertical Push',   'other',      false),
  (null, 'Battle Ropes',               'Shoulders',  'Conditioning',    'other',      false),

  -- Quads
  (null, 'Safety Bar Squat',           'Quads',      'Squat',           'barbell',    false),
  (null, 'Reverse Lunge',              'Quads',      'Lunge',           'dumbbell',   false),
  (null, 'Lateral Lunge',              'Quads',      'Lunge',           'dumbbell',   false),
  (null, 'Pistol Squat',               'Quads',      'Squat',           'bodyweight', false),
  (null, 'Heels-Elevated Goblet Squat','Quads',      'Squat',           'dumbbell',   false),
  (null, 'Vertical Leg Press',         'Quads',      'Squat',           'machine',    false),
  (null, 'Thruster',                   'Quads',      'Squat',           'barbell',    false),
  (null, 'Overhead Squat',             'Quads',      'Squat',           'barbell',    false),
  (null, 'Box Jump',                   'Quads',      'Jump',            'bodyweight', false),

  -- Hamstrings / glutes
  (null, 'Cable Romanian Deadlift',    'Hamstrings', 'Hinge',           'cable',      false),
  (null, 'Kettlebell Deadlift',        'Hamstrings', 'Hinge',           'kettlebell', false),
  (null, 'B-Stance Hip Thrust',        'Glutes',     'Hinge',           'barbell',    false),
  (null, 'Hip Thrust Machine',         'Glutes',     'Hinge',           'machine',    false),
  (null, 'Frog Pump',                  'Glutes',     'Hinge',           'bodyweight', false),

  -- Calves
  (null, 'Smith Machine Calf Raise',   'Calves',     'Ankle Extension', 'machine',    false),
  (null, 'Tibialis Raise',             'Calves',     'Ankle Flexion',   'bodyweight', false),

  -- Triceps
  (null, 'California Press',            'Triceps',    'Elbow Extension', 'barbell',    false),
  (null, 'Board Press',                'Triceps',    'Horizontal Push', 'barbell',    false),
  (null, 'Reverse-Grip Pushdown',      'Triceps',    'Elbow Extension', 'cable',      false),
  (null, 'Single-Arm Pushdown',        'Triceps',    'Elbow Extension', 'cable',      false),

  -- Biceps
  (null, 'Dumbbell Curl',              'Biceps',     'Elbow Flexion',   'dumbbell',   false),
  (null, 'Cross-Body Hammer Curl',     'Biceps',     'Elbow Flexion',   'dumbbell',   false),
  (null, 'Machine Preacher Curl',      'Biceps',     'Elbow Flexion',   'machine',    false),
  (null, 'Cable Hammer Curl',          'Biceps',     'Elbow Flexion',   'cable',      false),

  -- Forearms
  (null, 'Behind-the-Back Wrist Curl', 'Forearms',   'Wrist Flexion',   'barbell',    false),
  (null, 'Hand Gripper',               'Forearms',   'Grip',            'other',      false),

  -- Traps
  (null, 'Trap Bar Shrug',             'Traps',      'Shrug',           'barbell',    false),
  (null, 'Cable Shrug',                'Traps',      'Shrug',           'cable',      false),
  (null, 'Yoke Carry',                 'Traps',      'Carry',           'other',      false),

  -- Core
  (null, 'Sit-Up',                     'Core',       'Trunk Flexion',   'bodyweight', false),
  (null, 'V-Up',                       'Core',       'Trunk Flexion',   'bodyweight', false),
  (null, 'Lying Leg Raise',            'Core',       'Hip Flexion',     'bodyweight', false),
  (null, 'Flutter Kicks',              'Core',       'Hip Flexion',     'bodyweight', false),
  (null, 'Mountain Climber',           'Core',       'Hip Flexion',     'bodyweight', false),
  (null, 'Hollow Hold',                'Core',       'Anti-Extension',  'bodyweight', false),
  (null, 'Bird Dog',                   'Core',       'Anti-Extension',  'bodyweight', false),
  (null, 'Cable Side Bend',            'Core',       'Lateral Flexion', 'cable',      false),
  (null, 'Windshield Wiper',           'Core',       'Rotation',        'bodyweight', false),
  (null, 'Burpee',                     'Core',       'Conditioning',    'bodyweight', false),

  -- Olympic / power
  (null, 'Power Snatch',               'Back',       'Olympic',         'barbell',    false),
  (null, 'Hang Snatch',                'Back',       'Olympic',         'barbell',    false),
  (null, 'Snatch Pull',                'Back',       'Hinge',           'barbell',    false),
  (null, 'Split Jerk',                 'Shoulders',  'Olympic',         'barbell',    false),
  (null, 'Clean and Press',            'Shoulders',  'Olympic',         'barbell',    false),

  -- Adductors
  (null, 'Cossack Squat',              'Adductors',  'Squat',           'dumbbell',   false)
on conflict do nothing;
