-- 0011 - strengthlevel.com library + standards source of truth.
-- Restricts the loggable library to the 64 lifts in strength-standards.json,
-- renaming existing rows to the file's names (preserves IDs and history),
-- inserting the genuinely-new lifts, and hiding everything else. Non-destructive
-- and idempotent: safe to run more than once.

alter table public.exercises add column if not exists hidden boolean not null default false;

-- Rename existing global exercises to the file's canonical names.
update public.exercises set name = 'Pull Ups', hidden = false
  where user_id is null and name = 'Pull-Up'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Pull Ups');
update public.exercises set name = 'Push Ups', hidden = false
  where user_id is null and name = 'Push-Up'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Push Ups');
update public.exercises set name = 'EZ Bar Curl', hidden = false
  where user_id is null and name = 'EZ-Bar Curl'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'EZ Bar Curl');
update public.exercises set name = 'Close Grip Bench Press', hidden = false
  where user_id is null and name = 'Close-Grip Bench Press'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Close Grip Bench Press');
update public.exercises set name = 'T Bar Row', hidden = false
  where user_id is null and name = 'T-Bar Row'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'T Bar Row');
update public.exercises set name = 'Chin Ups', hidden = false
  where user_id is null and name = 'Chin-Up'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Chin Ups');
update public.exercises set name = 'Sit Ups', hidden = false
  where user_id is null and name = 'Sit-Up'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Sit Ups');
update public.exercises set name = 'Diamond Push Ups', hidden = false
  where user_id is null and name = 'Diamond Push-Up'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Diamond Push Ups');
update public.exercises set name = 'Bench Press', hidden = false
  where user_id is null and name = 'Barbell Bench Press'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Bench Press');
update public.exercises set name = 'Squat', hidden = false
  where user_id is null and name = 'Barbell Back Squat'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Squat');
update public.exercises set name = 'Deadlift', hidden = false
  where user_id is null and name = 'Conventional Deadlift'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Deadlift');
update public.exercises set name = 'Shoulder Press', hidden = false
  where user_id is null and name = 'Overhead Press'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Shoulder Press');
update public.exercises set name = 'Bent Over Row', hidden = false
  where user_id is null and name = 'Barbell Row'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Bent Over Row');
update public.exercises set name = 'Hex Bar Deadlift', hidden = false
  where user_id is null and name = 'Trap Bar Deadlift'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Hex Bar Deadlift');
update public.exercises set name = 'Lying Tricep Extension', hidden = false
  where user_id is null and name = 'Skull Crusher'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Lying Tricep Extension');
update public.exercises set name = 'Dumbbell Bulgarian Split Squat', hidden = false
  where user_id is null and name = 'Bulgarian Split Squat'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Dumbbell Bulgarian Split Squat');
update public.exercises set name = 'Horizontal Leg Press', hidden = false
  where user_id is null and name = 'Leg Press'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Horizontal Leg Press');
update public.exercises set name = 'Chest Press', hidden = false
  where user_id is null and name = 'Machine Chest Press'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Chest Press');
update public.exercises set name = 'Hip Adduction', hidden = false
  where user_id is null and name = 'Hip Adduction Machine'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Hip Adduction');
update public.exercises set name = 'Tricep Pushdown', hidden = false
  where user_id is null and name = 'Triceps Pushdown'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Tricep Pushdown');
update public.exercises set name = 'Incline Dumbbell Bench Press', hidden = false
  where user_id is null and name = 'Incline Dumbbell Press'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Incline Dumbbell Bench Press');
update public.exercises set name = 'Hip Thrust', hidden = false
  where user_id is null and name = 'Barbell Hip Thrust'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Hip Thrust');
update public.exercises set name = 'Seated Dumbbell Shoulder Press', hidden = false
  where user_id is null and name = 'Seated Dumbbell Press'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Seated Dumbbell Shoulder Press');
update public.exercises set name = 'Dips', hidden = false
  where user_id is null and name = 'Dip'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Dips');
update public.exercises set name = 'Crunches', hidden = false
  where user_id is null and name = 'Crunch'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Crunches');
update public.exercises set name = 'Dumbbell Lateral Raise', hidden = false
  where user_id is null and name = 'Lateral Raise'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Dumbbell Lateral Raise');
update public.exercises set name = 'Dumbbell Row', hidden = false
  where user_id is null and name = 'Single-Arm Dumbbell Row'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Dumbbell Row');
update public.exercises set name = 'Machine Chest Fly', hidden = false
  where user_id is null and name = 'Pec Deck'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Machine Chest Fly');
update public.exercises set name = 'Machine Calf Raise', hidden = false
  where user_id is null and name = 'Standing Calf Raise'
  and not exists (select 1 from public.exercises e2 where e2.user_id is null and e2.name = 'Machine Calf Raise');

-- Insert the lifts that did not exist yet.
insert into public.exercises (user_id, name, muscle_group, movement_pattern, equipment, is_major)
  select null, 'Military Press', 'Shoulders', 'Vertical Push', 'barbell', false
  where not exists (select 1 from public.exercises where user_id is null and name = 'Military Press');
insert into public.exercises (user_id, name, muscle_group, movement_pattern, equipment, is_major)
  select null, 'Seated Shoulder Press', 'Shoulders', 'Vertical Push', 'machine', false
  where not exists (select 1 from public.exercises where user_id is null and name = 'Seated Shoulder Press');
insert into public.exercises (user_id, name, muscle_group, movement_pattern, equipment, is_major)
  select null, 'Clean', 'Back', 'Hinge', 'barbell', false
  where not exists (select 1 from public.exercises where user_id is null and name = 'Clean');
