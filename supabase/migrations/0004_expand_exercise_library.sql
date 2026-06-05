-- Expand the exercise library and add an `equipment` dimension for more detail.
-- Adds ~70 movements across 13 muscle groups (Quads, Hamstrings, Glutes,
-- Calves, Chest, Back, Shoulders, Traps, Triceps, Biceps, Forearms, Core,
-- Adductors). All new rows are global (user_id = null) and non-major.

-- 1) Add the equipment column.
alter table public.exercises
  add column if not exists equipment text;

-- 2) Backfill equipment for the originally-seeded exercises.
update public.exercises set equipment = 'barbell' where equipment is null and name in
  ('Barbell Back Squat','Barbell Bench Press','Conventional Deadlift','Overhead Press',
   'Front Squat','Romanian Deadlift','Incline Bench Press','Barbell Row','Barbell Curl');
update public.exercises set equipment = 'machine' where equipment is null and name in
  ('Leg Press','Leg Curl','Leg Extension','Standing Calf Raise');
update public.exercises set equipment = 'dumbbell' where equipment is null and name in
  ('Walking Lunge','Dumbbell Bench Press','Lateral Raise','Hammer Curl');
update public.exercises set equipment = 'cable' where equipment is null and name in
  ('Triceps Pushdown','Lat Pulldown','Seated Cable Row','Face Pull');
update public.exercises set equipment = 'bodyweight' where equipment is null and name in
  ('Dip','Pull-Up');

