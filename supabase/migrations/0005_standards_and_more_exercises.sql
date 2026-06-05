-- Strength-standards support + a larger exercise library.
--
-- 1) Adds bodyweight + sex to profiles so we can band lifts against
--    StrengthLevel-style population standards (see src/lib/analytics/standards.ts)
--    and right-size deload cadence to the athlete's experience level.
-- 2) Makes the global exercise seeds idempotent: there was NO unique constraint
--    on exercise name, so re-running a seed (0002/0004) silently duplicated every
--    global row. A partial unique index fixes that and powers `on conflict`.
-- 3) Adds ~45 more movements (Olympic lifts, more rows/presses, core, carries).
--
-- Safe to run after 0001-0004 in order. Idempotent.

-- ---------------------------------------------------------------------------
-- 1) Profile: bodyweight (in the athlete's logging unit) + sex
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists bodyweight numeric(6, 2) check (bodyweight is null or bodyweight > 0);
alter table public.profiles
  add column if not exists sex text check (sex is null or sex in ('male', 'female'));

-- ---------------------------------------------------------------------------
-- 2) Make the global exercise library de-duplicated + future seeds idempotent.
--    (Defensively ensure the equipment column from 0004 exists, so this file
--    works even if 0004 has not been applied yet.)
-- ---------------------------------------------------------------------------
alter table public.exercises
  add column if not exists equipment text;

create unique index if not exists exercises_global_name_uidx
  on public.exercises (name)
  where user_id is null;

-- ---------------------------------------------------------------------------
-- 3) Expanded library. All global (user_id = null), non-major.
-- ---------------------------------------------------------------------------
insert into public.exercises (user_id, name, muscle_group, movement_pattern, equipment, is_major)
values
  -- Olympic / power
  (null, 'Power Clean',             'Back',       'Olympic',         'barbell',    false),
  (null, 'Hang Clean',              'Back',       'Olympic',         'barbell',    false),
  (null, 'Clean and Jerk',          'Back',       'Olympic',         'barbell',    false),
  (null, 'Snatch',                  'Back',       'Olympic',         'barbell',    false),
  (null, 'Push Press',              'Shoulders',  'Vertical Push',   'barbell',    false),
  (null, 'Push Jerk',               'Shoulders',  'Vertical Push',   'barbell',    false),
  (null, 'Clean Pull',              'Back',       'Hinge',           'barbell',    false),

  -- Quads
  (null, 'Trap Bar Deadlift',       'Quads',      'Hinge',           'barbell',    false),
  (null, 'Zercher Squat',           'Quads',      'Squat',           'barbell',    false),
  (null, 'Belt Squat',              'Quads',      'Squat',           'machine',    false),
  (null, 'Pendulum Squat',          'Quads',      'Squat',           'machine',    false),

  -- Hamstrings / glutes
  (null, 'Snatch-Grip Deadlift',    'Hamstrings', 'Hinge',           'barbell',    false),
  (null, 'Deficit Deadlift',        'Hamstrings', 'Hinge',           'barbell',    false),
  (null, 'Single-Leg Romanian Deadlift', 'Hamstrings', 'Hinge',      'dumbbell',   false),
  (null, 'Kettlebell Swing',        'Glutes',     'Hinge',           'kettlebell', false),
  (null, 'Single-Leg Hip Thrust',   'Glutes',     'Hinge',           'bodyweight', false),
  (null, 'Curtsy Lunge',            'Glutes',     'Lunge',           'dumbbell',   false),

  -- Calves
  (null, 'Single-Leg Calf Raise',   'Calves',     'Ankle Extension', 'dumbbell',   false),

  -- Chest
  (null, 'Floor Press',             'Chest',      'Horizontal Push', 'barbell',    false),
  (null, 'Smith Machine Bench Press','Chest',     'Horizontal Push', 'machine',    false),
  (null, 'Incline Cable Fly',       'Chest',      'Horizontal Push', 'cable',      false),

  -- Back
  (null, 'Seal Row',                'Back',       'Horizontal Pull', 'barbell',    false),
  (null, 'Meadows Row',             'Back',       'Horizontal Pull', 'barbell',    false),
  (null, 'Kroc Row',                'Back',       'Horizontal Pull', 'dumbbell',   false),
  (null, 'Behind-the-Neck Pulldown','Back',       'Vertical Pull',   'cable',      false),

  -- Shoulders
  (null, 'Z Press',                 'Shoulders',  'Vertical Push',   'barbell',    false),
  (null, 'Cable Rear Delt Row',     'Shoulders',  'Horizontal Pull', 'cable',      false),
  (null, 'Bradford Press',          'Shoulders',  'Vertical Push',   'barbell',    false),

  -- Traps
  (null, 'Power Shrug',             'Traps',      'Shrug',           'barbell',    false),
  (null, 'Snatch-Grip Shrug',       'Traps',      'Shrug',           'barbell',    false),

  -- Triceps
  (null, 'JM Press',                'Triceps',    'Elbow Extension', 'barbell',    false),
  (null, 'Tate Press',              'Triceps',    'Elbow Extension', 'dumbbell',   false),
  (null, 'Bench Dip',               'Triceps',    'Elbow Extension', 'bodyweight', false),
  (null, 'Triceps Kickback',        'Triceps',    'Elbow Extension', 'dumbbell',   false),

  -- Biceps
  (null, 'Zottman Curl',            'Biceps',     'Elbow Flexion',   'dumbbell',   false),
  (null, 'Drag Curl',               'Biceps',     'Elbow Flexion',   'barbell',    false),
  (null, 'Bayesian Cable Curl',     'Biceps',     'Elbow Flexion',   'cable',      false),

  -- Forearms
  (null, 'Wrist Roller',            'Forearms',   'Wrist Flexion',   'other',      false),
  (null, 'Plate Pinch',             'Forearms',   'Grip',            'other',      false),

  -- Core
  (null, 'Crunch',                  'Core',       'Trunk Flexion',   'bodyweight', false),
  (null, 'Bicycle Crunch',          'Core',       'Rotation',        'bodyweight', false),
  (null, 'Side Plank',              'Core',       'Anti-Lateral Flexion', 'bodyweight', false),
  (null, 'Dragon Flag',             'Core',       'Anti-Extension',  'bodyweight', false),
  (null, 'Toes-to-Bar',             'Core',       'Hip Flexion',     'bodyweight', false),
  (null, 'Cable Woodchopper',       'Core',       'Rotation',        'cable',      false),
  (null, 'Dead Bug',                'Core',       'Anti-Extension',  'bodyweight', false),
  (null, 'Hanging Knee Raise',      'Core',       'Hip Flexion',     'bodyweight', false),

  -- Adductors / carries / conditioning
  (null, 'Sumo Squat',              'Adductors',  'Squat',           'dumbbell',   false),
  (null, 'Copenhagen Plank',        'Adductors',  'Anti-Lateral Flexion', 'bodyweight', false),
  (null, 'Suitcase Carry',          'Core',       'Carry',           'dumbbell',   false),
  (null, 'Sled Push',               'Quads',      'Carry',           'machine',    false)
on conflict do nothing;