insert into public.exercises (user_id, name, muscle_group, movement_pattern, equipment, is_major)
  select null, 'Muscle Ups', 'Back', 'Vertical Pull', 'bodyweight', false
  where not exists (select 1 from public.exercises where user_id is null and name = 'Muscle Ups');
insert into public.exercises (user_id, name, muscle_group, movement_pattern, equipment, is_major)
  select null, 'Bodyweight Squat', 'Quads', 'Squat', 'bodyweight', false
  where not exists (select 1 from public.exercises where user_id is null and name = 'Bodyweight Squat');
insert into public.exercises (user_id, name, muscle_group, movement_pattern, equipment, is_major)
  select null, 'One Arm Push Ups', 'Chest', 'Horizontal Push', 'bodyweight', false
  where not exists (select 1 from public.exercises where user_id is null and name = 'One Arm Push Ups');
insert into public.exercises (user_id, name, muscle_group, movement_pattern, equipment, is_major)
  select null, 'Neutral Grip Pull Ups', 'Back', 'Vertical Pull', 'bodyweight', false
  where not exists (select 1 from public.exercises where user_id is null and name = 'Neutral Grip Pull Ups');
insert into public.exercises (user_id, name, muscle_group, movement_pattern, equipment, is_major)
  select null, 'Dumbbell Shoulder Press', 'Shoulders', 'Vertical Push', 'dumbbell', false
  where not exists (select 1 from public.exercises where user_id is null and name = 'Dumbbell Shoulder Press');
insert into public.exercises (user_id, name, muscle_group, movement_pattern, equipment, is_major)
  select null, 'Sled Leg Press', 'Quads', 'Squat', 'machine', false
  where not exists (select 1 from public.exercises where user_id is null and name = 'Sled Leg Press');

-- Show exactly the 64 file lifts; hide all other global exercises (kept, not deleted,
-- so existing history still resolves).
update public.exercises set hidden = false where user_id is null and name in (
    'Bench Press',
    'Squat',
    'Deadlift',
    'Shoulder Press',
    'Pull Ups',
    'Dumbbell Bench Press',
    'Dumbbell Curl',
    'Push Ups',
    'Sled Leg Press',
    'Barbell Curl',
    'Incline Dumbbell Bench Press',
    'Bent Over Row',
    'Incline Bench Press',
    'Front Squat',
    'Hex Bar Deadlift',
    'Hip Thrust',
    'Romanian Deadlift',
    'Power Clean',
    'Military Press',
    'Sumo Deadlift',
    'Clean and Jerk',
    'EZ Bar Curl',
    'Lying Tricep Extension',
    'Close Grip Bench Press',
    'Snatch',
    'Preacher Curl',
    'Seated Shoulder Press',
    'Barbell Shrug',
    'T Bar Row',
    'Clean',
    'Push Press',
    'Smith Machine Bench Press',
    'Decline Bench Press',
    'Dips',
    'Chin Ups',
    'Crunches',
    'Sit Ups',
    'Muscle Ups',
    'Bodyweight Squat',
    'One Arm Push Ups',
    'Neutral Grip Pull Ups',
    'Diamond Push Ups',
    'Dumbbell Shoulder Press',
    'Dumbbell Lateral Raise',
    'Dumbbell Row',
    'Hammer Curl',
    'Seated Dumbbell Shoulder Press',
    'Dumbbell Bulgarian Split Squat',
    'Goblet Squat',
    'Dumbbell Fly',
    'Dumbbell Shrug',
    'Leg Extension',
    'Horizontal Leg Press',
    'Chest Press',
    'Hack Squat',
    'Machine Shoulder Press',
    'Machine Chest Fly',
    'Seated Leg Curl',
    'Lying Leg Curl',
    'Machine Calf Raise',
    'Hip Adduction',
    'Lat Pulldown',
    'Tricep Pushdown',
    'Seated Cable Row'
);
update public.exercises set hidden = true where user_id is null and name not in (
    'Bench Press',
    'Squat',
    'Deadlift',
    'Shoulder Press',
    'Pull Ups',
    'Dumbbell Bench Press',
    'Dumbbell Curl',
    'Push Ups',
    'Sled Leg Press',
    'Barbell Curl',
    'Incline Dumbbell Bench Press',
    'Bent Over Row',
    'Incline Bench Press',
    'Front Squat',
    'Hex Bar Deadlift',
    'Hip Thrust',
    'Romanian Deadlift',
    'Power Clean',
    'Military Press',
    'Sumo Deadlift',
    'Clean and Jerk',
    'EZ Bar Curl',
    'Lying Tricep Extension',
    'Close Grip Bench Press',
    'Snatch',
    'Preacher Curl',
    'Seated Shoulder Press',
    'Barbell Shrug',
    'T Bar Row',
    'Clean',
    'Push Press',
    'Smith Machine Bench Press',
    'Decline Bench Press',
    'Dips',
    'Chin Ups',
    'Crunches',
    'Sit Ups',
    'Muscle Ups',
    'Bodyweight Squat',
    'One Arm Push Ups',
    'Neutral Grip Pull Ups',
    'Diamond Push Ups',
    'Dumbbell Shoulder Press',
    'Dumbbell Lateral Raise',
    'Dumbbell Row',
    'Hammer Curl',
    'Seated Dumbbell Shoulder Press',
    'Dumbbell Bulgarian Split Squat',
    'Goblet Squat',
    'Dumbbell Fly',
    'Dumbbell Shrug',
    'Leg Extension',
    'Horizontal Leg Press',
    'Chest Press',
    'Hack Squat',
    'Machine Shoulder Press',
    'Machine Chest Fly',
    'Seated Leg Curl',
    'Lying Leg Curl',
    'Machine Calf Raise',
    'Hip Adduction',
    'Lat Pulldown',
    'Tricep Pushdown',
    'Seated Cable Row'
);
