-- Seed the global exercise library (user_id = null => visible to everyone).
-- The four big compound lifts are flagged is_major = true; the deload
-- algorithm specifically watches major lifts for stalls.

insert into public.exercises (user_id, name, muscle_group, movement_pattern, is_major)
values
  -- Major compound lifts
  (null, 'Barbell Back Squat',   'Quads',      'Squat',           true),
  (null, 'Barbell Bench Press',  'Chest',      'Horizontal Push', true),
  (null, 'Conventional Deadlift','Back',       'Hinge',           true),
  (null, 'Overhead Press',       'Shoulders',  'Vertical Push',   true),

  -- Lower body
  (null, 'Front Squat',          'Quads',      'Squat',           false),
  (null, 'Romanian Deadlift',    'Hamstrings', 'Hinge',           false),
  (null, 'Leg Press',            'Quads',      'Squat',           false),
  (null, 'Walking Lunge',        'Quads',      'Lunge',           false),
  (null, 'Leg Curl',             'Hamstrings', 'Knee Flexion',    false),
  (null, 'Leg Extension',        'Quads',      'Knee Extension',  false),
  (null, 'Standing Calf Raise',  'Calves',     'Ankle Extension', false),

  -- Upper body push
  (null, 'Incline Bench Press',  'Chest',      'Horizontal Push', false),
  (null, 'Dumbbell Bench Press', 'Chest',      'Horizontal Push', false),
  (null, 'Dip',                  'Chest',      'Horizontal Push', false),
  (null, 'Lateral Raise',        'Shoulders',  'Abduction',       false),
  (null, 'Triceps Pushdown',     'Triceps',    'Elbow Extension', false),

  -- Upper body pull
  (null, 'Pull-Up',              'Back',       'Vertical Pull',   false),
  (null, 'Lat Pulldown',         'Back',       'Vertical Pull',   false),
  (null, 'Barbell Row',          'Back',       'Horizontal Pull', false),
  (null, 'Seated Cable Row',     'Back',       'Horizontal Pull', false),
  (null, 'Face Pull',            'Shoulders',  'Horizontal Pull', false),
  (null, 'Barbell Curl',         'Biceps',     'Elbow Flexion',   false),
  (null, 'Hammer Curl',          'Biceps',     'Elbow Flexion',   false)
on conflict do nothing;