-- 3) Insert the expanded library.
insert into public.exercises (user_id, name, muscle_group, movement_pattern, equipment, is_major)
values
  -- Quads
  (null, 'Hack Squat',              'Quads',      'Squat',           'machine',    false),
  (null, 'Goblet Squat',            'Quads',      'Squat',           'kettlebell', false),
  (null, 'Bulgarian Split Squat',   'Quads',      'Lunge',           'dumbbell',   false),
  (null, 'Smith Machine Squat',     'Quads',      'Squat',           'machine',    false),
  (null, 'Step-Up',                 'Quads',      'Lunge',           'dumbbell',   false),
  (null, 'Sissy Squat',             'Quads',      'Knee Extension',  'bodyweight', false),
  (null, 'Pause Squat',             'Quads',      'Squat',           'barbell',    false),
  (null, 'Box Squat',               'Quads',      'Squat',           'barbell',    false),

  -- Hamstrings
  (null, 'Seated Leg Curl',         'Hamstrings', 'Knee Flexion',    'machine',    false),
  (null, 'Lying Leg Curl',          'Hamstrings', 'Knee Flexion',    'machine',    false),
  (null, 'Stiff-Leg Deadlift',      'Hamstrings', 'Hinge',           'barbell',    false),
  (null, 'Good Morning',            'Hamstrings', 'Hinge',           'barbell',    false),
  (null, 'Nordic Curl',             'Hamstrings', 'Knee Flexion',    'bodyweight', false),
  (null, 'Glute-Ham Raise',         'Hamstrings', 'Knee Flexion',    'bodyweight', false),

  -- Glutes
  (null, 'Barbell Hip Thrust',      'Glutes',     'Hinge',           'barbell',    false),
  (null, 'Glute Bridge',            'Glutes',     'Hinge',           'barbell',    false),
  (null, 'Cable Pull-Through',      'Glutes',     'Hinge',           'cable',      false),
  (null, 'Cable Kickback',          'Glutes',     'Hip Extension',   'cable',      false),
  (null, 'Reverse Hyperextension',  'Glutes',     'Hinge',           'machine',    false),

  -- Calves
  (null, 'Seated Calf Raise',       'Calves',     'Ankle Extension', 'machine',    false),
  (null, 'Leg Press Calf Raise',    'Calves',     'Ankle Extension', 'machine',    false),
  (null, 'Donkey Calf Raise',       'Calves',     'Ankle Extension', 'machine',    false),

  -- Chest
  (null, 'Decline Bench Press',     'Chest',      'Horizontal Push', 'barbell',    false),
  (null, 'Incline Dumbbell Press',  'Chest',      'Horizontal Push', 'dumbbell',   false),
  (null, 'Cable Fly',               'Chest',      'Horizontal Push', 'cable',      false),
  (null, 'Pec Deck',                'Chest',      'Horizontal Push', 'machine',    false),
  (null, 'Push-Up',                 'Chest',      'Horizontal Push', 'bodyweight', false),
  (null, 'Machine Chest Press',     'Chest',      'Horizontal Push', 'machine',    false),
  (null, 'Dumbbell Fly',            'Chest',      'Horizontal Push', 'dumbbell',   false),

  -- Back
  (null, 'Pendlay Row',             'Back',       'Horizontal Pull', 'barbell',    false),
  (null, 'T-Bar Row',               'Back',       'Horizontal Pull', 'machine',    false),
  (null, 'Chest-Supported Row',     'Back',       'Horizontal Pull', 'machine',    false),
  (null, 'Single-Arm Dumbbell Row', 'Back',       'Horizontal Pull', 'dumbbell',   false),
  (null, 'Chin-Up',                 'Back',       'Vertical Pull',   'bodyweight', false),
  (null, 'Straight-Arm Pulldown',   'Back',       'Vertical Pull',   'cable',      false),
  (null, 'Rack Pull',               'Back',       'Hinge',           'barbell',    false),
  (null, 'Inverted Row',            'Back',       'Horizontal Pull', 'bodyweight', false),

  -- Shoulders
  (null, 'Seated Dumbbell Press',   'Shoulders',  'Vertical Push',   'dumbbell',   false),
  (null, 'Arnold Press',            'Shoulders',  'Vertical Push',   'dumbbell',   false),
  (null, 'Cable Lateral Raise',     'Shoulders',  'Abduction',       'cable',      false),
  (null, 'Rear Delt Fly',           'Shoulders',  'Horizontal Pull', 'dumbbell',   false),
  (null, 'Reverse Pec Deck',        'Shoulders',  'Horizontal Pull', 'machine',    false),
  (null, 'Upright Row',             'Shoulders',  'Vertical Pull',   'barbell',    false),
  (null, 'Landmine Press',          'Shoulders',  'Vertical Push',   'barbell',    false),
  (null, 'Machine Shoulder Press',  'Shoulders',  'Vertical Push',   'machine',    false),

  -- Traps
  (null, 'Barbell Shrug',           'Traps',      'Shrug',           'barbell',    false),
  (null, 'Dumbbell Shrug',          'Traps',      'Shrug',           'dumbbell',   false),
  (null, 'Farmer''s Carry',         'Traps',      'Carry',           'dumbbell',   false),

  -- Triceps
  (null, 'Skull Crusher',           'Triceps',    'Elbow Extension', 'barbell',    false),
  (null, 'Overhead Triceps Extension','Triceps',  'Elbow Extension', 'dumbbell',   false),
  (null, 'Close-Grip Bench Press',  'Triceps',    'Horizontal Push', 'barbell',    false),
  (null, 'Rope Pushdown',           'Triceps',    'Elbow Extension', 'cable',      false),
  (null, 'Diamond Push-Up',         'Triceps',    'Horizontal Push', 'bodyweight', false),

  -- Biceps
  (null, 'Preacher Curl',           'Biceps',     'Elbow Flexion',   'barbell',    false),
  (null, 'Incline Dumbbell Curl',   'Biceps',     'Elbow Flexion',   'dumbbell',   false),
  (null, 'Cable Curl',              'Biceps',     'Elbow Flexion',   'cable',      false),
  (null, 'Concentration Curl',      'Biceps',     'Elbow Flexion',   'dumbbell',   false),
  (null, 'EZ-Bar Curl',             'Biceps',     'Elbow Flexion',   'barbell',    false),
  (null, 'Spider Curl',             'Biceps',     'Elbow Flexion',   'dumbbell',   false),

  -- Forearms
  (null, 'Wrist Curl',              'Forearms',   'Wrist Flexion',   'barbell',    false),
  (null, 'Reverse Wrist Curl',      'Forearms',   'Wrist Extension', 'barbell',    false),
  (null, 'Reverse Curl',            'Forearms',   'Elbow Flexion',   'barbell',    false),

  -- Core
  (null, 'Hanging Leg Raise',       'Core',       'Hip Flexion',     'bodyweight', false),
  (null, 'Cable Crunch',            'Core',       'Trunk Flexion',   'cable',      false),
  (null, 'Plank',                   'Core',       'Anti-Extension',  'bodyweight', false),
  (null, 'Ab Wheel Rollout',        'Core',       'Anti-Extension',  'bodyweight', false),
  (null, 'Russian Twist',           'Core',       'Rotation',        'bodyweight', false),
  (null, 'Decline Sit-Up',          'Core',       'Trunk Flexion',   'bodyweight', false),
  (null, 'Pallof Press',            'Core',       'Anti-Rotation',   'cable',      false),

  -- Adductors
  (null, 'Hip Adduction Machine',   'Adductors',  'Adduction',       'machine',    false)
on conflict do nothing;
